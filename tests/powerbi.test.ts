// Checks for the "Power BI data model" export, on synthetic data only.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { INDUSTRIES } from "../src/lib/industries";
import { makeSampleHours, makeSampleTable, SAMPLE_VALUATION } from "../src/lib/sample";
import { analyzeTables } from "../src/lib/headless";
import { POWERBI_COLUMNS, powerBiWorkbook } from "../src/lib/powerbi";
import { fmtDay } from "../src/lib/normalize";

const valuation = fmtDay(SAMPLE_VALUATION, "iso");

/** Write the workbook to bytes and read it back, the way Power BI would see it. */
function roundTrip(wb: XLSX.WorkBook) {
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  return XLSX.read(buf, { type: "buffer", cellDates: true });
}
const rowsOf = (wb: XLSX.WorkBook, name: string) => XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: null });
const headerOf = (wb: XLSX.WorkBook, name: string) => XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1 })[0];

// The contract people build reports on. Changing this list breaks their reports on refresh.
test("sheet names and column names are frozen", () => {
  assert.deepEqual(Object.keys(POWERBI_COLUMNS), ["Claims", "Locations", "Findings", "Summary", "Safety by Year", "Safety by Location", "About"]);
  assert.equal(POWERBI_COLUMNS.Claims.length, 29);
  assert.equal(POWERBI_COLUMNS.Locations.length, 18);
  assert.equal(POWERBI_COLUMNS.Findings.length, 11);
  assert.ok(!(POWERBI_COLUMNS.Claims as readonly string[]).includes("Claimant"), "claimant names must never be exported");
});

for (const ind of INDUSTRIES) {
  test(`${ind.id}: sample loss run with hours gives every table, matching the claims`, () => {
    const tables = [makeSampleTable(ind), { ...makeSampleHours(ind), name: "Hours Worked" }];
    const r = analyzeTables(tables, { sourceName: "sample.xlsx", industry: ind.id, valuation, isSample: true });
    const wb = roundTrip(powerBiWorkbook(r.input));

    assert.deepEqual(wb.SheetNames, Object.keys(POWERBI_COLUMNS));
    for (const name of wb.SheetNames) assert.deepEqual(headerOf(wb, name), [...POWERBI_COLUMNS[name as keyof typeof POWERBI_COLUMNS]], `${name} header`);

    const claims = rowsOf(wb, "Claims");
    assert.equal(claims.length, r.input.filtered.length);
    assert.ok(claims.length > 50);
    const inc = claims.reduce((s, c) => s + (c.Incurred as number), 0);
    const want = r.input.filtered.reduce((s, c) => s + c.incurred, 0);
    assert.ok(Math.abs(inc - want) < 1, `incurred total ${inc} vs ${want}`);
    assert.ok(claims[0]["Loss Date"] instanceof Date, "loss date is a real date, not text");
    assert.equal(typeof claims[0].Litigated, "boolean");

    // Every claim's location is in the Locations table, so a relationship works.
    const locs = new Set(rowsOf(wb, "Locations").map((l) => l.Location));
    for (const c of claims) assert.ok(locs.has(c.Location), `location ${c.Location} missing`);

    assert.equal(rowsOf(wb, "Summary").length, 6);
    assert.ok(rowsOf(wb, "Findings").length > 0);
    assert.ok(rowsOf(wb, "Safety by Year").length > 0, "sample has OSHA columns and hours");
    const about = Object.fromEntries(rowsOf(wb, "About").map((a) => [a.Field, a.Value]));
    assert.equal(about["Schema version"], 1);
    assert.equal(about["Claims in this file"], claims.length);
  });
}

test("a loss run with no hours still writes the safety sheets with headers only", () => {
  const ind = INDUSTRIES.find((i) => i.id === "general")!;
  const t = makeSampleTable(ind);
  const keep = t.rows[0].map((h, i) => (/osha|case|days|recordable/i.test(String(h)) ? -1 : i)).filter((i) => i >= 0);
  const slim = { name: "Loss Run", rows: t.rows.map((row) => keep.map((i) => row[i])) };
  const r = analyzeTables([slim], { sourceName: "slim.csv", valuation });
  assert.equal(r.input.safety, undefined);
  const wb = roundTrip(powerBiWorkbook(r.input));
  assert.deepEqual(headerOf(wb, "Safety by Year"), [...POWERBI_COLUMNS["Safety by Year"]]);
  assert.equal(rowsOf(wb, "Safety by Year").length, 0);
  assert.equal(rowsOf(wb, "Safety by Location").length, 0);
});

test("a file with no readable loss dates fails with a clear message", () => {
  assert.throws(() => analyzeTables([{ name: "Sheet1", rows: [["Claim Number", "Amount"], ["1", 5]] }], { sourceName: "bad.csv" }), /date of loss/i);
});

test("loss dates land on the same calendar day in Excel (no time zone drift)", () => {
  const ind = INDUSTRIES[0];
  const r = analyzeTables([makeSampleTable(ind)], { sourceName: "s.xlsx", industry: ind.id, valuation });
  const buf = XLSX.write(powerBiWorkbook(r.input), { bookType: "xlsx", type: "buffer" });
  const ws = XLSX.read(buf, { type: "buffer" }).Sheets.Claims; // raw serial numbers, as Power BI reads them
  const col = POWERBI_COLUMNS.Claims.indexOf("Loss Date");
  for (let i = 0; i < 20; i++) {
    const cell = ws[XLSX.utils.encode_cell({ r: i + 1, c: col })];
    const want = fmtDay(r.input.filtered[i].lossDay, "iso");
    assert.equal(XLSX.SSF.format("yyyy-mm-dd", cell.v), want, `row ${i + 2}`);
  }
});

test("claimant names are blanked out of descriptions; the rest of the note stays", () => {
  const rows = [
    ["Claim Number", "Claimant Name", "Location", "Date of Loss", "Coverage", "Status", "Total Incurred", "Adjuster Notes"],
    ["WC-1", "Zorblatt Quimby", "Site A", "03/02/2026", "WC", "Open", "8200", "Claimant Zorblatt Quimby reports back pain"],
    ["WC-2", "Farnsworthy, Velma", "Site B", "05/14/2026", "WC", "Closed", "2150", "VELMA farnsworthy returned to work; Velma's shift ended"],
    ["GL-3", "Guest", "Site A", "06/01/2026", "GL", "Open", "500", "Guest slipped near the entrance"],
  ];
  const r = analyzeTables([{ name: "Loss Run", rows }], { sourceName: "pii.csv", valuation });
  const all = JSON.stringify(rowsOf(roundTrip(powerBiWorkbook(r.input)), "Claims"));
  for (const name of ["Zorblatt", "Quimby", "Velma", "VELMA", "Farnsworthy", "farnsworthy"]) assert.ok(!all.includes(name), `${name} leaked`);
  assert.match(all, /\[claimant\] reports back pain/);
  assert.match(all, /Guest slipped near the entrance/, "generic labels like Guest are left alone");
});
