// Turn a loss run into the "Power BI data model" workbook without opening the dashboard.
// Same file as Export › Power BI data model in the app, with no filters set.
// Runs on your computer only; nothing is sent anywhere.
//
//   pnpm powerbi <loss-run.xlsx|.csv> [--out file.xlsx] [--naics 722511] [--industry restaurant] [--valuation 2026-10-31]
//
// Point Power BI at the --out file once. After that, run this again and press Refresh.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import * as XLSX from "xlsx";
import { readFile } from "../src/lib/parse";
import { analyzeTables } from "../src/lib/headless";
import { powerBiWorkbook } from "../src/lib/powerbi";
import { INDUSTRIES, type IndustryId } from "../src/lib/industries";
import { fmtDay } from "../src/lib/normalize";
import { num } from "../src/lib/metrics";

const USAGE = `Usage: pnpm powerbi <loss-run.xlsx|.xls|.csv> [options]

Options:
  --out <file>         Where to save (default: <input name>-powerbi.xlsx next to the input)
  --naics <code>       Industry code for the BLS safety benchmark and the template
  --industry <name>    Template: ${INDUSTRIES.map((i) => i.id).join(", ")} (default: from --naics, else general)
  --valuation <date>   Valuation date, e.g. 2026-10-31 (default: the date the file states, else latest loss date)
  --help               Show this help`;

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: { out: { type: "string" }, naics: { type: "string" }, industry: { type: "string" }, valuation: { type: "string" }, help: { type: "boolean" } },
  });
} catch (e: any) {
  fail(`${e.message}\n\n${USAGE}`);
}
const { values: o, positionals } = args;
if (o.help || positionals.length !== 1) {
  console.log(USAGE);
  process.exit(o.help ? 0 : 1);
}

const input = path.resolve(positionals[0]);
const ext = path.extname(input).toLowerCase();
if (ext === ".docx") fail("Word files work in the dashboard but not here. Save the table as .xlsx or .csv first.");
if (o.industry && !INDUSTRIES.some((i) => i.id === o.industry)) fail(`Unknown --industry "${o.industry}". Use one of: ${INDUSTRIES.map((i) => i.id).join(", ")}`);

let bytes: Buffer;
try {
  bytes = readFileSync(input);
} catch {
  fail(`Can't read ${input}`);
}

try {
  const tables = await readFile(new File([bytes], path.basename(input)));
  const r = analyzeTables(tables, { sourceName: path.basename(input), industry: o.industry as IndustryId | undefined, naics: o.naics, valuation: o.valuation });
  const out = path.resolve(o.out ?? path.join(path.dirname(input), `${path.basename(input, ext)}-powerbi.xlsx`));
  writeFileSync(out, XLSX.write(powerBiWorkbook(r.input), { bookType: "xlsx", type: "buffer", compression: true }));
  const x = r.input;
  console.log(`Read "${r.sheet}": ${num(x.filtered.length)} claims${r.rowsSkipped ? `, ${num(r.rowsSkipped)} rows skipped (no readable date of loss)` : ""}`);
  console.log(`Template: ${r.ind.name} · valued ${fmtDay(x.valuationDay, "long")}${r.hoursSheet ? ` · hours from "${r.hoursSheet}"` : ""}`);
  console.log(`Columns found: ${r.fieldsPresent.join(", ")}`);
  console.log(`${num(x.locRows.length)} locations · ${num(x.concerns.length)} findings${x.safety ? ` · safety rates for ${x.safety.rows.length} years` : ""}`);
  console.log(`Saved ${out}`);
} catch (e: any) {
  fail(e?.message || String(e));
}
