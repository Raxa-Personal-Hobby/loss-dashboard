import { fmtDay, parseDay } from "./normalize";

/** The as-of date a loss run states about itself. */
export interface StatedValuation {
  day: number;
  /** Where in the file it was read, worded to show back to the person: `"Valued as of 10/31/2026"`. */
  text: string;
}

// Longer labels first, so "valued as of" is not read as a bare "valued".
const LABEL = /\b(?:valued\s+as\s+of|valuation\s+(?:date|as\s+of)|evaluat(?:ion\s+date|ed\s+as\s+of)|as[-\s]of\s+date|valued(?:\s+on)?|as\s+of)\b/gi;
const COLUMN = /^(?:valuation(?:\s+date)?|valued(?:\s+as\s+of)?|evaluation\s+date|val\.?\s+date|as[-\s]of(?:\s+date)?)$/i;
// Only a date written out in full counts. A looser reading would turn "since 2019" into a date.
const DATE = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[\s-][A-Za-z]{3,}[\s,-]+\d{2,4}|[A-Za-z]{3,}\.?\s+\d{1,2},?\s+\d{4})/;
const SEPARATOR = /^[\s:–—-]+/;
const LINES_TO_READ = 40;
const CELLS_TO_THE_RIGHT = 3;

function dateAtStart(s: string): { day: number; written: string } | null {
  const m = DATE.exec(s);
  const day = m ? parseDay(m[0]) : null;
  return m && day != null ? { day, written: m[0] } : null;
}

function cellDay(v: unknown): number | null {
  if (typeof v === "string") return dateAtStart(v.trim())?.day ?? null;
  return typeof v === "number" || v instanceof Date ? parseDay(v) : null;
}

/**
 * Finds the as-of date in the lines above the column headings ("Valued as of 10/31/2026", or a
 * "Valuation Date" label with the date in the next cell), else in a valuation date column.
 * Claim rows are never searched for the wording, because a description can say "as of" too.
 */
export function findStatedValuation(rows: unknown[][], headerRow: number): StatedValuation | null {
  for (let r = 0; r < Math.min(headerRow, LINES_TO_READ); r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (typeof cell !== "string") continue;
      for (const m of cell.matchAll(LABEL)) {
        const after = cell.slice(m.index + m[0].length);
        const rest = after.replace(SEPARATOR, "");
        const inCell = dateAtStart(rest);
        if (inCell) return { day: inCell.day, text: `"${cell.slice(m.index, cell.length - rest.length + inCell.written.length)}"` };
        // A label alone in its cell: the date is in a cell to its right.
        if (cell.slice(0, m.index).trim() || rest) continue;
        for (const next of row.slice(c + 1, c + 1 + CELLS_TO_THE_RIGHT)) {
          if (next === "" || next == null) continue;
          const day = cellDay(next);
          if (day != null) return { day, text: `"${m[0]}" ${fmtDay(day)}` };
          break;
        }
      }
    }
  }

  const header = rows[headerRow] ?? [];
  const col = header.findIndex((h) => COLUMN.test(String(h ?? "").trim().replace(/:$/, "")));
  if (col < 0) return null;
  let latest: number | null = null;
  for (let r = headerRow + 1; r < rows.length; r++) {
    const day = cellDay(rows[r]?.[col]);
    if (day != null && (latest == null || day > latest)) latest = day;
  }
  return latest == null ? null : { day: latest, text: `the "${String(header[col]).trim()}" column` };
}
