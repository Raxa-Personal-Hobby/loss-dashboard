// OSHA incidence rates. Same formula BLS and OSHA use:
//   rate = cases x 200,000 / hours worked
// 200,000 hours = 100 full-time workers x 40 hours x 50 weeks.
import type { Band, Claim, Filters, HoursRow } from "./types";
import type { Industry } from "./industries";
import { benchmarkSource, type Benchmark } from "./bls";
import { bandOf, type Thresholds } from "./thresholds";
import { norm } from "./fields";
import { fromDay } from "./normalize";
import type { Concern } from "./metrics";

export const BASE_HOURS = 200000;
export const rateOf = (cases: number, hours: number | null) => (hours && hours > 0 ? (cases * BASE_HOURS) / hours : null);
export const fmtRate = (r: number | null | undefined) => (r == null || !isFinite(r) ? "–" : r.toFixed(r >= 10 ? 1 : 2));

/** True when the loss run carried any OSHA recordkeeping detail. */
export function hasOsha(claims: Claim[]) {
  return claims.some((c) => c.recordable != null || c.caseType != null);
}
export function hasCaseTypes(claims: Claim[]) {
  return claims.some((c) => c.caseType != null);
}
export function hasDays(claims: Claim[]) {
  return claims.some((c) => (c.daysAway ?? 0) > 0 || (c.daysRestricted ?? 0) > 0);
}

/** Claims the safety rates use: location, region and year filters only.
 *  Rates count every recordable case for the chosen sites, so cause and coverage filters don't apply. */
export function safetyScope(all: Claim[], f: Filters) {
  const locs = new Set(f.locations);
  const regs = new Set(f.regions);
  return all.filter(
    (c) =>
      (!locs.size || locs.has(c.location)) &&
      (!regs.size || regs.has(c.region || c.state)) &&
      (f.yearFrom == null || c.lossYear >= f.yearFrom) &&
      (f.yearTo == null || c.lossYear <= f.yearTo),
  );
}

/** Locations that hours should be summed for, or null for the whole company. */
export function scopeLocations(all: Claim[], f: Filters): Set<string> | null {
  if (f.locations.length) return new Set(f.locations);
  if (f.regions.length) {
    const regs = new Set(f.regions);
    return new Set(all.filter((c) => regs.has(c.region || c.state)).map((c) => c.location));
  }
  return null;
}

const key = (s: string) => norm(s);
/** Hours rows name locations the way the user typed them. Match on the normalized name or a shared leading code (#101). */
export function sameLocation(a: string, b: string) {
  const ka = key(a);
  const kb = key(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const code = (s: string) => (s.trim().match(/^#?\s*([A-Za-z]?-?\d{2,})/) ?? [])[1]?.toLowerCase();
  const ca = code(a);
  const cb = code(b);
  return !!ca && ca === cb;
}

export function hoursFor(hours: HoursRow[] | undefined, year: number, locs: Set<string> | null): { hours: number; estimated: boolean } | null {
  if (!hours?.length) return null;
  const rows = hours.filter((h) => h.year === year);
  if (!rows.length) return null;
  if (!locs) {
    const company = rows.filter((h) => !h.location);
    const use = company.length ? company : rows;
    return { hours: use.reduce((s, h) => s + h.hours, 0), estimated: use.some((h) => h.estimated) };
  }
  const locList = [...locs];
  const use = rows.filter((h) => h.location && locList.some((l) => sameLocation(h.location, l)));
  if (!use.length) return null;
  return { hours: use.reduce((s, h) => s + h.hours, 0), estimated: use.some((h) => h.estimated) };
}

export interface SafetyYear {
  year: number;
  label: string;
  partial: boolean;
  recordable: number;
  dafw: number;
  djtr: number;
  other: number;
  typeUnknown: number;
  daysAway: number;
  daysRestricted: number;
  hours: number | null;
  estimated: boolean;
  trir: number | null;
  dart: number | null;
  dafwRate: number | null;
  severity: number | null; // days away per 200,000 hours
}

export function safetyYears(claims: Claim[], years: number[], hours: HoursRow[] | undefined, locs: Set<string> | null, V: number): SafetyYear[] {
  const vy = fromDay(V).y;
  return years.map((year) => {
    const cs = claims.filter((c) => c.lossYear === year && c.recordable === true);
    const dafw = cs.filter((c) => c.caseType === "DAFW").length;
    const djtr = cs.filter((c) => c.caseType === "DJTR").length;
    const other = cs.filter((c) => c.caseType === "Other").length;
    const daysAway = cs.reduce((s, c) => s + (c.daysAway ?? 0), 0);
    const daysRestricted = cs.reduce((s, c) => s + (c.daysRestricted ?? 0), 0);
    const h = hoursFor(hours, year, locs);
    const hrs = h?.hours ?? null;
    return {
      year,
      label: year === vy ? `${year} YTD` : String(year),
      partial: year === vy,
      recordable: cs.length,
      dafw,
      djtr,
      other,
      typeUnknown: cs.length - dafw - djtr - other,
      daysAway,
      daysRestricted,
      hours: hrs,
      estimated: !!h?.estimated,
      trir: rateOf(cs.length, hrs),
      dart: rateOf(dafw + djtr, hrs),
      dafwRate: rateOf(dafw, hrs),
      severity: rateOf(daysAway, hrs),
    };
  });
}

export interface SafetyLocation {
  location: string;
  recordable: number;
  dart: number;
  hours: number;
  trir: number;
  dartRate: number;
  band: Band;
}

/** Rates by location across the years in view. Only locations with their own hours rows can get a rate. */
export function safetyLocations(claims: Claim[], years: number[], hours: HoursRow[] | undefined, bench: Benchmark, th: Thresholds): SafetyLocation[] {
  if (!hours?.some((h) => h.location)) return [];
  const yset = new Set(years);
  const names = [...new Set(hours.filter((h) => h.location && yset.has(h.year)).map((h) => h.location))];
  const out: SafetyLocation[] = [];
  for (const name of names) {
    const hrs = hours.filter((h) => h.location === name && yset.has(h.year)).reduce((s, h) => s + h.hours, 0);
    if (!(hrs > 0)) continue;
    const cs = claims.filter((c) => yset.has(c.lossYear) && c.recordable === true && sameLocation(c.location, name));
    const dart = cs.filter((c) => c.caseType === "DAFW" || c.caseType === "DJTR").length;
    const trir = rateOf(cs.length, hrs)!;
    const match = claims.find((c) => sameLocation(c.location, name));
    out.push({ location: match?.location ?? name, recordable: cs.length, dart, hours: hrs, trir, dartRate: rateOf(dart, hrs)!, band: bandOf(trir / bench.trc, th.rateBands) });
  }
  return out.sort((a, b) => b.trir - a.trir);
}


export const rateBand = (rate: number | null, benchRate: number, th: Thresholds): Band | null => (rate == null || !(benchRate > 0) ? null : bandOf(rate / benchRate, th.rateBands));

/** Findings from the safety rates. Uses the most recent year in view that has hours. */
export function safetyConcerns(rows: SafetyYear[], locs: SafetyLocation[], scoped: Claim[], bench: Benchmark, ind: Industry, th: Thresholds): Concern[] {
  const out: Concern[] = [];
  const T = th.find;
  const withRates = rows.filter((r) => r.trir != null);
  const last = withRates[withRates.length - 1];
  const tip = (cat: string) => ind.tips[cat] ?? ind.tips.Other ?? "";
  const topCause = (year: number) => {
    const m = new Map<string, number>();
    scoped.filter((c) => c.lossYear === year && c.recordable === true).forEach((c) => m.set(c.category, (m.get(c.category) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  };
  const src = benchmarkSource(bench);
  const vs = bench.kind === "custom" ? "your target" : "the industry average";
  const vsShort = bench.kind === "custom" ? "your target" : "the industry";
  if (last && last.trir != null && last.recordable >= T.rateMinCases) {
    const ratio = last.trir / bench.trc;
    if (ratio > 1) {
      const tc = topCause(last.year);
      out.push({
        id: "safety-trir",
        band: bandOf(ratio, th.rateBands),
        title: `TRIR ${fmtRate(last.trir)} in ${last.label}, ${Math.round((ratio - 1) * 100)}% above ${vs}`,
        detail: `${last.recordable} recordable cases over ${Math.round(last.hours!).toLocaleString("en-US")} hours. ${src}: ${bench.trc.toFixed(1)}.${tc ? ` Most recordables: ${tc[0]} (${tc[1]}).` : ""}`,
        action: tc ? tip(tc[0]) : tip("Other"),
        weight: 30 * ratio,
        filter: tc ? { categories: [tc[0]], yearFrom: last.year, yearTo: last.year } : { yearFrom: last.year, yearTo: last.year },
      });
    }
    if (bench.dart != null && last.dart != null && last.dafw + last.djtr > 0 && rows.some((r) => r.dafw + r.djtr > 0)) {
      const dr = last.dart / bench.dart;
      if (dr > 1 && last.dafw + last.djtr >= Math.max(2, Math.round(T.rateMinCases / 2))) {
        out.push({
          id: "safety-dart",
          band: bandOf(dr, th.rateBands),
          title: `DART rate ${fmtRate(last.dart)} in ${last.label} vs ${bench.dart.toFixed(1)} for ${vsShort}`,
          detail: `${last.dafw} days-away and ${last.djtr} restricted or transfer cases. DART counts the injuries serious enough to cost work time. ${src}.`,
          action: "Bring injured workers back on modified duty where you can; a strong return-to-work program cuts days away and DART. Review the most severe cases with the TPA each month.",
          weight: 26 * dr,
          filter: { yearFrom: last.year, yearTo: last.year },
        });
      }
    }
    const prev = withRates[withRates.length - 2];
    if (prev && prev.trir && last.trir / prev.trir - 1 >= T.rateRisePct / 100) {
      const up = last.trir / prev.trir - 1;
      out.push({
        id: "safety-rise",
        band: up >= (2 * T.rateRisePct) / 100 ? 3 : 2,
        title: `TRIR up ${Math.round(up * 100)}%: ${fmtRate(prev.trir)} in ${prev.label} to ${fmtRate(last.trir)} in ${last.label}`,
        detail: `Rates adjust for hours worked, so this isn't just growth or a busier year.`,
        action: "Compare the two years by cause and location to find what changed; check whether new hires or a new site account for it.",
        weight: 18 + up * 20,
      });
    }
  }
  const hot = locs.filter((l) => l.recordable >= T.locMinCases && l.trir >= bench.trc * T.locRateX).slice(0, 4);
  if (hot.length) {
    out.push({
      id: "safety-locations",
      band: hot.some((l) => l.trir >= bench.trc * T.locRateX * 1.5) ? 4 : 3,
      title: `${hot.length} ${hot.length === 1 ? ind.unit.one : ind.unit.many} at ${T.locRateX}x ${bench.kind === "custom" ? "your target" : "the industry"} TRIR or more`,
      detail: hot.map((l) => `${l.location} ${fmtRate(l.trir)}`).join(" · ") + `. ${bench.kind === "custom" ? "Your target" : "Industry"}: ${bench.trc.toFixed(1)}.`,
      action: `Walk these ${hot.length === 1 ? ind.unit.one : ind.unit.many} with the site leads; look at training, staffing and housekeeping, and set a 90-day target.`,
      weight: 24 + hot.length * 3,
      filter: { locations: hot.map((l) => l.location) },
    });
  }
  return out;
}

/** Template rows for the hours sheet. */
export const HOURS_HEADERS = ["Location", "Year", "Hours Worked", "Average Employees", "NAICS Code"];
