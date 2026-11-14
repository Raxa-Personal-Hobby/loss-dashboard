import * as XLSX from "xlsx";
import type { Coverage } from "./types";
import type { Industry } from "./industries";

export const DAY_MS = 86400000;
export const dayNum = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
export const fromDay = (n: number) => {
  const dt = new Date(n * DAY_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), dow: dt.getUTCDay() };
};
export const todayDay = () => {
  const t = new Date();
  return dayNum(t.getFullYear(), t.getMonth() + 1, t.getDate());
};
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(n: number | null | undefined, style: "short" | "long" | "iso" = "short") {
  if (n == null) return "";
  const { y, m, d } = fromDay(n);
  if (style === "iso") return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (style === "long") return `${d} ${MONTH_LABELS[m - 1]} ${y}`;
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
}

const valid = (y: number, m: number, d: number) =>
  y >= 1980 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 ? dayNum(y, m, d) : null;
const fixYear = (y: number) => (y < 100 ? (y < 70 ? 2000 + y : 1900 + y) : y);

/** Parse Excel serials, Date objects and the common US / ISO / text date formats into a day number. */
export function parseDay(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : valid(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === "number") {
    if (v > 1 && v < 80000) {
      const p = XLSX.SSF.parse_date_code(v);
      return p ? valid(p.y, p.m, p.d) : null;
    }
    return null;
  }
  const s = String(v).trim();
  if (!s) return null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return valid(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/))) return valid(fixYear(+m[3]), +m[1], +m[2]);
  if ((m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,})[\s,-]+(\d{2,4})/))) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    return mi >= 0 ? valid(fixYear(+m[3]), mi + 1, +m[1]) : null;
  }
  if ((m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})/))) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    return mi >= 0 ? valid(+m[3], mi + 1, +m[2]) : null;
  }
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return valid(+m[1], +m[2], +m[3]);
  if (/^\d+(\.\d+)?$/.test(s)) return parseDay(Number(s));
  const t = Date.parse(s);
  if (!isNaN(t)) {
    const dt = new Date(t);
    return valid(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }
  return null;
}

export function parseMoney(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let s = String(v).trim();
  if (!s || s === "-" || s === "—") return 0;
  const neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s);
  s = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(s);
  if (!isFinite(n)) return 0;
  return neg ? -n : n;
}

export const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

export function normCoverage(raw: string, ind: Industry): Coverage | null {
  if (!raw.trim()) return null;
  const s = ` ${raw.toLowerCase()} `;
  for (const key of ind.matchOrder) {
    const def = ind.coverages.find((c) => c.key === key);
    if (def && def.match.test(s)) return key;
  }
  return "Other";
}

export function normStatus(raw: string, hasClose: boolean, reserve: number): { status: "Open" | "Closed"; reopened: boolean } {
  const s = raw.toLowerCase().trim();
  if (/re-?open/.test(s)) return { status: "Open", reopened: true };
  if (/^(o|op|open|opened|pending|active|new|reported|in progress)\b|open/.test(s)) return { status: "Open", reopened: false };
  if (/^(c|cl|clsd)\b|clos|settl|deni|final|resolved|paid in full|withdrawn/.test(s)) return { status: "Closed", reopened: false };
  if (hasClose) return { status: "Closed", reopened: false };
  return { status: reserve > 0 ? "Open" : "Closed", reopened: false };
}

export function normLitigated(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (!s || /^(n|no|false|0|none|not|non|-|na|n\/a)\b/.test(s)) return false;
  return true;
}

/* ---------------- Cause categories (rules live in the industry profile) ---------------- */

export function categorize(cause: string, description: string, injury: string, coverage: Coverage, ind: Industry): string {
  const boost = new Set(ind.boost[coverage] ?? []);
  const pick = (t: string) => {
    let best = "";
    let bestScore = 0;
    for (const [cat, pats] of ind.rules) {
      let sc = 0;
      for (const p of pats) if (p.test(t)) sc++;
      if (sc > 0 && boost.has(cat)) sc += 0.5;
      if (sc > bestScore) {
        best = cat;
        bestScore = sc;
      }
    }
    return best;
  };
  let cat = cause.trim() ? pick(` ${cause} `.toLowerCase()) : "";
  if (!cat) cat = pick(` ${description} ${injury} `.toLowerCase());
  if (!cat) cat = ind.fallback[coverage] ?? "";
  return cat || "Other";
}

/* ---------------- OSHA recordkeeping fields ---------------- */

/** Yes/No style cells. Blank means "not given" (null). */
export function parseYesNo(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  if (/^(n|no|false|0|none|not|non|-|na|n\/a|first aid|not recordable|non-?recordable|record only|report only)\b/.test(s)) return false;
  if (/^(y|yes|true|1|x|recordable|osha|reportable)\b/.test(s)) return true;
  return null;
}

/** OSHA 300 case type from free text. "None" means the row says it is not recordable. */
export function parseCaseType(v: unknown): "DAFW" | "DJTR" | "Other" | "None" | "Recordable" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (/(not|non)[\s-]?(osha[\s-]?)?recordable|first[\s-]?aid|record[\s-]?only|report[\s-]?only|^none$|^no$|^n$/.test(s)) return "None";
  if (/death|fatal/.test(s)) return "Recordable";
  const away = /away|dafw|lost[\s-]?(time|work|day)|^lt$|days? off|^h$/.test(s);
  const restrict = /transfer|restrict|djtr|light[\s-]?duty|modified[\s-]?duty|limited[\s-]?duty|^i$/.test(s);
  if (away) return "DAFW";
  if (restrict) return "DJTR";
  if (/other|medical[\s-]?treatment|^j$|recordable|^yes$|^y$/.test(s)) return "Other";
  return null;
}

/** Day counts. A non-numeric "Yes" style value means days happened but weren't counted. */
export function parseDays(v: unknown): { n: number | null; flag: boolean } {
  if (v == null || v === "") return { n: null, flag: false };
  if (typeof v === "number") return isFinite(v) && v >= 0 ? { n: Math.round(v), flag: v > 0 } : { n: null, flag: false };
  const s = String(v).trim();
  if (!s) return { n: null, flag: false };
  const m = s.replace(/,/g, "").match(/^\d+(\.\d+)?/);
  if (m) {
    const n = Math.round(parseFloat(m[0]));
    return { n, flag: n > 0 };
  }
  const yn = parseYesNo(s);
  return { n: null, flag: yn === true };
}

/**
 * Works out recordable and case type from whatever OSHA columns a row had.
 * Shared by the loss run and the safety report so both read the columns the same way.
 */
export function resolveOsha(
  given: { recordable: boolean; caseType: boolean; daysAway: boolean; daysRestricted: boolean },
  raw: { recordable: unknown; caseType: unknown; daysAway: unknown; daysRestricted: unknown },
): { recordable: boolean | null; caseType: "DAFW" | "DJTR" | "Other" | null; daysAway: number | null; daysRestricted: number | null } {
  const ct = given.caseType ? parseCaseType(raw.caseType) : null;
  const da = given.daysAway ? parseDays(raw.daysAway) : { n: null, flag: false };
  const dr = given.daysRestricted ? parseDays(raw.daysRestricted) : { n: null, flag: false };
  let recordable: boolean | null = given.recordable ? parseYesNo(raw.recordable) : null;
  let caseType: "DAFW" | "DJTR" | "Other" | null = ct === "DAFW" || ct === "DJTR" || ct === "Other" ? ct : null;
  if (!caseType && ct !== "None" && recordable !== false) {
    if (da.flag) caseType = "DAFW";
    else if (dr.flag) caseType = "DJTR";
  }
  if (recordable == null) {
    if (ct === "None") recordable = false;
    else if (caseType || ct === "Recordable") recordable = true;
  }
  if (recordable === true && !caseType && ct !== "Recordable" && (given.caseType || given.daysAway || given.daysRestricted)) caseType = "Other";
  if (recordable === false) caseType = null;
  return { recordable, caseType, daysAway: recordable === false ? null : da.n, daysRestricted: recordable === false ? null : dr.n };
}
