// "Power BI data model" export: one workbook of flat tables for Power BI, Excel Power Query,
// Tableau or any tool that reads Excel. No browser APIs here, so the command line
// (scripts/powerbi-export.ts) builds the exact same file.
//
// The column lists below are a contract. People build reports on them and press Refresh,
// so never rename or remove a column. Add new columns at the end and bump POWERBI_SCHEMA.
import * as XLSX from "xlsx";
import type { Band, Claim, Filters } from "./types";
import { BAND_LABEL, OSHA_CASE_LABEL } from "./types";
import type { Industry } from "./industries";
import { coverageLabel } from "./industries";
import type { Concern, Kpi, LocationRow } from "./metrics";
import type { SafetyLocation, SafetyYear } from "./safety";
import type { Benchmark } from "./bls";
import type { Thresholds } from "./thresholds";
import { fromDay } from "./normalize";

export const POWERBI_SCHEMA = 1;

export const POWERBI_COLUMNS = {
  Claims: [
    "Claim Number", "Location", "Region", "State", "Line", "Line Name", "Line As Reported",
    "Loss Date", "Loss Year", "Loss Month", "Report Date", "Days to Report", "Status", "Reopened",
    "Loss Category", "Cause As Reported", "Body Part", "Injury", "Job Title",
    "Paid", "Reserve", "Incurred", "Litigated", "Large Loss",
    "OSHA Recordable", "OSHA Case Type", "Days Away From Work", "Days Restricted or Transferred", "Description",
  ],
  Locations: [
    "Location", "Region", "Claims", "Incurred", "Average Cost", "Open Claims", "Litigated Claims",
    "Claims Last 12 Months", "Claims Prior 12 Months", "Change vs Prior 12 Months",
    "Top Cause Last 12 Months", "Top Cause Claims Last 12 Months", "Average Days to Report Last 12 Months", "Large Losses Last 12 Months",
    "Risk Score", "Risk Level", "Risk Level Rank", "Why Flagged",
  ],
  Findings: [
    "Rank", "Risk Level", "Risk Level Rank", "Finding", "Detail", "Guidance", "Guidance Type", "Sources",
    "Related Locations", "Related Categories", "Related Lines",
  ],
  Summary: ["Measure Key", "Measure", "Value", "Detail", "Change", "Risk Level", "Risk Level Rank", "Note"],
  "Safety by Year": [
    "Year", "Partial Year", "Recordable Cases", "Days Away Cases", "Job Transfer or Restriction Cases", "Other Recordable Cases", "Case Type Unknown",
    "Days Away", "Days Restricted", "Hours Worked", "Hours Estimated", "TRIR", "DART Rate", "DAFW Rate", "Severity Rate",
    "Benchmark", "Benchmark TRIR", "Benchmark DART Rate",
  ],
  "Safety by Location": ["Location", "Recordable Cases", "DART Cases", "Hours Worked", "TRIR", "DART Rate", "Risk Level", "Risk Level Rank"],
  About: ["Field", "Value"],
} as const;

export type PowerBiSheet = keyof typeof POWERBI_COLUMNS;
type Row = Record<string, string | number | boolean | Date | null>;

export interface PowerBiInput {
  ind: Industry;
  th: Thresholds;
  filters: Filters;
  /** Plain-language description of the filters, e.g. "All claims" or "2024-2026 · WC". */
  scope: string;
  filtered: Claim[];
  valuationDay: number;
  kpis: Kpi[];
  locRows: LocationRow[];
  concerns: Concern[];
  sourceName: string;
  isSample: boolean;
  appVersion: string;
  exportedAt?: Date;
  safety?: { rows: SafetyYear[]; locRows: SafetyLocation[]; bench: Benchmark };
}

/** A calendar date with no time zone shift, as Excel stores it. */
const toDate = (n: number | null) => {
  if (n == null) return null;
  const { y, m, d } = fromDay(n);
  return new Date(y, m - 1, d);
};
const cents = (n: number) => Math.round(n * 100) / 100;
const r2 = (n: number | null | undefined) => (n == null || !isFinite(n) ? null : Math.round(n * 100) / 100);
const r4 = (n: number | null | undefined) => (n == null || !isFinite(n) ? null : Math.round(n * 10000) / 10000);
const level = (b: Band | null) => (b == null ? null : BAND_LABEL[b]);
const list = (xs: string[] | undefined) => (xs?.length ? xs.join("; ") : null);

// Labels loss runs use in place of a name. Left as they are in descriptions.
const GENERIC = new Set(["guest", "third", "party", "employee", "customer", "visitor", "driver", "tenant", "patron", "unknown", "claimant", "the", "and", "jr", "sr", "mrs", "miss"]);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces the claimant's name, and each part of it, with "[claimant]" in free text. */
export function redactClaimant(text: string, claimant: string): string {
  const name = claimant.trim();
  if (!text || !name) return text;
  const parts = name.split(/[\s,]+/).filter((p) => p.length >= 2 && /\p{L}/u.test(p) && !GENERIC.has(p.toLowerCase().replace(/\.$/, "")));
  if (!parts.length) return text;
  const words = [name, ...parts].sort((a, b) => b.length - a.length).map(esc);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.join("|")})(?![\\p{L}\\p{N}])`, "giu");
  // "Zorblatt Quimby" becomes "[claimant] [claimant]" part by part; fold the repeats.
  return text.replace(re, "[claimant]").replace(/\[claimant\](?:[\s,]+\[claimant\])+/g, "[claimant]");
}

/** The tables as plain rows, keyed by sheet name. Every sheet is present, even with no rows. */
export function powerBiTables(x: PowerBiInput): Record<PowerBiSheet, Row[]> {
  const largeAt = x.th.largeLoss;
  const claims: Row[] = x.filtered.map((c) => ({
    "Claim Number": c.id,
    Location: c.location,
    Region: c.region || null,
    State: c.state || null,
    Line: c.coverage,
    "Line Name": coverageLabel(x.ind, c.coverage),
    "Line As Reported": c.coverageRaw || null,
    "Loss Date": toDate(c.lossDay),
    "Loss Year": c.lossYear,
    "Loss Month": c.lossMonth + 1,
    "Report Date": toDate(c.reportDay),
    "Days to Report": c.lagDays,
    Status: c.status,
    Reopened: c.reopened,
    "Loss Category": c.category,
    "Cause As Reported": c.causeRaw || null,
    "Body Part": c.bodyPart || null,
    Injury: c.injury || null,
    "Job Title": c.jobTitle || null,
    Paid: cents(c.paid),
    Reserve: cents(c.reserve),
    Incurred: cents(c.incurred),
    Litigated: c.litigated,
    "Large Loss": c.incurred >= largeAt,
    "OSHA Recordable": c.recordable,
    "OSHA Case Type": c.caseType ? OSHA_CASE_LABEL[c.caseType] : null,
    "Days Away From Work": c.daysAway,
    "Days Restricted or Transferred": c.daysRestricted,
    Description: redactClaimant(c.description, c.claimant) || null,
  }));

  const locations: Row[] = x.locRows.map((r) => ({
    Location: r.location,
    Region: r.region || null,
    Claims: r.claims,
    Incurred: cents(r.incurred),
    "Average Cost": cents(r.avg),
    "Open Claims": r.open,
    "Litigated Claims": r.litigated,
    "Claims Last 12 Months": r.l12,
    "Claims Prior 12 Months": r.p12,
    "Change vs Prior 12 Months": r4(r.change),
    "Top Cause Last 12 Months": r.topCause || null,
    "Top Cause Claims Last 12 Months": r.topCauseN,
    "Average Days to Report Last 12 Months": r2(r.avgLag),
    "Large Losses Last 12 Months": r.large,
    "Risk Score": r.score,
    "Risk Level": level(r.band),
    "Risk Level Rank": r.band,
    "Why Flagged": list(r.flags),
  }));

  const findings: Row[] = x.concerns.map((c, i) => ({
    Rank: i + 1,
    "Risk Level": level(c.band),
    "Risk Level Rank": c.band,
    Finding: c.title,
    Detail: c.detail,
    Guidance: c.action || null,
    "Guidance Type": c.kind,
    Sources: list(c.sources.map((s) => `${s.agency}: ${s.title} (${s.url})`)),
    "Related Locations": list(c.filter?.locations),
    "Related Categories": list(c.filter?.categories),
    "Related Lines": list(c.filter?.coverages),
  }));

  const summary: Row[] = x.kpis.map((k) => ({
    "Measure Key": k.key,
    Measure: k.label,
    Value: k.value,
    Detail: k.sub || null,
    Change: k.delta || null,
    "Risk Level": level(k.band),
    "Risk Level Rank": k.band,
    Note: k.bandNote || null,
  }));

  const s = x.safety;
  const benchName = s ? (s.bench.kind === "custom" ? s.bench.name : `BLS ${s.bench.code ? `NAICS ${s.bench.code} ` : ""}${s.bench.name}`.trim()) : null;
  const safetyYears: Row[] = (s?.rows ?? []).map((r) => ({
    Year: r.year,
    "Partial Year": r.partial,
    "Recordable Cases": r.recordable,
    "Days Away Cases": r.dafw,
    "Job Transfer or Restriction Cases": r.djtr,
    "Other Recordable Cases": r.other,
    "Case Type Unknown": r.typeUnknown,
    "Days Away": r.daysAway,
    "Days Restricted": r.daysRestricted,
    "Hours Worked": r.hours,
    "Hours Estimated": r.estimated,
    TRIR: r2(r.trir),
    "DART Rate": r2(r.dart),
    "DAFW Rate": r2(r.dafwRate),
    "Severity Rate": r2(r.severity),
    Benchmark: benchName,
    "Benchmark TRIR": r2(s!.bench.trc),
    "Benchmark DART Rate": r2(s!.bench.dart),
  }));
  const safetyLocs: Row[] = (s?.locRows ?? []).map((r) => ({
    Location: r.location,
    "Recordable Cases": r.recordable,
    "DART Cases": r.dart,
    "Hours Worked": r.hours,
    TRIR: r2(r.trir),
    "DART Rate": r2(r.dartRate),
    "Risk Level": level(r.band),
    "Risk Level Rank": r.band,
  }));

  const about: Row[] = [
    ["Schema version", POWERBI_SCHEMA],
    ["Dashboard version", x.appVersion],
    ["Exported at", (x.exportedAt ?? new Date()).toISOString()],
    ["Valuation date", toDate(x.valuationDay)],
    ["Source file", x.sourceName],
    ["Sample data", x.isSample ? "Yes (synthetic, not a real company)" : "No"],
    ["Industry template", x.ind.name],
    ["Filters", x.scope],
    ["Claims in this file", claims.length],
    ["Large loss at or above", largeAt],
    ["Safety benchmark", benchName],
    ["Claimant names", "Left out, and blanked out of descriptions as [claimant]"],
    ["Columns", "Column names stay the same in future versions. New columns may be added at the end of a table."],
    ["Risk Level Rank", "0 Low, 1 Guarded, 2 Moderate, 3 High, 4 Severe. Sort Risk Level by this column."],
  ].map(([Field, Value]) => ({ Field: String(Field), Value: (Value ?? null) as Row[string] }));

  return { Claims: claims, Locations: locations, Findings: findings, Summary: summary, "Safety by Year": safetyYears, "Safety by Location": safetyLocs, About: about };
}

export function powerBiWorkbook(x: PowerBiInput): XLSX.WorkBook {
  const tables = powerBiTables(x);
  const wb = XLSX.utils.book_new();
  for (const name of Object.keys(POWERBI_COLUMNS) as PowerBiSheet[]) {
    const header = [...POWERBI_COLUMNS[name]];
    const ws = XLSX.utils.json_to_sheet(tables[name], { header, cellDates: true, dateNF: "yyyy-mm-dd" });
    // json_to_sheet writes nothing for zero rows; the header row must always be there.
    if (!tables[name].length) XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" });
    ws["!cols"] = header.map((h) => ({ wch: Math.max(10, Math.min(40, h.length + 2)) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return wb;
}

export function powerBiXlsx(x: PowerBiInput): Blob {
  const out = XLSX.write(powerBiWorkbook(x), { bookType: "xlsx", type: "array", compression: true });
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
