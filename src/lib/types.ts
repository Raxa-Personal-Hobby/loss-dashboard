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
