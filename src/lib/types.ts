/** Coverage keys come from the industry profile (WC, GL, AL, APD, BR...). "Other" catches the rest. */
export type Coverage = string;

export interface Claim {
  id: string;
  location: string;
  region: string;
  state: string;
  coverage: Coverage;
  coverageRaw: string;
  lossDay: number; // days since 1970-01-01 (UTC)
  lossYear: number;
  lossMonth: number; // 0-11
  reportDay: number | null;
  lagDays: number | null;
  status: "Open" | "Closed";
  reopened: boolean;
  category: string;
  causeRaw: string;
  bodyPart: string;
  injury: string;
  jobTitle: string;
  claimant: string;
  paid: number;
  reserve: number;
  incurred: number;
  litigated: boolean;
  description: string;
  // OSHA recordkeeping (optional). null means the file didn't say.
  recordable: boolean | null;
  caseType: OshaCase | null;
  daysAway: number | null;
  daysRestricted: number | null;
}

/** OSHA 300 log case types: days away from work, job transfer or restriction, other recordable. */
export type OshaCase = "DAFW" | "DJTR" | "Other";
export const OSHA_CASE_LABEL: Record<OshaCase, string> = { DAFW: "Days away", DJTR: "Job transfer or restriction", Other: "Other recordable" };

/** Hours worked for one year, for one location or the whole company (location ""). */
export interface HoursRow {
  location: string;
  year: number;
  hours: number;
  estimated: boolean; // true when worked out from average employees x 2,000
}

export type FieldKey =
  | "claimNumber"
  | "location"
  | "region"
  | "state"
  | "coverage"
  | "lossDate"
  | "reportDate"
  | "closeDate"
  | "status"
  | "cause"
  | "bodyPart"
  | "injury"
  | "jobTitle"
  | "claimant"
  | "paid"
  | "reserve"
  | "incurred"
  | "litigated"
  | "description"
  | "recordable"
  | "caseType"
  | "daysAway"
  | "daysRestricted";

/** Each field maps to zero or more source column indexes. Money fields sum multiple columns. */
export type Mapping = Record<FieldKey, number[]>;

export interface Dataset {
  claims: Claim[];
  sourceName: string;
  isSample: boolean;
  valuationDay: number;
  rowsRead: number;
  rowsSkipped: number;
  fieldsPresent: FieldKey[];
  industry: string;
  source?: { table: { name: string; rows: unknown[][] }; headerRow: number; mapping: Mapping; defCov: string };
  hours?: HoursRow[];
  hoursSource?: string;
  /** NAICS code found in the hours sheet, if the user filled one in. */
  naics?: string;
  /** A second report joined on Location + Year. Absent in the single-report flow. */
  safety?: SafetyMerge;
}

/** One row of a safety report (OSHA log or internal safety sheet), after column matching. */
export interface SafetyCase {
  /** Location name exactly as the safety report wrote it. */
  sourceLocation: string;
  year: number;
  recordable: boolean | null;
  caseType: OshaCase | null;
  daysAway: number | null;
  daysRestricted: number | null;
}

/** The record shape the safety rates read. Loss run claims fit it, and so do merged safety report cases. */
export interface OshaRow {
  location: string;
  region: string;
  state: string;
  lossYear: number;
  recordable: boolean | null;
  caseType: OshaCase | null;
  daysAway: number | null;
  daysRestricted: number | null;
  category: string;
}

/** Hours that disagreed across rows for one location and year. No rate is worked out until the user picks. */
export interface HoursConflict {
  location: string;
  year: number;
  values: number[];
  pick: "skip" | "max" | "sum";
}

/** A safety report read from a file, before any location matching. */
export interface ParsedSafetyReport {
  sourceName: string;
  cases: SafetyCase[];
  hours: HoursRow[];
  hoursConflicts: HoursConflict[];
  /** Every distinct location name in the report, in first-seen order. */
  locations: string[];
  rowsRead: number;
  rowsSkipped: number;
  hasCaseTypes: boolean;
  hasDays: boolean;
}

/** One confirmed decision: a safety report name and the loss run name it joins, or null for "no match". */
export interface LocationLink {
  b: string;
  a: string | null;
  tier: "high" | "medium" | "low";
  score: number;
  reasons: string[];
}

/** A safety report joined to the loss run on Location + Year, after the user confirmed every pair. */
export interface SafetyMerge {
  report: ParsedSafetyReport;
  links: LocationLink[];
  /** Safety report cases with the confirmed location names, ready for the safety rates. */
  rows: OshaRow[];
  /** Hours with the confirmed location names. */
  hours: HoursRow[];
  /** Loss run locations with no safety report data. */
  onlyA: string[];
  /** Safety report locations with no loss run match (display names). */
  onlyB: string[];
}

export interface Brand {
  companyName: string;
  website: string;
  primary: string;
  accent: string;
  logo: { dataUrl: string; w: number; h: number } | null;
}

export interface Filters {
  yearFrom: number | null;
  yearTo: number | null;
  locations: string[];
  regions: string[];
  coverages: Coverage[];
  categories: string[];
  status: "all" | "Open" | "Closed";
  litigatedOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  yearFrom: null,
  yearTo: null,
  locations: [],
  regions: [],
  coverages: [],
  categories: [],
  status: "all",
  litigatedOnly: false,
};

export type Band = 0 | 1 | 2 | 3 | 4;
export const BAND_LABEL = ["Low", "Guarded", "Moderate", "High", "Severe"] as const;
