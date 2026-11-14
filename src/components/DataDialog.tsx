import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, FileSpreadsheet, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { autoMap, fieldsFor } from "@/lib/fields";
import { INDUSTRIES, type Industry } from "@/lib/industries";
import { ACCEPT, buildClaims, detectHeaderRow, hoursFromTables, mappingProblems, pickTable, readFile, type Table } from "@/lib/parse";
import type { Coverage, Dataset, FieldKey, Mapping } from "@/lib/types";
import { fmtDay, parseDay, todayDay } from "@/lib/normalize";
import { num } from "@/lib/metrics";
import { saveFile } from "@/lib/claude";
import { safetyTemplateXlsx, sampleXlsx, tableXlsx, templateXlsx } from "@/lib/exporters";
import { makeSafetyTable, makeSampleTable } from "@/lib/sample";
import { announceSave } from "./kit";

const colName = (i: number) => {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply: (d: Dataset) => void;
  onSample: () => void;
  largeAt: number;
  setLargeAt: (n: number) => void;
  ind: Industry;
  onIndustry: (id: string) => void;
  /** Name of the safety report already combined, if any. */
  safetyName?: string;
  /** Opens the safety report steps (add, or review the matches of the one already combined). */
  onSafety: () => void;
}

export function DataDialog({ open, onOpenChange, onApply, onSample, largeAt, setLargeAt, ind, onIndustry, safetyName, onSafety }: Props) {
  const FIELDS = useMemo(() => fieldsFor(ind), [ind]);
  const [fileName, setFileName] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [ti, setTi] = useState(0);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [defCov, setDefCov] = useState<Coverage>(ind.coverages[0].key);
  const [valuation, setValuation] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const table = tables[ti];
  const headers = useMemo(() => (table ? (table.rows[headerRow] ?? []).map((h, i) => String(h ?? "").trim() || `Column ${colName(i)}`) : []), [table, headerRow]);
  const preview = useMemo(() => (table && mapping ? buildClaims(table, headerRow, mapping, defCov, ind) : null), [table, headerRow, mapping, defCov, ind]);
  const problems = mapping ? mappingProblems(mapping, FIELDS) : [];
  const hoursFound = useMemo(() => (tables.length ? hoursFromTables(tables, ti) : null), [tables, ti]);
  const samples = (col: number, isDate: boolean) => {
    if (!table) return "";
    const out: string[] = [];
    for (let r = headerRow + 1; r < table.rows.length && out.length < 3; r++) {
      const v = table.rows[r]?.[col];
      if (v === "" || v == null) continue;
      const d = isDate && typeof v === "number" ? parseDay(v) : null;
      out.push(d != null ? fmtDay(d) : String(v).slice(0, 28));
    }
    return out.join(" · ");
  };

  const choose = (t: Table[], idx: number) => {
    setTi(idx);
    const h = detectHeaderRow(t[idx].rows, FIELDS);
    setHeaderRow(h);
    setMapping(autoMap(t[idx].rows[h] ?? [], FIELDS));
    setValuation("");
  };

  const onFile = async (file: File) => {
    setErr("");
    setLoading(true);
    try {
      const t = await readFile(file);
      if (!t.length) throw new Error("That file looks empty.");
      setTables(t);
      setFileName(file.name);
      choose(t, pickTable(t, FIELDS));
    } catch (e: any) {
      setErr(e?.message || "Could not read that file.");
      setTables([]);
      setMapping(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTables([]);
    setMapping(null);
    setFileName("");
    setErr("");
  };

  const setField = (k: FieldKey, cols: number[]) => mapping && setMapping({ ...mapping, [k]: cols });

  const apply = () => {
    if (!preview || !mapping || problems.length) return;
    if (!preview.claims.length) {
      setErr("No rows had a readable date of loss. Check the Date of loss column or the header row.");
      return;
    }
    const vd = parseDay(valuation) ?? Math.min(preview.maxDay ?? todayDay(), todayDay());
    const hw = hoursFound;
    onApply({
      claims: preview.claims,
      sourceName: fileName + (tables.length > 1 ? ` › ${table.name}` : ""),
      isSample: false,
      valuationDay: vd,
      rowsRead: preview.rowsRead,
      rowsSkipped: preview.skipped,
      fieldsPresent: preview.fieldsPresent,
      industry: ind.id,
      source: { table, headerRow, mapping, defCov },
      ...(hw ? { hours: hw.hours, hoursSource: `${fileName} › ${hw.sheet}`, naics: hw.naics || undefined } : {}),
    });
    onOpenChange(false);
    reset();
  };

  const other = preview ? preview.claims.filter((c) => c.category === "Other").length : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setErr(""); }}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">Upload source data</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">
              Your loss run first, then a safety report if you have one. Files are read in this browser and aren't uploaded anywhere.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <label className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f8f9] px-3 py-2.5 text-[13px]">
            <span className="font-semibold text-[#1c2126]">Industry</span>
            <select
              className="rounded-md border border-[#d8dce1] bg-white px-2 py-1 text-[13px] font-semibold text-[#1c2126]"
              value={ind.id}
              onChange={(e) => {
                onIndustry(e.target.value);
                setDefCov(INDUSTRIES.find((i) => i.id === e.target.value)?.coverages[0].key ?? "Other");
              }}
            >
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-[#6c737d]">Sets the cause categories, labels and safety tips.</span>
          </label>
          {!mapping && (
            <>
              <section>
                <h4 className="mb-2 text-[13px] font-bold text-[#1c2126]">
                  1. Loss run <span className="font-normal text-[#8b929b]">Required</span>
                </h4>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
                  className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${drag ? "border-[color:var(--brand)] bg-[color:var(--brand-tint)]" : "border-[#cdd1d7] bg-[#f7f8f9] hover:border-[#9aa0a8]"}`}
                >
                  {loading ? <Loader2 className="h-7 w-7 animate-spin text-[#5d6570]" /> : <Upload className="h-7 w-7 text-[#5d6570]" />}
                  <div className="mt-3 text-[15px] font-bold text-[#1c2126]">Drop a loss run here, or tap to choose</div>
                  <div className="mt-1 text-[12.5px] text-[#5d6570]">The claims list from your carrier, TPA or broker. .xlsx · .xls · .csv · .docx (table). Google Sheets or Docs: download as .xlsx or .docx first.</div>
                </button>
                <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
                {err && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#fbe3e1] px-3 py-2.5 text-[13px] text-[#b42318]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
                  </div>
                )}
              </section>

              <section>
                <h4 className="mb-2 text-[13px] font-bold text-[#1c2126]">
                  2. Safety report <span className="font-normal text-[#8b929b]">Optional</span>
                </h4>
                <div className="flex flex-col gap-3 rounded-xl border border-[#e3e6ea] p-3.5 sm:flex-row sm:items-center">
                  <ClipboardList className="hidden h-5 w-5 shrink-0 text-[#5d6570] sm:block" />
                  <div className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-[#5d6570]">
                    {safetyName ? (
                      <>
                        <span className="font-semibold text-[#1c2126]">Added: {safetyName}</span>. Check or change how its locations are matched to the loss run.
                      </>
                    ) : (
                      <>
                        An OSHA 300 log, OSHA's injury tracking (ITA) CSV, or your own incident sheet. Its locations are matched to the loss run's, you confirm each match, and the safety rates and findings use both. Hours worked can be on the same sheet.
                      </>
                    )}
                  </div>
                  <button type="button" onClick={onSafety} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] font-bold ring-1 ring-[#d8dce1] hover:ring-[#b7bcc4]" style={{ color: "var(--brand-deep)" }}>
                    {safetyName ? "Review matches" : "Add a safety report"}
                  </button>
                </div>
              </section>

              <section>
                <h4 className="mb-2 text-[13px] font-bold text-[#1c2126]">Templates and samples</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { t: "Loss run template", d: "Blank Excel with the standard columns and a field guide", f: `${ind.id}-loss-run-template.xlsx`, b: () => templateXlsx(ind) },
                    { t: "Safety report template", d: "Blank Excel with OSHA 300 style columns and a field guide", f: "safety-report-template.xlsx", b: () => safetyTemplateXlsx(ind) },
                    { t: "Sample loss run", d: "Synthetic claims to see the format", f: `sample-${ind.id}-loss-run.xlsx`, b: () => sampleXlsx(makeSampleTable(ind), ind) },
                    { t: "Sample safety report", d: "Synthetic cases that pair with the sample loss run", f: `sample-${ind.id}-safety-report.xlsx`, b: () => tableXlsx(makeSafetyTable(ind).table) },
                  ].map((x) => (
                    <button key={x.t} type="button" onClick={async () => announceSave(await saveFile(x.f, x.b()), x.f)} className="flex items-start gap-2.5 rounded-lg border border-[#e3e6ea] p-3 text-left hover:border-[#cdd1d7]">
                      <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-[#5d6570]" />
                      <span>
                        <span className="block text-[13px] font-bold text-[#1c2126]">{x.t}</span>
                        <span className="block text-[12px] text-[#5d6570]">{x.d}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { onSample(); onOpenChange(false); }} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
                  <Sparkles className="h-3.5 w-3.5" /> Or reload the demo {ind.name.toLowerCase()} company
                </button>
              </section>
            </>
          )}

          {mapping && table && (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f8f9] px-3 py-2.5 text-[13px]">
                <FileSpreadsheet className="h-4 w-4 text-[#5d6570]" />
                <span className="font-semibold text-[#1c2126]">{fileName}</span>
                {tables.length > 1 && (
                  <select className="rounded-md border border-[#d8dce1] bg-white px-2 py-1 text-[12.5px]" value={ti} onChange={(e) => choose(tables, Number(e.target.value))}>
                    {tables.map((t, i) => (
                      <option key={i} value={i}>
                        {t.name} ({t.rows.length} rows)
                      </option>
                    ))}
                  </select>
                )}
                <label className="ml-auto flex items-center gap-1.5 text-[12.5px] text-[#5d6570]">
                  Header row
                  <input
                    type="number"
                    min={1}
                    max={Math.min(40, table.rows.length)}
                    value={headerRow + 1}
                    onChange={(e) => {
                      const h = Math.max(0, Math.min(table.rows.length - 1, Number(e.target.value) - 1));
                      setHeaderRow(h);
                      setMapping(autoMap(table.rows[h] ?? [], FIELDS));
                    }}
                    className="w-14 rounded-md border border-[#d8dce1] bg-white px-2 py-1 text-[12.5px]"
                  />
                </label>
                <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
                  <X className="h-3.5 w-3.5" /> Different file
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <h4 className="text-[14px] font-bold text-[#1c2126]">Match your columns</h4>
                  <span className="text-[12px] text-[#5d6570]">Auto-matched. Fix anything that looks off.</span>
                </div>
                <div className="divide-y divide-[#f0f1f3] rounded-xl border border-[#e3e6ea]">
                  {FIELDS.map((f) => {
                    const cols = mapping[f.key];
                    return (
                      <div key={f.key} className="grid grid-cols-1 gap-1.5 px-3 py-2.5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-3">
                        <div>
                          <div className="text-[13px] font-semibold text-[#1c2126]">
                            {f.label}
                            {(f.required || f.key === "incurred") && <span className="ml-1 text-[#b42318]">*</span>}
                          </div>
                          <div className="text-[11px] leading-snug text-[#8b929b]">{f.help}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {f.money &&
                              cols.map((c) => (
                                <span key={c} className="inline-flex items-center gap-1 rounded-md bg-[color:var(--brand-tint)] px-2 py-1 text-[12px] font-semibold text-[#1c2126]">
                                  {headers[c]}
                                  <button type="button" aria-label={`Remove ${headers[c]}`} onClick={() => setField(f.key, cols.filter((x) => x !== c))}>
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            <select
                              className="min-w-0 max-w-full flex-1 rounded-md border border-[#d8dce1] bg-white px-2 py-1.5 text-[12.5px] text-[#1c2126]"
                              value={f.money ? "" : cols[0] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (f.money) v !== "" && setField(f.key, [...cols, Number(v)]);
                                else setField(f.key, v === "" ? [] : [Number(v)]);
                              }}
                            >
                              <option value="">{f.money ? (cols.length ? "+ add another column to sum" : "Not in this file") : "Not in this file"}</option>
                              {headers.map((h, i) => (
                                <option key={i} value={i} disabled={f.money && cols.includes(i)}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                          {cols.length > 0 && <div className="mt-1 truncate text-[11px] text-[#8b929b]">e.g. {cols.map((c) => samples(c, f.key.endsWith("Date"))).filter(Boolean).join(" | ")}</div>}
                          {f.key === "coverage" && cols.length === 0 && (
                            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#5d6570]">
                              Treat every row as
                              <select className="rounded-md border border-[#d8dce1] bg-white px-2 py-1 text-[12px]" value={defCov} onChange={(e) => setDefCov(e.target.value as Coverage)}>
                                {ind.coverages.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.label}
                                  </option>
                                ))}
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[12.5px] font-semibold text-[#1c2126]">Valued as of</span>
                  <input type="date" className="mt-1 w-full rounded-md border border-[#d8dce1] bg-white px-2 py-1.5 text-[13px]" value={valuation || (preview?.maxDay ? fmtDay(Math.min(preview.maxDay, todayDay()), "iso") : "")} onChange={(e) => setValuation(e.target.value)} />
                  <span className="mt-1 block text-[11px] text-[#8b929b]">Defaults to the latest date in the file. Use the loss run's valuation date if it has one.</span>
                </label>
                <label className="block">
                  <span className="text-[12.5px] font-semibold text-[#1c2126]">Large loss threshold</span>
                  <input type="number" min={1000} step={5000} className="mt-1 w-full rounded-md border border-[#d8dce1] bg-white px-2 py-1.5 text-[13px]" value={largeAt} onChange={(e) => setLargeAt(Math.max(1000, Number(e.target.value) || 100000))} />
                  <span className="mt-1 block text-[11px] text-[#8b929b]">Claims at or above this incurred get called out.</span>
                </label>
              </div>

              {preview && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] ${problems.length ? "bg-[#f8edd9] text-[#9a5b00]" : "bg-[#e4f3ea] text-[#18794e]"}`}>
                  {problems.length ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div>
                    {problems.length ? (
                      problems.join(" ")
                    ) : (
                      <>
                        <b>{num(preview.claims.length)} claims</b> ready from {num(preview.rowsRead)} rows.
                        {preview.skipped > 0 && ` ${num(preview.skipped)} rows skipped (no readable date of loss).`}
                        {preview.merged > 0 && ` ${num(preview.merged)} feature rows merged into their claims.`}
                        {preview.claims.length > 0 && other / preview.claims.length > 0.2 && ` ${Math.round((other / preview.claims.length) * 100)}% couldn't be matched to a cause and show as Other.`}
                        {preview.fieldsPresent.includes("recordable") || preview.fieldsPresent.includes("caseType") ? " OSHA columns found, so the Safety section will show case types." : ""}
                        {hoursFound ? ` Hours worked found on "${hoursFound.sheet}" (${num(hoursFound.hours.length)} rows), so TRIR and DART will be worked out.` : ""}
                      </>
                    )}
                  </div>
                </div>
              )}
              {err && (
                <div className="flex items-start gap-2 rounded-lg bg-[#fbe3e1] px-3 py-2.5 text-[13px] text-[#b42318]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
                  Cancel
                </button>
                <button type="button" disabled={!!problems.length} onClick={apply} className="rounded-lg bg-[color:var(--brand-deep)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40">
                  Build dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
