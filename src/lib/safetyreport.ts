// A second report, the safety report (OSHA 300 log export or an internal safety sheet),
// joined to the loss run on Location + Year after the user confirms every location pair.
//
// Rules (see the spec in the pull request):
// - Recordables, case types and days come from the safety report once it is loaded. The loss
//   run's own OSHA columns are not used for rates then, so nothing is counted twice.
// - Hours come from the safety report when it has them, otherwise from the loss run's hours.
// - After confirmation, names are joined by exact match only. No fuzzy matching runs later.
// - Locations in only one report are kept, never dropped.
import type { Claim, HoursConflict, HoursRow, LocationLink, OshaRow, ParsedSafetyReport, SafetyCase, SafetyMerge } from "./types";
import type { Industry } from "./industries";
import type { Benchmark } from "./bls";
import type { Concern } from "./metrics";
import type { Thresholds } from "./thresholds";
import { norm, scoreHeader } from "./fields";
import { clean, fromDay, parseDay, parseMoney, resolveOsha } from "./normalize";
import { BASE_HOURS, fmtRate, rateOf } from "./safety";
import { asFinding, guideForFinding } from "./guidance";

/* ---------------- Columns ---------------- */

export type SafetyKey = "location" | "year" | "date" | "recordable" | "caseType" | "daysAway" | "daysRestricted" | "hours" | "employees";

export interface SafetyFieldDef {
  key: SafetyKey;
  label: string;
  required?: boolean;
  synonyms: string[];
  help: string;
}

export const SAFETY_FIELDS: SafetyFieldDef[] = [
  { key: "location", label: "Location", required: true, synonyms: ["location", "locationname", "site", "sitename", "store", "storename", "storenumber", "establishment", "establishmentname", "facility", "branch", "project", "projectname", "jobsite", "terminal", "property", "propertyname", "unit", "plant", "department", "wheretheeventoccurred"], help: "Matched to the loss run's locations on the next screen." },
  { key: "year", label: "Year", synonyms: ["year", "calendaryear", "logyear", "reportingyear", "yr", "fiscalyear", "planyear", "oshayear"], help: "The log year. Needed unless a date is given." },
  { key: "date", label: "Date of injury", synonyms: ["dateofinjury", "injurydate", "dateofinjuryoronsetofillness", "dateofincident", "incidentdate", "eventdate", "dateofevent", "accidentdate", "dateofaccident", "date", "dateofloss", "lossdate", "doi", "occurrencedate"], help: "Sets the year when there's no Year column." },
  { key: "recordable", label: "OSHA recordable", synonyms: ["osharecordable", "recordable", "oshareportable", "osha", "oshacase", "isrecordable", "recordableyn", "oshayn", "oshaflag", "recordablecase"], help: "Yes or No." },
  { key: "caseType", label: "OSHA case type", synonyms: ["oshacasetype", "casetype", "caseclassification", "classification", "oshaclassification", "oshaclass", "classifythecase", "outcome", "caseoutcome", "recordabletype", "oshacategory"], help: "Days away, Job transfer or restriction, Other recordable." },
  { key: "daysAway", label: "Days away from work", synonyms: ["daysaway", "daysawayfromwork", "awayfromwork", "lostdays", "lostworkdays", "dayslost", "losttimedays", "dafwdays", "columnk", "k"], help: "OSHA 300 column K." },
  { key: "daysRestricted", label: "Days of job transfer or restriction", synonyms: ["daysrestricted", "restricteddays", "daysofrestriction", "onjobtransferorrestriction", "daysjobtransferorrestriction", "jobtransferdays", "restricteddutydays", "djtrdays", "columnl", "l"], help: "OSHA 300 column L." },
  { key: "hours", label: "Hours worked", synonyms: ["hoursworked", "totalhoursworked", "totalhours", "hours", "employeehours", "manhours", "workhours", "laborhours", "hrsworked", "exposurehours", "totalhoursworkedbyallemployees"], help: "For that location and year. Repeating it on every row is fine." },
  { key: "employees", label: "Average employees", synonyms: ["averageemployees", "avgemployees", "averagenumberofemployees", "annualaverageemployees", "employees", "headcount", "fte", "ftes", "employeecount"], help: "Used as 2,000 hours each when hours are missing." },
];

export type SafetyMapping = Record<SafetyKey, number>;

export const emptySafetyMapping = (): SafetyMapping => Object.fromEntries(SAFETY_FIELDS.map((f) => [f.key, -1])) as SafetyMapping;

/** Auto-match safety report columns, the same way the loss run columns are matched. Employee names are never matched. */
export function autoMapSafety(headers: unknown[]): SafetyMapping {
  const map = emptySafetyMapping();
  const hs = headers.map(norm);
  const cands: { col: number; key: SafetyKey; score: number }[] = [];
  hs.forEach((h, col) => {
    if (/name|employee|worker|claimant|person/.test(h) && !/location|site|store|establishment|facility|project|property/.test(h)) return;
    for (const f of SAFETY_FIELDS) {
      // One-letter synonyms (OSHA column letters) only count as exact matches.
      const syn = f.synonyms.filter((s) => s.length > 1 || h === s);
      const { score } = scoreHeader(h, { synonyms: syn });
      if (score >= 52) cands.push({ col, key: f.key, score });
    }
  });
  cands.sort((a, b) => b.score - a.score || a.col - b.col);
  const used = new Set<number>();
  for (const c of cands) {
    if (used.has(c.col) || map[c.key] >= 0) continue;
    map[c.key] = c.col;
    used.add(c.col);
  }
  return map;
}

export function detectSafetyHeader(rows: unknown[][]): number {
  let best = 0;
  let bestN = -1;
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const m = autoMapSafety(rows[r] ?? []);
    const n = Object.values(m).filter((c) => c >= 0).length + (m.location >= 0 ? 2 : 0);
    if (n > bestN) {
      best = r;
      bestN = n;
    }
  }
  return best;
}

export function safetyMappingProblems(m: SafetyMapping): string[] {
  const out: string[] = [];
  if (m.location < 0) out.push("Pick the Location column.");
  if (m.year < 0 && m.date < 0) out.push("Pick a Year or Date of injury column.");
  if (m.recordable < 0 && m.caseType < 0 && m.daysAway < 0 && m.daysRestricted < 0 && m.hours < 0 && m.employees < 0) out.push("Pick at least one OSHA or hours column.");
  return out;
}

/* ---------------- Reading rows ---------------- */

const BLANK_LOC = "(blank location)";

function yearOf(v: unknown): number | null {
  if (typeof v === "number" && v >= 1990 && v <= 2100) return Math.floor(v);
  const m = String(v ?? "").match(/\b(19|20)\d{2}\b/);
  if (m && String(v).trim().length <= 9) return Number(m[0]);
  const d = parseDay(v);
  return d != null ? fromDay(d).y : m ? Number(m[0]) : null;
}

interface Table {
  name: string;
  rows: unknown[][];
}

export function parseSafetyReport(table: Table, headerRow: number, m: SafetyMapping, sourceName: string): ParsedSafetyReport {
  const has = (k: SafetyKey) => m[k] >= 0;
  const cases: SafetyCase[] = [];
  const locations: string[] = [];
  const seen = new Set<string>();
  const onRows = new Map<string, { values: Set<number>; estimated: boolean }>();
  const onlyHours = new Map<string, { hours: number; estimated: boolean }>();
  let rowsRead = 0;
  let rowsSkipped = 0;
  for (const row of table.rows.slice(headerRow + 1)) {
    if (!row || row.every((c) => c === "" || c == null)) continue;
    if (row.some((c) => /^\s*(grand\s+)?totals?\s*:?\s*$/i.test(String(c ?? "")))) continue;
    rowsRead++;
    const get = (k: SafetyKey) => (has(k) ? row[m[k]] : undefined);
    const year = (has("year") ? yearOf(get("year")) : null) ?? (has("date") ? yearOf(get("date")) : null);
    if (year == null) {
      rowsSkipped++;
      continue;
    }
    const rawLoc = clean(get("location"));
    const caseCells = (["recordable", "caseType", "daysAway", "daysRestricted"] as SafetyKey[]).some((k) => has(k) && clean(get(k)) !== "");
    let hours = has("hours") ? parseMoney(get("hours")) : 0;
    let estimated = false;
    if (!(hours > 0) && has("employees")) {
      const e = parseMoney(get("employees"));
      if (e > 0) {
        hours = e * 2000;
        estimated = true;
      }
    }
    if (!caseCells && !(hours > 0)) {
      rowsSkipped++;
      continue;
    }
    // Company-wide hours rows have no location; cases with no location are kept under a label.
    const location = rawLoc || (caseCells ? BLANK_LOC : "");
    if (location && !seen.has(location)) {
      seen.add(location);
      locations.push(location);
    }
    if (hours > 0) {
      const key = `${location}\u0000${year}`;
      if (caseCells) {
        const cur = onRows.get(key) ?? { values: new Set<number>(), estimated: false };
        cur.values.add(hours);
        cur.estimated ||= estimated;
        onRows.set(key, cur);
      } else {
        const cur = onlyHours.get(key) ?? { hours: 0, estimated: false };
        cur.hours += hours;
        cur.estimated ||= estimated;
        onlyHours.set(key, cur);
      }
    }
    if (caseCells) {
      const o = resolveOsha(
        { recordable: has("recordable"), caseType: has("caseType"), daysAway: has("daysAway"), daysRestricted: has("daysRestricted") },
        { recordable: get("recordable"), caseType: get("caseType"), daysAway: get("daysAway"), daysRestricted: get("daysRestricted") },
      );
      cases.push({ sourceLocation: location, year, ...o });
    }
  }
  // Hours: rows that only carry hours are added up (like an hours sheet). Hours repeated on
  // case rows must agree. Anything that disagrees is held back for the user to settle.
  const hours: HoursRow[] = [];
  const hoursConflicts: HoursConflict[] = [];
  const keys = new Set([...onRows.keys(), ...onlyHours.keys()]);
  for (const key of keys) {
    const [location, y] = key.split("\u0000");
    const year = Number(y);
    const a = onRows.get(key);
    const b = onlyHours.get(key);
    const values = [...(a?.values ?? [])];
    if (b && !values.includes(b.hours)) values.push(b.hours);
    const estimated = !!(a?.estimated || b?.estimated);
    if (values.length === 1) hours.push({ location, year, hours: values[0], estimated });
    else hoursConflicts.push({ location, year, values: values.sort((x, z) => z - x), pick: "skip" });
  }
  hours.sort((x, z) => x.year - z.year || x.location.localeCompare(z.location, undefined, { numeric: true }));
  return {
    sourceName,
    cases,
    hours,
    hoursConflicts,
    locations,
    rowsRead,
    rowsSkipped,
    hasCaseTypes: cases.some((c) => c.caseType != null),
    hasDays: cases.some((c) => (c.daysAway ?? 0) > 0 || (c.daysRestricted ?? 0) > 0),
  };
}

/** Hours after the user's choices for rows that disagreed. "skip" leaves that location-year without hours. */
export function settledHours(r: ParsedSafetyReport): HoursRow[] {
  const extra = r.hoursConflicts
    .filter((c) => c.pick !== "skip")
    .map((c) => ({ location: c.location, year: c.year, hours: c.pick === "max" ? c.values[0] : c.values.reduce((s, v) => s + v, 0), estimated: false }));
  return [...r.hours, ...extra];
}

/* ---------------- Merge ---------------- */

/**
 * Join the safety report to the loss run with the confirmed links.
 * links: one entry per safety report location; a = loss run name, or null for "no match".
 */
export function buildMerge(claims: Claim[], report: ParsedSafetyReport, links: LocationLink[]): SafetyMerge {
  const aNames = new Set(claims.map((c) => c.location));
  const first = new Map<string, Claim>();
  claims.forEach((c) => first.has(c.location) || first.set(c.location, c));
  const linkOf = new Map(links.map((l) => [l.b, l]));
  // An unmatched safety report name that happens to equal a loss run name gets a suffix, so the
  // exact-name join can't connect two places the user said were different.
  const canon = (b: string): string => {
    if (!b) return "";
    const l = linkOf.get(b);
    if (l?.a && aNames.has(l.a)) return l.a;
    return aNames.has(b) ? `${b} (safety report)` : b;
  };
  const rows: OshaRow[] = report.cases.map((c) => {
    const location = canon(c.sourceLocation);
    const a = first.get(location);
    return { location, region: a?.region ?? "", state: a?.state ?? "", lossYear: c.year, recordable: c.recordable, caseType: c.caseType, daysAway: c.daysAway, daysRestricted: c.daysRestricted, category: "" };
  });
  const acc = new Map<string, HoursRow>();
  for (const h of settledHours(report)) {
    const location = canon(h.location);
    const key = `${location}\u0000${h.year}`;
    const prev = acc.get(key);
    // Several safety report names combined into one location: their hours add up.
    if (prev) {
      prev.hours += h.hours;
      prev.estimated ||= h.estimated;
    } else acc.set(key, { ...h, location });
  }
  const linkedA = new Set(links.filter((l) => l.a && aNames.has(l.a)).map((l) => l.a as string));
  return {
    report,
    links,
    rows,
    hours: [...acc.values()].sort((x, z) => x.year - z.year || x.location.localeCompare(z.location, undefined, { numeric: true })),
    onlyA: [...aNames].filter((a) => !linkedA.has(a)).sort((x, z) => x.localeCompare(z, undefined, { numeric: true })),
    onlyB: report.locations.filter((b) => !linkOf.get(b)?.a || !aNames.has(linkOf.get(b)!.a!)).map(canon),
  };
}

/** Locations that have both loss run claims and confirmed safety report data. */
export const matchedLocations = (m: SafetyMerge) => new Set(m.links.filter((l) => l.a).map((l) => l.a as string));

/* ---------------- Per-location view of both reports ---------------- */

export interface CombinedLocation {
  location: string;
  side: "both" | "loss" | "safety";
  claims: number;
  wcClaims: number;
  wcPaidClaims: number;
  wcIncurred: number;
  incurred: number;
  recordable: number;
  dart: number;
  daysAway: number;
  hours: number | null;
  trir: number | null;
  /** Years the safety report covers for this location (rows or hours). */
  safetyYears: number[];
}

/** One row per location from either report, for the years in view. Claims only count in years the safety report covers, so the two sides compare like for like. */
export function combinedLocations(claims: Claim[], merge: SafetyMerge, rows: OshaRow[], years: number[], likeForLike = true): CombinedLocation[] {
  const yset = new Set(years);
  const matched = matchedLocations(merge);
  const covered = new Map<string, Set<number>>();
  const cover = (loc: string, y: number) => {
    if (!loc || !yset.has(y)) return;
    covered.set(loc, (covered.get(loc) ?? new Set()).add(y));
  };
  merge.rows.forEach((r) => cover(r.location, r.lossYear));
  merge.hours.forEach((h) => cover(h.location, h.year));
  const names = new Set<string>([...claims.map((c) => c.location), ...rows.map((r) => r.location), ...merge.hours.filter((h) => h.location && yset.has(h.year)).map((h) => h.location)]);
  const out: CombinedLocation[] = [];
  for (const location of names) {
    const ys = covered.get(location) ?? new Set<number>();
    const side: CombinedLocation["side"] = matched.has(location) ? "both" : claims.some((c) => c.location === location) ? "loss" : "safety";
    const inYears = (y: number) => yset.has(y) && (!likeForLike || side !== "both" || ys.has(y));
    const cs = claims.filter((c) => c.location === location && inYears(c.lossYear));
    const wc = cs.filter((c) => c.coverage === "WC");
    const rs = rows.filter((r) => r.location === location && yset.has(r.lossYear) && r.recordable === true);
    const hrs = merge.hours.filter((h) => h.location === location && yset.has(h.year)).reduce((s, h) => s + h.hours, 0);
    out.push({
      location,
      side,
      claims: cs.length,
      wcClaims: wc.length,
      wcPaidClaims: wc.filter((c) => c.incurred > 0).length,
      wcIncurred: wc.reduce((s, c) => s + c.incurred, 0),
      incurred: cs.reduce((s, c) => s + c.incurred, 0),
      recordable: rs.length,
      dart: rs.filter((r) => r.caseType === "DAFW" || r.caseType === "DJTR").length,
      daysAway: rs.reduce((s, r) => s + (r.daysAway ?? 0), 0),
      hours: hrs > 0 ? hrs : null,
      trir: hrs > 0 ? rateOf(rs.length, hrs) : null,
      safetyYears: [...ys].sort(),
    });
  }
  return out.sort((x, z) => x.location.localeCompare(z.location, undefined, { numeric: true }));
}

/* ---------------- Combined findings ---------------- */

const list = (xs: string[], n = 4) => xs.slice(0, n).join(" · ") + (xs.length > n ? ` · and ${xs.length - n} more` : "");

/** Findings that need both reports. Location + Year totals only; no case-by-case linking. */
export function combinedConcerns(locs: CombinedLocation[], bench: Benchmark, ind: Industry, th: Thresholds): Concern[] {
  const T = th.find;
  const out: Concern[] = [];
  const both = locs.filter((l) => l.side === "both" && l.safetyYears.length > 0);
  const U = ind.unit;
  const units = (n: number) => `${n} ${n === 1 ? U.one : U.many}`;

  // 1. Far fewer recordables than paid comp claims: the log may be missing cases.
  const low = both.filter((l) => l.wcPaidClaims >= T.recMinClaims && l.recordable < (l.wcPaidClaims * T.recLowShare) / 100);
  if (low.length) {
    out.push({
      id: "combined-rec-gap",
      band: low.length >= 3 ? 3 : 2,
      title: `${units(low.length)} ${low.length === 1 ? "logs" : "log"} far fewer OSHA recordables than paid comp claims`,
      detail: `${list(low.map((l) => `${l.location}: ${l.wcPaidClaims} paid comp claims, ${l.recordable} recordable`))}. Same ${U.many} and years in both reports. Not every comp claim is recordable, but a gap this wide is worth checking against the OSHA log.`,
      ...asFinding(guideForFinding("recGap")),
      weight: 20 + low.length * 3,
      filter: { locations: low.map((l) => l.location) },
    });
  }

  // 2. More recordables than comp claims: injuries on the log without a claim.
  const extra = both.filter((l) => l.recordable >= 3 && l.recordable - l.wcClaims >= T.recExtraMin);
  if (extra.length) {
    out.push({
      id: "combined-rec-extra",
      band: 2,
      title: `${units(extra.length)} ${extra.length === 1 ? "has" : "have"} more OSHA recordables than comp claims`,
      detail: `${list(extra.map((l) => `${l.location}: ${l.recordable} recordable, ${l.wcClaims} comp claims`))}. Possible injuries that were never reported as claims, or claims filed under another ${U.one} name.`,
      ...asFinding(guideForFinding("recExtra")),
      weight: 16 + extra.length * 2,
      filter: { locations: extra.map((l) => l.location) },
    });
  }

  // 3. Above the benchmark TRIR and in the top quarter for comp cost per hour.
  const withHours = both.filter((l) => l.hours && l.hours > 0);
  if (withHours.length >= 4) {
    const cost = (l: CombinedLocation) => (l.wcIncurred * BASE_HOURS) / (l.hours as number);
    const sorted = withHours.map(cost).sort((a, b) => a - b);
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const hot = withHours.filter((l) => l.trir != null && l.trir > bench.trc && l.recordable >= T.locMinCases && cost(l) >= q3);
    if (hot.length) {
      out.push({
        id: "combined-priority",
        band: hot.some((l) => (l.trir as number) >= bench.trc * T.locRateX) ? 4 : 3,
        title: `${units(hot.length)} above ${bench.kind === "custom" ? "your TRIR target" : "the industry TRIR"} and in the top quarter for comp cost per hour`,
        detail: `${list(hot.map((l) => `${l.location}: TRIR ${fmtRate(l.trir)}, $${Math.round(cost(l)).toLocaleString("en-US")} comp incurred per 200,000 hours`))}. Both how often people get hurt and what it costs point to these ${U.many}.`,
        ...asFinding(guideForFinding("hotLocations")),
        weight: 28 + hot.length * 3,
        filter: { locations: hot.map((l) => l.location) },
      });
    }
  }

  // 4. Many days away but little comp cost: lost-time claims may be missing or under-reserved.
  const hrsTot = withHours.reduce((s, l) => s + (l.hours as number), 0);
  const daysTot = withHours.reduce((s, l) => s + l.daysAway, 0);
  if (hrsTot > 0 && daysTot > 0 && withHours.length >= 3) {
    const companySev = (daysTot * BASE_HOURS) / hrsTot;
    const costs = withHours.map((l) => l.wcIncurred / (l.hours as number)).sort((a, b) => a - b);
    const median = costs[Math.floor(costs.length / 2)];
    const odd = withHours.filter((l) => l.daysAway >= 30 && (l.daysAway * BASE_HOURS) / (l.hours as number) >= companySev * T.sevX && l.wcIncurred / (l.hours as number) <= median);
    if (odd.length) {
      out.push({
        id: "combined-days-cost",
        band: 2,
        title: `${units(odd.length)} with many days away but low comp cost`,
        detail: `${list(odd.map((l) => `${l.location}: ${l.daysAway.toLocaleString("en-US")} days away, $${Math.round(l.wcIncurred).toLocaleString("en-US")} comp incurred`))}. Days-away rate at least ${T.sevX}x the company's, with comp cost per hour at or below the middle ${U.one}.`,
        ...asFinding(guideForFinding("daysCost")),
        weight: 14 + odd.length * 2,
        filter: { locations: odd.map((l) => l.location) },
      });
    }
  }
  return out;
}
