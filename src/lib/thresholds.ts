// Every number that decides a color level or a finding lives here, so each user can set
// their own. Defaults are starting points. Where a default comes from published research
// the source is named; everything else is marked as a template starting point.
import type { Band } from "./types";

export interface Thresholds {
  largeLoss: number;
  changeBands: number[]; // % change, 4 cut points: Low | Guarded | Moderate | High | Severe
  litBands: number[]; // change in litigation rate, points
  lagBands: number[]; // average days from loss to report
  scoreBands: number[]; // location signal score
  rateBands: number[]; // safety rate divided by the BLS industry rate (1.0 = industry average)
  loc: {
    freq1: number; freq1Pts: number; freq2: number; freq2Pts: number; freq3: number; freq3Pts: number;
    spikeMin: number; spikeAdd: number; spikePct: number; spikePts: number;
    riseMin: number; riseAdd: number; risePct: number; risePts: number;
    sev1: number; sev1Pts: number; sev2: number; sev2Pts: number;
    large1Pts: number; large2Pts: number;
    litPts: number;
    rep1: number; rep1Pts: number; rep2: number; rep2Pts: number;
    lagDays: number; lagPts: number;
  };
  find: {
    spikeMin: number; spikeAdd: number; spikePct: number; spikeSevMin: number; spikeSevPct: number;
    repeatMin: number; repeatHigh: number;
    catMin: number; catPct: number; catHighPct: number;
    minClaims: number; freqPct: number; freqHighPct: number; sevPct: number; sevHighPct: number;
    lateDays: number; lateShare: number; lateHighShare: number;
    litRate: number; litHighRate: number; litDelta: number; litHighDelta: number;
    agingDays: number; agingMin: number; agingHigh: number;
    otherShare: number;
    rateMinCases: number; rateRisePct: number; locRateX: number; locMinCases: number;
  };
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  largeLoss: 100000,
  changeBands: [-5, 5, 15, 30],
  litBands: [-1, 0.5, 2, 4],
  lagBands: [3, 7, 14, 30],
  scoreBands: [1, 3, 5, 7],
  rateBands: [0.75, 1, 1.25, 1.5],
  loc: {
    freq1: 1.3, freq1Pts: 1, freq2: 1.6, freq2Pts: 2, freq3: 2, freq3Pts: 3,
    spikeMin: 6, spikeAdd: 4, spikePct: 50, spikePts: 2,
    riseMin: 5, riseAdd: 3, risePct: 30, risePts: 1,
    sev1: 1.75, sev1Pts: 1, sev2: 2.5, sev2Pts: 2,
    large1Pts: 1, large2Pts: 2,
    litPts: 1,
    rep1: 4, rep1Pts: 1, rep2: 6, rep2Pts: 2,
    lagDays: 14, lagPts: 1,
  },
  find: {
    spikeMin: 6, spikeAdd: 4, spikePct: 50, spikeSevMin: 10, spikeSevPct: 100,
    repeatMin: 4, repeatHigh: 6,
    catMin: 8, catPct: 35, catHighPct: 75,
    minClaims: 10, freqPct: 15, freqHighPct: 30, sevPct: 20, sevHighPct: 40,
    lateDays: 7, lateShare: 15, lateHighShare: 25,
    litRate: 10, litHighRate: 15, litDelta: 3, litHighDelta: 5,
    agingDays: 365, agingMin: 3, agingHigh: 10,
    otherShare: 20,
    rateMinCases: 5, rateRisePct: 15, locRateX: 2, locMinCases: 3,
  },
};

/** Band from a value and 4 ascending cut points (value at or below a cut lands in that band). */
export function bandOf(v: number, cuts: number[]): Band {
  for (let i = 0; i < 4; i++) if (v <= cuts[i]) return i as Band;
  return 4;
}

export interface SourceRef {
  id: string;
  short: string;
  text: string;
  url?: string;
}

export const SOURCES: Record<string, SourceRef> = {
  template: {
    id: "template",
    short: "Template starting point",
    text: "Starting point chosen for this template. It is not from a published benchmark. Set your own to match your program, carrier guidance or company policy.",
  },
  ncci: {
    id: "ncci",
    short: "NCCI, 2015",
    text: "NCCI research brief, “The Relationship Between Accident Report Lag and Claim Cost in Workers Compensation Insurance” (2015), as reported by Business Insurance: claims reported in the third week cost about 35% more than claims reported in the second week, and up to about 51% more by the fourth week. Attorney involvement rose from 12.8% of claims reported the same day to 31.7% of claims reported four or more weeks later.",
    url: "https://www.businessinsurance.com/reporting-delays-tied-to-higher-workers-comp-claim-costs/",
  },
  hartford: {
    id: "hartford",
    short: "The Hartford",
    text: "The Hartford's claim report lag study, as cited by Arthur J. Gallagher on the PRIMA blog: claims reported in the second week cost about 18% more than claims reported in the first week, and claims reported after the fourth week about 45% more.",
    url: "https://primacentral.org/education/podcasts-blog/a-new-approach-to-controlling-lag-time/",
  },
  threeDay: {
    id: "threeDay",
    short: "Gallagher / PRIMA",
    text: "Arthur J. Gallagher, on the PRIMA blog: many organizations use a three-day reporting standard. Experts quoted by Business Insurance (2015) call reporting within 24 to 48 hours optimal.",
    url: "https://primacentral.org/education/podcasts-blog/a-new-approach-to-controlling-lag-time/",
  },
};

SOURCES.bls = {
  id: "bls",
  short: "BLS SOII, 2024",
  text: "U.S. Bureau of Labor Statistics, Survey of Occupational Injuries and Illnesses, Table 1: incidence rates of nonfatal occupational injuries and illnesses by industry and case types, 2024. Rates are per 100 full-time workers (200,000 hours). The industry average is the BLS figure; the cut points around it are a template starting point.",
  url: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/table-1-injury-and-illness-rates-by-industry-2024-national.htm",
};

export interface Row {
  label: string;
  help?: string;
  keys: { path: string; unit: string; step?: number }[];
  source: string[];
}
export interface Group {
  title: string;
  sub: string;
  rows: Row[];
}

const B = (p: string) => [0, 1, 2, 3].map((i) => ({ path: `${p}.${i}`, unit: "", step: 0.5 }));

export const GROUPS: Group[] = [
  {
    title: "Color levels",
    sub: "Four cut points split each metric into Low, Guarded, Moderate, High and Severe. A value at or below a cut point lands in that level.",
    rows: [
      { label: "Same-period change (claims, incurred, average cost), %", keys: B("changeBands"), source: ["template"] },
      { label: "Change in litigation rate, points", keys: B("litBands"), source: ["template"] },
      { label: "Average days from loss to report", help: "Low covers the 3-day standard; Moderate is the second week; High is weeks 3 and 4; Severe is after a month.", keys: B("lagBands"), source: ["threeDay", "hartford", "ncci"] },
      { label: "Location signal score", help: "The total of the points below.", keys: B("scoreBands"), source: ["template"] },
      { label: "Safety rate vs industry average (TRIR, DART), times the average", help: "1.0 means right at the BLS average for your industry. 1.25 means 25% above it.", keys: [0, 1, 2, 3].map((i) => ({ path: `rateBands.${i}`, unit: "x", step: 0.05 })), source: ["bls", "template"] },
      { label: "Large loss, $ incurred", keys: [{ path: "largeLoss", unit: "$", step: 5000 }], source: ["template"] },
    ],
  },
  {
    title: "Location signals",
    sub: "Each signal adds points to a location's score for the last 12 months. Set points to 0 to turn a signal off.",
    rows: [
      { label: "Claims vs average location (x), points", keys: [{ path: "loc.freq1", unit: "x", step: 0.1 }, { path: "loc.freq1Pts", unit: "pts" }, { path: "loc.freq2", unit: "x", step: 0.1 }, { path: "loc.freq2Pts", unit: "pts" }, { path: "loc.freq3", unit: "x", step: 0.1 }, { path: "loc.freq3Pts", unit: "pts" }], source: ["template"] },
      { label: "Spike: at least N claims, up by at least M claims and P%", keys: [{ path: "loc.spikeMin", unit: "N" }, { path: "loc.spikeAdd", unit: "M" }, { path: "loc.spikePct", unit: "%" }, { path: "loc.spikePts", unit: "pts" }], source: ["template"] },
      { label: "Rising: at least N claims, up by at least M claims and P%", keys: [{ path: "loc.riseMin", unit: "N" }, { path: "loc.riseAdd", unit: "M" }, { path: "loc.risePct", unit: "%" }, { path: "loc.risePts", unit: "pts" }], source: ["template"] },
      { label: "Incurred vs average location (x), points", keys: [{ path: "loc.sev1", unit: "x", step: 0.25 }, { path: "loc.sev1Pts", unit: "pts" }, { path: "loc.sev2", unit: "x", step: 0.25 }, { path: "loc.sev2Pts", unit: "pts" }], source: ["template"] },
      { label: "Large losses: points for 1, points for 2 or more", keys: [{ path: "loc.large1Pts", unit: "pts" }, { path: "loc.large2Pts", unit: "pts" }], source: ["template"] },
      { label: "Any open litigated claim, points", keys: [{ path: "loc.litPts", unit: "pts" }], source: ["template"] },
      { label: "Same cause repeated N times, points", keys: [{ path: "loc.rep1", unit: "N" }, { path: "loc.rep1Pts", unit: "pts" }, { path: "loc.rep2", unit: "N" }, { path: "loc.rep2Pts", unit: "pts" }], source: ["template"] },
      { label: "Average report lag over N days, points", help: "Two weeks is where NCCI found costs start climbing.", keys: [{ path: "loc.lagDays", unit: "days" }, { path: "loc.lagPts", unit: "pts" }], source: ["ncci"] },
    ],
  },
  {
    title: "Findings",
    sub: "When a finding shows up, and when it moves up a level.",
    rows: [
      { label: "Location spike: N claims, up M, P%; Severe at N2 claims and P2%", keys: [{ path: "find.spikeMin", unit: "N" }, { path: "find.spikeAdd", unit: "M" }, { path: "find.spikePct", unit: "%" }, { path: "find.spikeSevMin", unit: "N2" }, { path: "find.spikeSevPct", unit: "P2%" }], source: ["template"] },
      { label: "Same cause at one location: Moderate at N, High at N2", keys: [{ path: "find.repeatMin", unit: "N" }, { path: "find.repeatHigh", unit: "N2" }], source: ["template"] },
      { label: "Company cause trend: N claims, up P%; High at P2%", keys: [{ path: "find.catMin", unit: "N" }, { path: "find.catPct", unit: "%" }, { path: "find.catHighPct", unit: "P2%" }], source: ["template"] },
      { label: "Claim count up P% (High at P2%), needs N claims", keys: [{ path: "find.freqPct", unit: "%" }, { path: "find.freqHighPct", unit: "P2%" }, { path: "find.minClaims", unit: "N" }], source: ["template"] },
      { label: "Average cost up P% (High at P2%)", keys: [{ path: "find.sevPct", unit: "%" }, { path: "find.sevHighPct", unit: "P2%" }], source: ["template"] },
      { label: "Late reporting: share reported after N days; High at P2%", help: "The Hartford found costs rise in the second week.", keys: [{ path: "find.lateDays", unit: "days" }, { path: "find.lateShare", unit: "%" }, { path: "find.lateHighShare", unit: "P2%" }], source: ["hartford"] },
      { label: "Litigation: rate % or rise in points; High at rate2 or rise2", keys: [{ path: "find.litRate", unit: "%" }, { path: "find.litDelta", unit: "pts" }, { path: "find.litHighRate", unit: "%2" }, { path: "find.litHighDelta", unit: "pts2" }], source: ["template"] },
      { label: "Open claims older than N days: show at M, Moderate at M2", keys: [{ path: "find.agingDays", unit: "days" }, { path: "find.agingMin", unit: "M" }, { path: "find.agingHigh", unit: "M2" }], source: ["template"] },
      { label: "Claims with no clear cause, % of total", keys: [{ path: "find.otherShare", unit: "%" }], source: ["template"] },
      { label: "Safety rates: need N recordable cases; flag a rise of P%", keys: [{ path: "find.rateMinCases", unit: "N" }, { path: "find.rateRisePct", unit: "%" }], source: ["template"] },
      { label: "Location TRIR at X times the industry, with at least N cases", keys: [{ path: "find.locRateX", unit: "x", step: 0.25 }, { path: "find.locMinCases", unit: "N" }], source: ["bls", "template"] },
    ],
  },
];

export function getPath(t: Thresholds, path: string): number {
  return path.split(".").reduce<any>((o, k) => o?.[k], t) as number;
}
export function setPath(t: Thresholds, path: string, v: number): Thresholds {
  const next: any = structuredClone(t);
  const ks = path.split(".");
  let o = next;
  for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
  o[ks[ks.length - 1]] = v;
  return next;
}
export function mergeThresholds(saved: unknown): Thresholds {
  const d = structuredClone(DEFAULT_THRESHOLDS) as any;
  const s = (saved ?? {}) as any;
  const walk = (base: any, over: any) => {
    for (const k of Object.keys(base)) {
      if (over?.[k] == null) continue;
      if (Array.isArray(base[k])) base[k] = base[k].map((v: number, i: number) => (typeof over[k][i] === "number" ? over[k][i] : v));
      else if (typeof base[k] === "object") walk(base[k], over[k]);
      else if (typeof over[k] === "number" && isFinite(over[k])) base[k] = over[k];
    }
  };
  walk(d, s);
  return d;
}
export const isDefault = (t: Thresholds) => JSON.stringify(t) === JSON.stringify(DEFAULT_THRESHOLDS);
