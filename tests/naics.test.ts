// Checks for the BLS benchmark lookup: 2022 NAICS codes, older 2017 codes, and the picker.
// Run: node --test --import ./tests/loader.mjs tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { SOII_URL, SOII_YEAR, getNaics, lookupNaics, ownershipTotal } from "../src/lib/naics";
import { findIndustries } from "../src/lib/naics-titles";
import { INDUSTRIES } from "../src/lib/industries";
import { SOURCES } from "../src/lib/thresholds";

const row = (code: string) => {
  const m = lookupNaics(code);
  assert.ok(m, `no match for ${code}`);
  return m;
};

test("2022 codes BLS publishes are used as they are", () => {
  for (const [code, trc] of [["45711", 2.1], ["4571", 2.2], ["457", 2.3], ["4551", 3.2], ["722511", 2.0], ["5132", 0.1]] as const) {
    const m = row(code);
    assert.equal(m.rate.code, code);
    assert.equal(m.rate.trc, trc);
    assert.equal(m.exact, true);
    assert.equal(m.note, "");
  }
});

test("a 6-digit 2022 retail code walks up to its own group, not back to 2017", () => {
  // 457110 is the same industry as 45711, so it counts as exact.
  const gas = row("457110");
  assert.equal(gas.rate.code, "45711");
  assert.equal(gas.rate.trc, 2.1);
  assert.equal(gas.exact, true);
  for (const [code, group] of [["455110", "4551"], ["456110", "4561"], ["458110", "4581"]] as const) {
    const m = row(code);
    assert.ok(m.rate.code.startsWith(group), `${code} went to ${m.rate.code}`);
    assert.doesNotMatch(m.note, /2017|still reports/);
  }
});

test("2017 codes that 2022 NAICS dropped land on their 2022 industry", () => {
  const cases: [string, string, number][] = [
    ["447110", "45711", 2.1], // Gasoline stations with convenience stores
    ["44711", "45711", 2.1],
    ["447", "4571", 2.2], // Gasoline stations
    ["452210", "4551", 3.2], // Department stores
    ["511210", "5132", 0.1], // Software publishers
  ];
  for (const [typed, code, trc] of cases) {
    const m = row(typed);
    assert.equal(m.rate.code, code, `${typed} went to ${m.rate.code}`);
    assert.equal(m.rate.trc, trc);
    assert.equal(m.exact, false);
    assert.match(m.note, new RegExp(`^${typed} is a 2017 NAICS code`));
  }
});

test("a 2017 industry that was split up falls back to the sector its pieces share", () => {
  const m = row("454110"); // Electronic shopping and mail-order houses
  assert.equal(m.rate.code, "44-45");
  assert.match(m.note, /2017 NAICS code that BLS no longer reports/);
});

test("codes that did not change keep the old wording", () => {
  const m = row("492110");
  assert.equal(m.rate.code, "4921");
  assert.match(m.note, /^BLS doesn't publish 492110\. Using 4921/);
  assert.equal(row("238120").exact, true);
});

test("every industry the search offers gets an industry rate, never the all-industry fallback", () => {
  const missed: string[] = [];
  for (const q of ["gasoline", "convenience store", "department store", "pharmacy", "clothing store", "software", "newspaper", "furniture store", "roofing", "restaurant"]) {
    const hits = findIndustries(q);
    assert.ok(hits.length > 0, `no hits for "${q}"`);
    for (const h of hits) if (!h.bls || !h.bls.rate.code) missed.push(`${q}: ${h.code}`);
  }
  assert.deepEqual(missed, []);
  const gas = findIndustries("gasoline").find((h) => /convenience/i.test(h.title));
  assert.equal(gas?.bls?.rate.trc, 2.1);
});

test("template quick picks are all published rows", () => {
  for (const ind of INDUSTRIES) {
    for (const code of ind.bls.options) {
      const r = code === "private" ? ownershipTotal("private") : getNaics(code);
      assert.ok(r, `${ind.id}: ${code} is not in the ${SOII_YEAR} table`);
    }
  }
});

test("the BLS source note names the year and file the rates came from", () => {
  assert.equal(SOURCES.bls.short, `BLS SOII, ${SOII_YEAR}`);
  assert.ok(SOURCES.bls.text.includes(`case types, ${SOII_YEAR}.`));
  assert.equal(SOURCES.bls.url, SOII_URL);
});
