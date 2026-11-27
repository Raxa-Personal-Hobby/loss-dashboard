// Checks for reading the as-of date a loss run states about itself, on synthetic rows only.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { INDUSTRIES } from "../src/lib/industries";
import { makeSampleTable, sampleTopLines, SAMPLE_VALUATION } from "../src/lib/sample";
import { analyzeTables } from "../src/lib/headless";
import { detectHeaderRow } from "../src/lib/parse";
import { dayNum } from "../src/lib/normalize";
import { findStatedValuation } from "../src/lib/valuation";

const OCT31 = dayNum(2026, 10, 31);
/** The number Excel stores for a date cell. */
const excelSerial = (day: number) => day + 25569;

const HEADER = ["Claim Number", "Date of Loss", "Date Reported", "Location", "Coverage", "Status", "Paid", "Reserve", "Total Incurred"];
const CLAIM = ["WC-1", "03/04/2026", "03/06/2026", "Plant 1", "WC", "Open", 1000, 500, 1500];
/** A loss run with the given lines above its column headings. */
const withTop = (...top: unknown[][]) => ({ rows: [...top, HEADER, CLAIM], headerRow: top.length });
const stated = (...top: unknown[][]) => {
  const t = withTop(...top);
  return findStatedValuation(t.rows, t.headerRow);
};

test("reads a date written after the label in the same cell", () => {
  assert.equal(stated(["Acme Company loss run"], ["Valued as of 10/31/2026"])?.day, OCT31);
  assert.equal(stated(["Valuation Date: 2026-10-31"])?.day, OCT31);
  assert.equal(stated(["Losses valued as of October 31, 2026"])?.day, OCT31);
  assert.equal(stated(["Evaluation date - 31 Oct 2026"])?.day, OCT31);
  assert.equal(stated(["Loss run for Acme Company as of 10/31/26 (all lines)"])?.day, OCT31);
});

test("reads a date in the cell beside a label", () => {
  assert.equal(stated(["Valuation Date", excelSerial(OCT31)])?.day, OCT31);
  assert.equal(stated(["As of:", "", "10/31/2026"])?.day, OCT31);
});

test("says which words the date came from", () => {
  assert.equal(stated(["Acme Company. Valued as of 10/31/2026. Page 1"])?.text, '"Valued as of 10/31/2026"');
  assert.equal(stated(["Valuation Date", excelSerial(OCT31)])?.text, '"Valuation Date" 10/31/2026');
});

test("skips a label that has no date, and uses a later one that does", () => {
  assert.equal(stated(["Reserves as of last review; valued as of 10/31/2026"])?.day, OCT31);
});

test("does not mistake other words or numbers for an as-of date", () => {
  assert.equal(stated(["Valued customer since 2019"]), null);
  assert.equal(stated(["Reserves as of last review"]), null);
  assert.equal(stated(["As of", 378]), null);
  assert.equal(stated(["Report run 10/31/2026"]), null);
  assert.equal(stated(["Policy period 01/01/2026 to 12/31/2026"]), null);
  assert.equal(stated(), null);
});

test("ignores claim rows, where a description can say 'as of'", () => {
  const rows = [HEADER, ["WC-1", "03/04/2026", "03/06/2026", "Plant 1", "WC", "Open", 1000, 500, "Back at work as of 04/01/2026"]];
  assert.equal(findStatedValuation(rows, 0), null);
});

test("reads a valuation date column, taking the latest date in it", () => {
  const rows = [
    [...HEADER, "Valuation Date"],
    [...CLAIM, "09/30/2026"],
    [...CLAIM, excelSerial(OCT31)],
    [...CLAIM, ""],
  ];
  const got = findStatedValuation(rows, 0);
  assert.equal(got?.day, OCT31);
  assert.equal(got?.text, 'the "Valuation Date" column');
});

test("a line above the headings wins over a column", () => {
  const rows = [["Valued as of 10/31/2026"], [...HEADER, "As Of Date"], [...CLAIM, "09/30/2026"]];
  assert.equal(findStatedValuation(rows, 1)?.day, OCT31);
});

for (const ind of INDUSTRIES) {
  test(`the ${ind.id} sample loss run states its own as-of date`, () => {
    // Through a real workbook, the way the upload window reads it back.
    const ws = XLSX.utils.aoa_to_sheet([...sampleTopLines(ind), ...makeSampleTable(ind).rows]);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "", blankrows: true });
    assert.equal(findStatedValuation(rows, detectHeaderRow(rows))?.day, SAMPLE_VALUATION);
  });
}

test("the no-browser command uses the stated date unless one is given", () => {
  const tables = [{ name: "Loss Run", rows: [["Valued as of 10/31/2026"], HEADER, CLAIM] }];
  assert.equal(analyzeTables(tables, { sourceName: "test.xlsx" }).input.valuationDay, OCT31);
  assert.equal(analyzeTables(tables, { sourceName: "test.xlsx", valuation: "2026-06-30" }).input.valuationDay, dayNum(2026, 6, 30));
  // Without a stated date it stays the latest date in the file.
  assert.equal(analyzeTables([{ name: "Loss Run", rows: [HEADER, CLAIM] }], { sourceName: "test.xlsx" }).input.valuationDay, dayNum(2026, 3, 6));
});
