// The dashboard's numbers without the screen: read tables, match columns automatically,
// clean the claims and work out every table the "Power BI data model" export holds.
// Same steps and functions as an upload in the app with no filters set. Used by
// scripts/powerbi-export.ts. No browser APIs.
import type { Table } from "./parse";
import { buildClaims, detectHeaderRow, hoursFromTables, pickTable } from "./parse";
import { autoMap, fieldsFor } from "./fields";
import { getIndustry, profileForNaics, type Industry, type IndustryId } from "./industries";
import { applyDims, applyYears, concerns, filterSummary, kpis, locationRows, yearsIn } from "./metrics";
import { hasOsha, safetyConcerns, safetyLocations, safetyScope, safetyYears } from "./safety";
import { defaultChoice, resolveBenchmark } from "./bls";
import { DEFAULT_THRESHOLDS, type Thresholds } from "./thresholds";
import { parseDay, todayDay } from "./normalize";
import { EMPTY_FILTERS } from "./types";
import { findStatedValuation } from "./valuation";
import { APP_VERSION } from "./version";
import type { PowerBiInput } from "./powerbi";

export interface AnalyzeOptions {
  sourceName: string;
  /** Template to read the file with. Default: from the NAICS code, else "general". */
  industry?: IndustryId;
  /** NAICS code for the BLS benchmark. Default: the hours sheet's code, else the template's. */
  naics?: string;
  /** Valuation date as text (e.g. 2026-10-31). Default: the as-of date the file states, else the latest loss date, capped at today. */
  valuation?: string;
  isSample?: boolean;
  th?: Thresholds;
}

export interface AnalyzeResult {
  input: PowerBiInput;
  ind: Industry;
  sheet: string;
  rowsRead: number;
  rowsSkipped: number;
  hoursSheet: string | null;
  /** Fields the automatic column matching found, for a quick sanity check. */
  fieldsPresent: string[];
}

export function analyzeTables(tables: Table[], o: AnalyzeOptions): AnalyzeResult {
  if (!tables.length) throw new Error("No sheets or tables with data were found in this file.");
  const th = o.th ?? DEFAULT_THRESHOLDS;
  // The template decides how columns and causes are read, so pick it before matching.
  const prelimHours = hoursFromTables(tables);
  const naics = o.naics || prelimHours?.naics || "";
  const ind = getIndustry(o.industry ?? (naics ? profileForNaics(naics) : "general"));
  const F = fieldsFor(ind);
  const ti = pickTable(tables, F);
  const table = tables[ti];
  const headerRow = detectHeaderRow(table.rows, F);
  const built = buildClaims(table, headerRow, autoMap(table.rows[headerRow] ?? [], F), ind.coverages[0].key, ind);
  if (!built.claims.length) throw new Error(`No rows in "${table.name}" had a readable date of loss. Check that the file has a Date of loss column.`);
  const V = (o.valuation ? parseDay(o.valuation) : null) ?? findStatedValuation(table.rows, headerRow)?.day ?? Math.min(built.maxDay ?? todayDay(), todayDay());
  const hours = hoursFromTables(tables, ti);

  // No filters: everything in the file.
  const filters = EMPTY_FILTERS;
  const all = built.claims;
  const dims = applyDims(all, filters);
  const filtered = applyYears(dims, filters);
  const years = yearsIn(all);
  const locRows = locationRows(filtered, dims, V, th);
  const bench = resolveBenchmark(defaultChoice(naics || ind.bls.default), ind.bls.default);
  const osha = hasOsha(all);
  const scoped = safetyScope(all, filters);
  const sYears = osha ? safetyYears(scoped, years, hours?.hours, null, V) : [];
  const sLocs = osha ? safetyLocations(scoped, years, hours?.hours, bench, th) : [];
  const found = [...concerns(dims, V, locRows, ind, th), ...(osha ? safetyConcerns(sYears, sLocs, scoped, bench, ind, th) : [])].sort((a, b) => b.band - a.band || b.weight - a.weight);

  return {
    ind,
    sheet: table.name,
    rowsRead: built.rowsRead,
    rowsSkipped: built.skipped,
    hoursSheet: hours?.sheet ?? null,
    fieldsPresent: built.fieldsPresent,
    input: {
      ind,
      th,
      filters,
      scope: filterSummary(filters, years) || "All claims",
      filtered,
      valuationDay: V,
      kpis: kpis(filtered, dims, V, th),
      locRows,
      concerns: found,
      sourceName: tables.length > 1 ? `${o.sourceName} › ${table.name}` : o.sourceName,
      isSample: !!o.isSample,
      appVersion: APP_VERSION,
      safety: osha ? { rows: sYears, locRows: sLocs, bench } : undefined,
    },
  };
}
