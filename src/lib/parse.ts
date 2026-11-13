import * as XLSX from "xlsx";
import JSZip from "jszip";
import { FIELDS, headerRowScore, type FieldDef } from "./fields";
import type { Industry } from "./industries";
import type { Claim, Coverage, FieldKey, HoursRow, Mapping, OshaCase } from "./types";
import { categorize, clean, normCoverage, normLitigated, normStatus, parseCaseType, parseDay, parseDays, parseMoney, parseYesNo, todayDay, fromDay } from "./normalize";
import { norm } from "./fields";

export interface Table {
  name: string;
  rows: unknown[][];
}

export const ACCEPT = ".xlsx,.xlsm,.xls,.csv,.txt,.tsv,.docx";
const EXCEL = ["xlsx", "xlsm", "xls", "xlsb", "ods"];
const TEXT = ["csv", "txt", "tsv"];

export async function readFile(file: File): Promise<Table[]> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (EXCEL.includes(ext)) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    return wb.SheetNames.map((name) => ({
      name,
      rows: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: "", blankrows: true }),
    })).filter((t) => t.rows.length > 0);
  }
  if (TEXT.includes(ext)) {
    const text = await file.text();
    const wb = XLSX.read(text, { type: "string", raw: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return [{ name: file.name, rows: XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "", blankrows: true }) }];
  }
  if (ext === "docx") return readDocx(await file.arrayBuffer());
  if (ext === "doc") throw new Error("Older .doc files can't be read. Open it in Word or Google Docs and save as .docx.");
  throw new Error("This dashboard reads Excel (.xlsx, .xls), CSV, or Word (.docx) files with a loss run table.");
}

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

async function readDocx(buf: ArrayBuffer): Promise<Table[]> {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("This Word file has no readable body.");
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const kids = (el: Element, name: string) => Array.from(el.children).filter((c) => c.localName === name && c.namespaceURI === W);
  const cellText = (tc: Element) =>
    kids(tc, "p")
      .map((p) => {
        let s = "";
        p.querySelectorAll("*").forEach((n) => {
          if (n.localName === "t") s += n.textContent ?? "";
          else if (n.localName === "tab" || n.localName === "br") s += " ";
        });
        return s;
      })
      .join(" ")
      .trim();
  const tables: Table[] = [];
  Array.from(doc.getElementsByTagNameNS(W, "tbl")).forEach((tbl, i) => {
    const rows = kids(tbl, "tr").map((tr) => kids(tr, "tc").map(cellText));
    if (rows.length > 1) tables.push({ name: `Table ${i + 1}`, rows });
  });
  if (!tables.length) throw new Error("No tables found in this Word file. The loss run needs to be a Word table, not tabbed text.");
  return tables;
}

export function detectHeaderRow(rows: unknown[][], fields: FieldDef[] = FIELDS) {
  let best = 0;
  let bestScore = 0;
  rows.slice(0, 25).forEach((r, i) => {
    const s = headerRowScore(r, fields);
    if (s > bestScore) {
      best = i;
      bestScore = s;
    }
  });
  return bestScore >= 2 ? best : 0;
}

/** Pick the sheet that looks most like a loss run. */
export function pickTable(tables: Table[], fields: FieldDef[] = FIELDS) {
  let best = 0;
  let bestScore = -1;
  tables.forEach((t, i) => {
    const h = detectHeaderRow(t.rows, fields);
    const s = headerRowScore(t.rows[h] ?? [], fields) * 1000 + Math.min(t.rows.length, 999);
    if (s > bestScore) {
      best = i;
      bestScore = s;
    }
  });
  return best;
}

export interface BuildResult {
  claims: Claim[];
  rowsRead: number;
  skipped: number;
  merged: number;
  fieldsPresent: FieldKey[];
  maxDay: number | null;
}

export function buildClaims(table: Table, headerRow: number, mapping: Mapping, defaultCoverage: Coverage, ind: Industry): BuildResult {
  const body = table.rows.slice(headerRow + 1);
  const has = (k: FieldKey) => mapping[k].length > 0;
  const today = todayDay();
  const byKey = new Map<string, Claim>();
  const out: Claim[] = [];
  let skipped = 0;
  let merged = 0;
  let rowsRead = 0;
  let maxDay: number | null = null;

  body.forEach((row, i) => {
    if (!row || row.every((c) => c === "" || c == null)) return;
    if (row.some((c) => /^\s*(grand\s+)?totals?\s*:?\s*$/i.test(String(c ?? "")))) return;
    rowsRead++;
    const get = (k: FieldKey) => (has(k) ? row[mapping[k][0]] : undefined);
    const money = (k: FieldKey) => mapping[k].reduce((s, c) => s + parseMoney(row[c]), 0);
    const lossDay = parseDay(get("lossDate"));
    if (lossDay == null || lossDay > today) {
      skipped++;
      return;
    }
    const coverageRaw = clean(get("coverage"));
    const coverage = normCoverage(coverageRaw, ind) ?? defaultCoverage;
    let paid = has("paid") ? money("paid") : 0;
    let reserve = has("reserve") ? money("reserve") : 0;
    let incurred = has("incurred") ? money("incurred") : paid + reserve;
    if (has("incurred") && has("paid") && !has("reserve")) reserve = Math.max(0, incurred - paid);
    if (has("incurred") && !has("paid") && has("reserve")) paid = Math.max(0, incurred - reserve);
    if (has("incurred") && !has("paid") && !has("reserve")) paid = incurred;
    const closeDay = parseDay(get("closeDate"));
    const st = normStatus(clean(get("status")), closeDay != null, reserve);
    if (!has("status") && !has("closeDate") && !has("reserve") && has("incurred") && !has("paid")) st.status = "Closed";
    let reportDay = parseDay(get("reportDate"));
    if (reportDay != null && (reportDay < lossDay || reportDay - lossDay > 3650)) reportDay = null;
    const cause = clean(get("cause"));
    const description = clean(get("description"));
    const injury = clean(get("injury"));
    const { y, m } = fromDay(lossDay);
    const id = clean(get("claimNumber"));
    // OSHA recordkeeping: work out the case type from whatever columns were given.
    const ct = has("caseType") ? parseCaseType(get("caseType")) : null;
    const da = has("daysAway") ? parseDays(get("daysAway")) : { n: null, flag: false };
    const dr = has("daysRestricted") ? parseDays(get("daysRestricted")) : { n: null, flag: false };
    let recordable: boolean | null = has("recordable") ? parseYesNo(get("recordable")) : null;
    let caseType: OshaCase | null = ct === "DAFW" || ct === "DJTR" || ct === "Other" ? ct : null;
    if (!caseType && ct !== "None" && recordable !== false) {
      if (da.flag) caseType = "DAFW";
      else if (dr.flag) caseType = "DJTR";
    }
    if (recordable == null) {
      if (ct === "None") recordable = false;
      else if (caseType || ct === "Recordable") recordable = true;
    }
    if (recordable === true && !caseType && ct !== "Recordable" && (has("caseType") || has("daysAway") || has("daysRestricted"))) caseType = "Other";
    if (recordable === false) caseType = null;
    const claim: Claim = {
      id: id || `Row ${headerRow + i + 2}`,
      location: clean(get("location")) || "Unassigned",
      region: clean(get("region")),
      state: clean(get("state")).toUpperCase(),
      coverage,
      coverageRaw,
      lossDay,
      lossYear: y,
      lossMonth: m - 1,
      reportDay,
      lagDays: reportDay != null ? reportDay - lossDay : null,
      status: st.status,
      reopened: st.reopened,
      category: categorize(cause, description, injury, coverage, ind),
      causeRaw: cause,
      bodyPart: clean(get("bodyPart")),
      injury,
      jobTitle: clean(get("jobTitle")),
      claimant: clean(get("claimant")),
      paid,
      reserve,
      incurred,
      litigated: normLitigated(get("litigated")),
      description,
      recordable,
      caseType,
      daysAway: recordable === false ? null : da.n,
      daysRestricted: recordable === false ? null : dr.n,
    };
    maxDay = Math.max(maxDay ?? 0, lossDay, reportDay ?? 0);
    // Feature-level loss runs repeat a claim on several rows (BI + PD, med + indemnity). Merge them.
    if (id) {
      const key = `${id}|${coverage}`;
      const prev = byKey.get(key);
      if (prev) {
        prev.paid += paid;
        prev.reserve += reserve;
        prev.incurred += incurred;
        prev.litigated ||= claim.litigated;
        if (claim.status === "Open") prev.status = "Open";
        if (prev.recordable == null) prev.recordable = claim.recordable;
        if (!prev.caseType) prev.caseType = claim.caseType;
        if (prev.daysAway == null) prev.daysAway = claim.daysAway;
        if (prev.daysRestricted == null) prev.daysRestricted = claim.daysRestricted;
        merged++;
        return;
      }
      byKey.set(key, claim);
    }
    out.push(claim);
  });

  const fieldsPresent = FIELDS.filter((f) => has(f.key)).map((f) => f.key);
  if (!has("incurred") && (has("paid") || has("reserve"))) fieldsPresent.push("incurred");
  return { claims: out, rowsRead, skipped, merged, fieldsPresent, maxDay };
}

export function mappingProblems(mapping: Mapping, fields: FieldDef[] = FIELDS) {
  const p: string[] = [];
  const label = (k: FieldKey) => fields.find((f) => f.key === k)?.label ?? k;
  if (!mapping.lossDate.length) p.push("Pick the Date of loss column.");
  if (!mapping.location.length) p.push(`Pick the ${label("location")} column.`);
  if (!mapping.incurred.length && !mapping.paid.length && !mapping.reserve.length) p.push("Pick Total incurred, or Paid and Reserve.");
  return p;
}

/* ---------------- Hours worked ---------------- */

const H_YEAR = ["year", "calendaryear", "fiscalyear", "policyyear", "yr", "period", "reportingyear", "planyear"];
const H_HOURS = ["hoursworked", "totalhoursworked", "totalhours", "hours", "employeehours", "manhours", "workhours", "laborhours", "hrsworked", "hrs", "totalhoursworkedbyallemployees", "hoursworkedtotal", "annualhours", "exposurehours"];
const H_EMP = ["employees", "averageemployees", "avgemployees", "averagenumberofemployees", "annualaverageemployees", "headcount", "avgheadcount", "fte", "ftes", "employeecount", "numberofemployees", "averageheadcount"];
const H_NAICS = ["naics", "naicscode", "naicsno", "naicsnumber", "industrycode", "naics2017", "naics2022"];
const H_LOC = ["location", "locationname", "site", "store", "storename", "storenumber", "project", "projectname", "jobsite", "terminal", "property", "propertyname", "branch", "facility", "establishment", "establishmentname", "unit"];

/** Finds the hours-worked columns in a header row. Needs a year column plus hours or employees. */
export function hoursColumns(row: unknown[]) {
  const hs = (row ?? []).map(norm);
  const find = (list: string[]) => {
    let i = hs.findIndex((h) => list.includes(h));
    if (i < 0) i = hs.findIndex((h) => h.length >= 3 && list.some((s) => s.length >= 5 && h.includes(s)));
    return i;
  };
  const year = find(H_YEAR);
  const hours = find(H_HOURS);
  const employees = find(H_EMP);
  const location = find(H_LOC);
  const naics = hs.findIndex((h) => H_NAICS.includes(h));
  if (year < 0 || (hours < 0 && employees < 0)) return null;
  return { year, hours, employees, location, naics };
}

export function detectHoursTable(tables: Table[], skip = -1) {
  for (let t = 0; t < tables.length; t++) {
    if (t === skip) continue;
    for (let r = 0; r < Math.min(15, tables[t].rows.length); r++) {
      const cols = hoursColumns(tables[t].rows[r]);
      if (cols && (cols.hours >= 0 || cols.employees >= 0)) return { table: t, headerRow: r, cols };
    }
  }
  return null;
}

/** Hours rows from a table. Average employees x 2,000 hours fills in when hours are missing. */
export function parseHours(table: Table, headerRow: number, cols: NonNullable<ReturnType<typeof hoursColumns>>): HoursRow[] {
  const acc = new Map<string, HoursRow>();
  for (const row of table.rows.slice(headerRow + 1)) {
    if (!row || row.every((c) => c === "" || c == null)) continue;
    const yv = row[cols.year];
    let year = NaN;
    if (typeof yv === "number" && yv >= 1990 && yv <= 2100) year = Math.floor(yv);
    else {
      const m = String(yv ?? "").match(/(19|20)\d{2}/);
      if (m) year = Number(m[0]);
      else {
        const d = parseDay(yv);
        if (d != null) year = fromDay(d).y;
      }
    }
    if (!isFinite(year)) continue;
    let hours = cols.hours >= 0 ? parseMoney(row[cols.hours]) : 0;
    let estimated = false;
    if (!(hours > 0) && cols.employees >= 0) {
      const e = parseMoney(row[cols.employees]);
      if (e > 0) {
        hours = e * 2000;
        estimated = true;
      }
    }
    if (!(hours > 0)) continue;
    const location = cols.location >= 0 ? clean(row[cols.location]) : "";
    const key = `${location}|${year}`;
    const prev = acc.get(key);
    if (prev) {
      prev.hours += hours;
      prev.estimated ||= estimated;
    } else acc.set(key, { location, year, hours, estimated });
  }
  return [...acc.values()].sort((a, b) => a.year - b.year || a.location.localeCompare(b.location, undefined, { numeric: true }));
}

/** The NAICS code typed in the hours sheet, if any (the most common one). */
export function hoursNaics(table: Table, headerRow: number, cols: NonNullable<ReturnType<typeof hoursColumns>>): string {
  if (cols.naics < 0) return "";
  const m = new Map<string, number>();
  for (const row of table.rows.slice(headerRow + 1)) {
    const v = String(row?.[cols.naics] ?? "").trim();
    const c = /\b(31-33|44-45|48-49)\b/.test(v) ? v.match(/\b(31-33|44-45|48-49)\b/)![1] : v.replace(/\D/g, "").slice(0, 6);
    if (c.length >= 2) m.set(c, (m.get(c) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** Hours from any sheet in a workbook, for the "Add hours worked" upload. */
export function hoursFromTables(tables: Table[], skip = -1): { hours: HoursRow[]; naics: string; sheet: string } | null {
  const d = detectHoursTable(tables, skip);
  if (!d) return null;
  const hours = parseHours(tables[d.table], d.headerRow, d.cols);
  if (!hours.length) return null;
  return { hours, naics: hoursNaics(tables[d.table], d.headerRow, d.cols), sheet: tables[d.table].name };
}
