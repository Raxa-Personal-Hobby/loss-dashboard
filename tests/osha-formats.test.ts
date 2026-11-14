// OSHA file layouts the safety report reader has to understand. All rows are made up.
// Column names follow OSHA's ITA Case Data CSV Specifications (v1.5) and the OSHA Form 300 column headings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { INDUSTRIES } from "../src/lib/industries";
import { SAFETY_FIELDS, SAFETY_TEMPLATE_HEADERS, autoMapSafety, detectSafetyHeader, parseSafetyReport, safetyTemplateRows, withCheckBoxCaseType } from "../src/lib/safetyreport";

const read = (rows: unknown[][]) => {
  const t = withCheckBoxCaseType({ name: "t", rows });
  const h = detectSafetyHeader(t.rows);
  const m = autoMapSafety(t.rows[h]);
  return { m, r: parseSafetyReport(t, h, m, "t") };
};
const summary = (r: ReturnType<typeof read>["r"]) => r.cases.map((c) => [c.sourceLocation, c.year, c.recordable, c.caseType, c.daysAway, c.daysRestricted]);

test("OSHA ITA case data CSV: outcome codes and day counts", () => {
  const head = ["establishment_name", "year_of_filing", "case_number", "job_title", "date_of_incident", "incident_location", "incident_description", "incident_outcome", "dafw_num_away", "djtr_num_tr", "type_of_incident", "date_of_birth", "date_of_hire"];
  const { m, r } = read([
    head,
    ["Plant 7", 2025, "1", "Operator", "03-02-2025", "Loading dock", "Strain", 2, 5, 0, 1, "01-01-1990", "01-01-2020"],
    ["Plant 7", 2025, "2", "Operator", "04-02-2025", "Line 3", "Cut", 3, 0, 7, 1, "01-01-1990", "01-01-2020"],
    ["Plant 7", 2025, "3", "Operator", "05-02-2025", "Office", "Rash", 4, 0, 0, 2, "01-01-1990", "01-01-2020"],
    ["Plant 7", 2025, "4", "Operator", "06-02-2025", "Yard", "Crush", 1, 0, 0, 1, "01-01-1990", "01-01-2020"],
  ]);
  assert.equal(m.location, 0, "establishment_name is the site, not incident_location");
  assert.deepEqual(summary(r), [
    ["Plant 7", 2025, true, "DAFW", 5, 0],
    ["Plant 7", 2025, true, "DJTR", 0, 7],
    ["Plant 7", 2025, true, "Other", 0, 0],
    ["Plant 7", 2025, true, null, 0, 0],
  ]);
});

test("OSHA Form 300 typed into a sheet: check marks in G to J, day counts in K and L", () => {
  const head = ["Case No.", "Employee's Name", "Job Title", "Date of injury or onset of illness", "Where the event occurred", "Describe injury or illness", "Death", "Days away from work", "Job transfer or restriction", "Other recordable cases", "Away from work (days)", "On job transfer or restriction (days)", "Establishment"];
  const { m, r } = read([
    head,
    ["1", "x", "Cook", "03/02/2025", "Kitchen", "Cut", "", "X", "", "", 5, "", "Store 401"],
    ["2", "x", "Cook", "04/02/2025", "Kitchen", "Strain", "", "", "✓", "", "", 7, "Store 401"],
    ["3", "x", "Cook", "05/02/2025", "Kitchen", "Burn", "", "", "", "x", "", "", "Store 401"],
  ]);
  assert.equal(m.location, 12, "Where the event occurred is not the site");
  assert.deepEqual(summary(r), [
    ["Store 401", 2025, true, "DAFW", 5, null],
    ["Store 401", 2025, true, "DJTR", null, 7],
    ["Store 401", 2025, true, "Other", null, null],
  ]);
});

test("a sheet with numbers under Death / Days away headers is left alone", () => {
  const rows = [["Site", "Year", "Death", "Days away from work", "Job transfer or restriction", "Other recordable cases"], ["A", 2025, 0, 3, 1, 2]];
  assert.equal(withCheckBoxCaseType({ name: "t", rows }).rows, rows);
});

test("the blank safety report template auto-matches every column", () => {
  const m = autoMapSafety(SAFETY_TEMPLATE_HEADERS);
  const keys = ["location", "year", "date", "caseType", "daysAway", "daysRestricted", "recordable", "hours"] as const;
  keys.forEach((k, i) => assert.equal(m[k], i, k));
  assert.ok(SAFETY_FIELDS.every((f) => f.key === "employees" || m[f.key] >= 0));
  const { r } = read(safetyTemplateRows(INDUSTRIES[0]));
  assert.equal(r.cases.length, 3);
  assert.deepEqual(r.cases.map((c) => c.recordable), [true, true, false]);
  assert.equal(r.hours.length, 1);
});
