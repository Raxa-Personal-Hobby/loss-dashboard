// End-to-end checks for the safety report merge, on synthetic data only.
// Run: node --test --import ./tests/loader.mjs tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { INDUSTRIES } from "../src/lib/industries";
import { makeSafetyTable, makeSampleHours, makeSampleTable, SAMPLE_VALUATION } from "../src/lib/sample";
import { autoMap, fieldsFor } from "../src/lib/fields";
import { buildClaims, detectHeaderRow, hoursFromTables } from "../src/lib/parse";
import { DEFAULT_MATCH, matchLocations, parseLocation } from "../src/lib/locmatch";
import { autoMapSafety, buildMerge, combinedConcerns, combinedLocations, detectSafetyHeader, parseSafetyReport, safetyMappingProblems } from "../src/lib/safetyreport";
import { exactLocation, safetyLocations, safetyScope, safetyYears } from "../src/lib/safety";
import { DEFAULT_THRESHOLDS } from "../src/lib/thresholds";
import { EMPTY_FILTERS, type LocationLink } from "../src/lib/types";
import { yearsIn } from "../src/lib/metrics";

const bench = { kind: "bls", trc: 3.0, dart: 1.6, dafw: 1.0, label: "test", note: "" } as any;

function lossRun(ind: (typeof INDUSTRIES)[number]) {
  const t = makeSampleTable(ind);
  const F = fieldsFor(ind);
  const h = detectHeaderRow(t.rows, F);
  return buildClaims(t, h, autoMap(t.rows[h], F), ind.coverages[0].key, ind).claims;
}

function safetyReport(ind: (typeof INDUSTRIES)[number]) {
  const { table, truth } = makeSafetyTable(ind);
  const h = detectSafetyHeader(table.rows);
  const m = autoMapSafety(table.rows[h]);
  return { report: parseSafetyReport(table, h, m, "test"), truth, mapping: m, headers: table.rows[h] };
}

test("normalization pulls out site numbers and short forms", () => {
  assert.deepEqual(parseLocation("#401 Las Vegas Strip").nums, ["401"]);
  assert.deepEqual(parseLocation("Store 0401").nums, ["401"]);
  assert.deepEqual(parseLocation("P-2103 Eastgate Retail Center").nums, ["2103"]);
  assert.deepEqual(parseLocation("1200 Main Street").nums, ["1200"]); // leading number counts
  assert.deepEqual(parseLocation("Main Street 1200").nums, []); // a trailing street-style number doesn't
  assert.equal(parseLocation("Saint Louis").compact, parseLocation("St. Louis").compact);
  assert.deepEqual(parseLocation("Ontario, CA Terminal").states, ["ca"]);
});

test("conflicting numbers and directions are never suggested", () => {
  const r = matchLocations(["#401 Las Vegas Strip", "Mesa East"], ["#402 Las Vegas Strip", "Mesa West"]);
  for (const s of r.suggestions) {
    assert.equal(s.a, null, `${s.b} should be unmatched`);
    assert.match(s.notes.join(" "), /differ/);
  }
});

test("look-alike names of different places are never pre-checked", () => {
  for (const [a, b] of [["Austin Branch", "Justin Branch"], ["Henderson", "Anderson"], ["Fountain Valley Plaza", "Mountain Valley Plaza"]]) {
    assert.notEqual(matchLocations([a], [b]).suggestions[0].tier, "high", `${a} vs ${b}`);
  }
  // A typo alone can be suggested, but only pre-checked when a number agrees.
  assert.equal(matchLocations(["Anaheim Hills"], ["Anahiem Hills"]).suggestions[0].tier, "medium");
  assert.equal(matchLocations(["#101 Anaheim Hills"], ["Anahiem Hills #101"]).suggestions[0].tier, "high");
});

test("a tie is surfaced, never pre-checked", () => {
  const r = matchLocations(["Las Vegas Strip North", "Las Vegas Strip South"], ["Las Vegas Strip"]);
  assert.notEqual(r.suggestions[0].tier, "high");
});

test("number-only match needs the number to be unique", () => {
  const ok = matchLocations(["#401 Las Vegas Strip", "#402 Henderson"], ["Store 401"]);
  assert.equal(ok.suggestions[0].a, "#401 Las Vegas Strip");
  assert.equal(ok.suggestions[0].tier, "medium");
  const dup = matchLocations(["#401 Las Vegas Strip", "401 Henderson Plaza"], ["Store 401"]);
  assert.notEqual(dup.suggestions[0].tier, "high");
});

for (const ind of INDUSTRIES) {
  test(`${ind.id}: matching on the messy sample report`, () => {
    const claims = lossRun(ind);
    const { report, truth } = safetyReport(ind);
    const aNames = [...new Set(claims.map((c) => c.location))];
    const r = matchLocations(aNames, report.locations, DEFAULT_MATCH);
    const highWrong = r.suggestions.filter((s) => s.tier === "high" && s.a !== truth[s.b]);
    assert.deepEqual(highWrong.map((s) => `${s.b} -> ${s.a}`), [], "no wrong pre-checked pairs");
    const real = r.suggestions.filter((s) => truth[s.b]);
    const surfaced = real.filter((s) => s.a === truth[s.b] && s.tier !== "low");
    const recall = surfaced.length / real.length;
    assert.ok(recall >= 0.95, `recall ${recall.toFixed(2)}; missed: ${real.filter((s) => !surfaced.includes(s)).map((s) => `${s.b} -> ${s.a ?? "none"} (${s.notes.join("; ")})`).join(" | ")}`);
    // Decoys and safety-only names are never pre-checked.
    for (const s of r.suggestions.filter((x) => truth[x.b] === null)) assert.notEqual(s.tier, "high", `${s.b} must not be pre-checked`);
    // The split location shows as one-to-many, not pre-checked.
    const splitA = ind.sample.units[1].name;
    const splitRows = r.suggestions.filter((s) => truth[s.b] === splitA);
    assert.equal(splitRows.length, 2);
    for (const s of splitRows) assert.notEqual(s.tier, "high");
  });

  test(`${ind.id}: merge keeps every location and feeds the safety rates`, () => {
    const claims = lossRun(ind);
    const { report, truth } = safetyReport(ind);
    assert.ok(report.hoursConflicts.length >= 1, "the planted hours disagreement is surfaced");
    const links: LocationLink[] = report.locations.map((b) => ({ b, a: truth[b] ?? null, tier: "high", score: 100, reasons: [] }));
    const m = buildMerge(claims, report, links);
    const onlyLoss = ind.sample.units[ind.sample.units.length - 1].name;
    assert.ok(m.onlyA.includes(onlyLoss), "loss-run-only location kept");
    assert.ok(m.onlyB.includes("Regional Training Center"), "safety-only location kept");
    assert.equal(m.rows.length, report.cases.length, "no case dropped");
    const years = yearsIn(claims);
    const scoped = safetyScope(m.rows, EMPTY_FILTERS);
    const rows = safetyYears(scoped, years, m.hours, null, SAMPLE_VALUATION, exactLocation);
    assert.ok(rows.some((y) => y.trir != null), "TRIR works from the safety report");
    const locs = safetyLocations(scoped, years, m.hours, bench, DEFAULT_THRESHOLDS, exactLocation);
    assert.ok(locs.some((l) => l.location === "Regional Training Center"));
    // Combined view and findings.
    const comb = combinedLocations(claims, m, scoped, years);
    const found = combinedConcerns(comb, bench, ind, DEFAULT_THRESHOLDS);
    const ids = found.map((f) => f.id);
    assert.ok(ids.includes("combined-rec-gap"), `planted recordable gap found (${ids.join(", ")})`);
    assert.ok(ids.includes("combined-rec-extra"), `planted extra recordables found (${ids.join(", ")})`);
    for (const f of found) assert.ok(f.action && f.sources.length, `${f.id} has guidance with a source`);
  });

  test(`${ind.id}: single-report safety numbers are unchanged`, () => {
    const claims = lossRun(ind);
    const hw = hoursFromTables([makeSampleHours(ind)])!;
    const years = yearsIn(claims);
    const scoped = safetyScope(claims, EMPTY_FILTERS);
    const a = safetyYears(scoped, years, hw.hours, null, SAMPLE_VALUATION);
    const b = safetyYears(scoped, years, hw.hours, null, SAMPLE_VALUATION, undefined);
    assert.deepEqual(a, b);
    const recs = claims.filter((c) => c.recordable === true).length;
    assert.equal(a.reduce((s, y) => s + y.recordable, 0), recs);
  });
}

test("employee columns are never matched", () => {
  const m = autoMapSafety(["Employee Name", "Establishment", "Year", "Classify the Case"]);
  assert.equal(m.location, 1);
  assert.ok(!Object.values(m).includes(0));
  assert.deepEqual(safetyMappingProblems(m), []);
});

test("an unmatched name equal to a loss run name can't join by accident", () => {
  const claims = lossRun(INDUSTRIES[0]);
  const a = claims[0].location;
  const report = { sourceName: "t", cases: [{ sourceLocation: a, year: 2025, recordable: true, caseType: "Other" as const, daysAway: null, daysRestricted: null }], hours: [], hoursConflicts: [], locations: [a], rowsRead: 1, rowsSkipped: 0, hasCaseTypes: true, hasDays: false };
  const m = buildMerge(claims, report, [{ b: a, a: null, tier: "low", score: 0, reasons: [] }]);
  assert.equal(m.rows[0].location, `${a} (safety report)`);
});

