import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, FileSpreadsheet, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Industry } from "@/lib/industries";
import type { Thresholds } from "@/lib/thresholds";
import type { Claim, HoursConflict, LocationLink, ParsedSafetyReport, SafetyMerge } from "@/lib/types";
import { ACCEPT, hoursFromTables, readFile, type Table } from "@/lib/parse";
import { matchLocations, type MatchResult, type Suggestion, type Tier } from "@/lib/locmatch";
import { SAFETY_FIELDS, autoMapSafety, buildMerge, detectSafetyHeader, parseSafetyReport, safetyMappingProblems, type SafetyKey, type SafetyMapping } from "@/lib/safetyreport";
import { makeSafetyTable } from "@/lib/sample";
import { tableXlsx } from "@/lib/exporters";
import { saveFile } from "@/lib/claude";
import { num } from "@/lib/metrics";
import { announceSave } from "./kit";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  claims: Claim[];
  ind: Industry;
  th: Thresholds;
  /** Set when reviewing matches for a report that is already combined. */
  existing?: SafetyMerge;
  onApply: (m: SafetyMerge) => void;
}

/** What the user decided for one safety report location. decided=false means it still needs a look. */
interface Decision {
  a: string | null;
  decided: boolean;
}

const TIER: Record<Tier, { label: string; cls: string }> = {
  high: { label: "High confidence", cls: "bg-[#e4f3ea] text-[#18794e]" },
  medium: { label: "Suggested", cls: "bg-[#f8edd9] text-[#9a5b00]" },
  low: { label: "No match found", cls: "bg-[#f1f3f5] text-[#5d6570]" },
};

const field = "rounded-md border border-[#d8dce1] bg-white px-2 py-1.5 text-[12.5px] text-[#1c2126]";

export function SafetyReportDialog({ open, onOpenChange, claims, ind, th, existing, onApply }: Props) {
  const [step, setStep] = useState<"file" | "columns" | "locations">(existing ? "locations" : "file");
  const [fileName, setFileName] = useState(existing?.report.sourceName ?? "");
  const [tables, setTables] = useState<Table[]>([]);
  const [ti, setTi] = useState(0);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<SafetyMapping | null>(null);
  const [report, setReport] = useState<ParsedSafetyReport | null>(existing?.report ?? null);
  const [conflicts, setConflicts] = useState<HoursConflict[]>(existing?.report.hoursConflicts ?? []);
  // Reviewing an existing merge keeps the user's decisions. A decision pointing at a location the
  // current loss run no longer has goes back to "needs a decision".
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => {
    if (!existing) return {};
    const have = new Set(claims.map((c) => c.location));
    return Object.fromEntries(existing.links.map((l) => [l.b, l.a == null || have.has(l.a) ? { a: l.a, decided: true } : { a: null, decided: false }]));
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aNames = useMemo(() => [...new Set(claims.map((c) => c.location))].sort((x, y) => x.localeCompare(y, undefined, { numeric: true })), [claims]);
  const match: MatchResult | null = useMemo(() => (report ? matchLocations(aNames, report.locations, th.match) : null), [report, aNames, th.match]);
  const byB = useMemo(() => new Map(match?.suggestions.map((s) => [s.b, s]) ?? []), [match]);

  const table = tables[ti];
  const headers = useMemo(() => (table ? (table.rows[headerRow] ?? []).map((h, i) => String(h ?? "").trim() || `Column ${i + 1}`) : []), [table, headerRow]);
  const problems = mapping ? safetyMappingProblems(mapping) : [];

  const load = (t: Table[], name: string) => {
    setTables(t);
    setFileName(name);
    // Pick the sheet that looks most like a safety log.
    let best = 0;
    let bestN = -1;
    t.forEach((tb, i) => {
      const h = detectSafetyHeader(tb.rows);
      const n = Object.values(autoMapSafety(tb.rows[h] ?? [])).filter((c) => c >= 0).length;
      if (n > bestN) {
        best = i;
        bestN = n;
      }
    });
    choose(t, best);
    setStep("columns");
  };
  const choose = (t: Table[], idx: number) => {
    setTi(idx);
    const h = detectSafetyHeader(t[idx].rows);
    setHeaderRow(h);
    setMapping(autoMapSafety(t[idx].rows[h] ?? []));
  };

  const onFile = async (file: File) => {
    setErr("");
    setLoading(true);
    try {
      const t = await readFile(file);
      if (!t.length) throw new Error("That file looks empty.");
      load(t, file.name);
    } catch (e: any) {
      setErr(e?.message || "Could not read that file.");
    } finally {
      setLoading(false);
    }
  };

  const toLocations = () => {
    if (!table || !mapping || problems.length) return;
    const r = parseSafetyReport(table, headerRow, mapping, fileName + (tables.length > 1 ? ` › ${table.name}` : ""));
    // No hours on the case rows: use an hours sheet elsewhere in the same file, if there is one.
    if (!r.hours.length && !r.hoursConflicts.length && tables.length > 1) {
      const hw = hoursFromTables(tables, ti);
      if (hw) {
        r.hours = hw.hours;
        hw.hours.forEach((h) => h.location && !r.locations.includes(h.location) && r.locations.push(h.location));
        r.sourceName += ` + hours from ${hw.sheet}`;
      }
    }
    if (!r.locations.length) {
      setErr("No rows had both a location and a year. Check the Location and Year columns or the header row.");
      return;
    }
    const m = matchLocations(aNames, r.locations, th.match);
    // High is pre-checked, Medium waits for a decision, Low starts as "no match".
    setDecisions(Object.fromEntries(m.suggestions.map((s) => [s.b, { a: s.tier === "low" ? null : s.a, decided: s.tier !== "medium" }])));
    setReport(r);
    setConflicts(r.hoursConflicts);
    setErr("");
    setStep("locations");
  };

  const set = (b: string, a: string | null) => setDecisions((d) => ({ ...d, [b]: { a, decided: true } }));
  const pending = report ? report.locations.filter((b) => !decisions[b]?.decided) : [];
  const linkedA = new Set(Object.values(decisions).filter((d) => d.a).map((d) => d.a as string));
  const onlyA = aNames.filter((a) => !linkedA.has(a));

  const counts = useMemo(() => {
    const a = new Map<string, number>();
    claims.forEach((c) => a.set(c.location, (a.get(c.location) ?? 0) + 1));
    const b = new Map<string, { cases: number; rec: number }>();
    report?.cases.forEach((c) => {
      const cur = b.get(c.sourceLocation) ?? { cases: 0, rec: 0 };
      cur.cases++;
      if (c.recordable) cur.rec++;
      b.set(c.sourceLocation, cur);
    });
    return { a, b };
  }, [claims, report]);

  const combine = () => {
    if (!report || pending.length) return;
    const links: LocationLink[] = report.locations.map((b) => {
      const s = byB.get(b);
      const a = decisions[b]?.a ?? null;
      const same = s && s.a === a;
      return { b, a, tier: same ? s.tier : a ? "medium" : "low", score: same ? s.score : 0, reasons: same ? s.reasons : a ? ["Picked by you"] : [] };
    });
    onApply(buildMerge(claims, { ...report, hoursConflicts: conflicts }, links));
    onOpenChange(false);
  };

  const groups: { tier: Tier; title: string; sub: string }[] = [
    { tier: "medium", title: "Needs your review", sub: "Possible matches. Accept or reject each one, or pick a different location." },
    { tier: "high", title: "Matched", sub: "Strong matches, already checked. Uncheck any that are wrong." },
    { tier: "low", title: "Only in the safety report", sub: "Nothing close enough in the loss run. They stay in the dashboard under their own names. Pick a location if you know the match." },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto p-0">
        <div className="border-b border-[#e3e6ea] px-5 pb-4 pt-5 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[19px] font-extrabold text-[#1c2126]">{existing ? "Review location matches" : "Add a safety report"}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#5d6570]">
              An OSHA 300 log export or your own safety sheet, joined to the loss run by location and year. Read in this browser only. Nothing is combined until you confirm every location.
            </DialogDescription>
          </DialogHeader>
          <ol className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
            {[
              ["file", "1. File"],
              ["columns", "2. Columns"],
              ["locations", "3. Locations"],
            ].map(([k, label]) => (
              <li key={k} className={`rounded-full px-2.5 py-1 ${step === k ? "text-white" : "bg-[#f1f3f5] text-[#5d6570]"}`} style={step === k ? { background: "var(--brand-deep)" } : undefined}>
                {label}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {step === "file" && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
                className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-[color:var(--brand)] bg-[color:var(--brand-tint)]" : "border-[#cdd1d7] bg-[#f7f8f9] hover:border-[#9aa0a8]"}`}
              >
                {loading ? <Loader2 className="h-7 w-7 animate-spin text-[#5d6570]" /> : <Upload className="h-7 w-7 text-[#5d6570]" />}
                <div className="mt-3 text-[15px] font-bold text-[#1c2126]">Drop a safety report here, or tap to choose</div>
                <div className="mt-1 text-[12.5px] text-[#5d6570]">.xlsx · .xls · .csv · .docx (table). One row per case, with location and year. Hours worked can be on the same rows.</div>
              </button>
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
              {err && <ErrorBox text={err} />}
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => load([makeSafetyTable(ind).table], "Sample safety report (synthetic)")} className="flex items-start gap-2.5 rounded-lg border border-[#e3e6ea] p-3 text-left hover:border-[#cdd1d7]">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#5d6570]" />
                  <span>
                    <span className="block text-[13px] font-bold text-[#1c2126]">Try the sample safety report</span>
                    <span className="block text-[12px] text-[#5d6570]">Synthetic, with location names deliberately written differently from the sample loss run</span>
                  </span>
                </button>
                <button type="button" onClick={async () => { const n = `sample-${ind.id}-safety-report.xlsx`; announceSave(await saveFile(n, tableXlsx(makeSafetyTable(ind).table)), n); }} className="flex items-start gap-2.5 rounded-lg border border-[#e3e6ea] p-3 text-left hover:border-[#cdd1d7]">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-[#5d6570]" />
                  <span>
                    <span className="block text-[13px] font-bold text-[#1c2126]">Download the sample safety report</span>
                    <span className="block text-[12px] text-[#5d6570]">To see the format</span>
                  </span>
                </button>
              </div>
            </>
          )}

          {step === "columns" && table && mapping && (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f7f8f9] px-3 py-2.5 text-[13px]">
                <FileSpreadsheet className="h-4 w-4 text-[#5d6570]" />
                <span className="font-semibold text-[#1c2126]">{fileName}</span>
                {tables.length > 1 && (
                  <select className={field} value={ti} onChange={(e) => choose(tables, Number(e.target.value))}>
                    {tables.map((t, i) => (
                      <option key={i} value={i}>
                        {t.name} ({t.rows.length} rows)
                      </option>
                    ))}
                  </select>
                )}
                <label className="ml-auto flex items-center gap-1.5 text-[12.5px] text-[#5d6570]">
                  Header row
                  <input type="number" min={1} max={Math.min(40, table.rows.length)} value={headerRow + 1} className="w-14 rounded-md border border-[#d8dce1] bg-white px-2 py-1 text-[12.5px]" onChange={(e) => { const h = Math.max(0, Math.min(table.rows.length - 1, Number(e.target.value) - 1)); setHeaderRow(h); setMapping(autoMapSafety(table.rows[h] ?? [])); }} />
                </label>
                <button type="button" onClick={() => { setStep("file"); setTables([]); setMapping(null); }} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
                  <X className="h-3.5 w-3.5" /> Different file
                </button>
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h4 className="text-[14px] font-bold text-[#1c2126]">Match your columns</h4>
                  <span className="text-[12px] text-[#5d6570]">Auto-matched. Fix anything that looks off. Employee names are never read.</span>
                </div>
                <div className="divide-y divide-[#f0f1f3] rounded-xl border border-[#e3e6ea]">
                  {SAFETY_FIELDS.map((f) => {
                    const c = mapping[f.key];
                    return (
                      <div key={f.key} className="grid grid-cols-1 gap-1.5 px-3 py-2.5 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-3">
                        <div>
                          <div className="text-[13px] font-semibold text-[#1c2126]">
                            {f.label}
                            {f.required && <span className="ml-1 text-[#b42318]">*</span>}
                          </div>
                          <div className="text-[11px] leading-snug text-[#8b929b]">{f.help}</div>
                        </div>
                        <div className="min-w-0">
                          <select className={`${field} w-full`} value={c < 0 ? "" : c} onChange={(e) => setMapping({ ...mapping, [f.key as SafetyKey]: e.target.value === "" ? -1 : Number(e.target.value) })}>
                            <option value="">Not in this file</option>
                            {headers.map((h, i) => (
                              <option key={i} value={i}>
                                {h}
                              </option>
                            ))}
                          </select>
                          {c >= 0 && <div className="mt-1 truncate text-[11px] text-[#8b929b]">e.g. {samples(table, headerRow, c)}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {problems.length > 0 && <ErrorBox text={problems.join(" ")} warn />}
              {err && <ErrorBox text={err} />}
              <Footer onCancel={() => onOpenChange(false)}>
                <button type="button" disabled={!!problems.length} onClick={toLocations} className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--brand-deep)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40">
                  Match locations <ArrowRight className="h-4 w-4" />
                </button>
              </Footer>
            </>
          )}

          {step === "locations" && report && match && (
            <>
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg bg-[#f7f8f9] px-4 py-3">
                <Stat label="Safety report rows" value={num(report.cases.length)} sub={report.rowsSkipped ? `${num(report.rowsSkipped)} skipped (no year)` : report.sourceName} />
                <Stat label="Matched" value={num(report.locations.filter((b) => decisions[b]?.decided && decisions[b]?.a).length)} sub={`of ${num(report.locations.length)} safety report locations`} />
                <Stat label="Need a decision" value={num(pending.length)} sub={pending.length ? "Combine unlocks at 0" : "All set"} tone={pending.length ? "warn" : "ok"} />
                <Stat label="Only in the loss run" value={num(onlyA.length)} sub="Kept, shown as loss run only" />
              </div>

              {(match.dupesA.length > 0 || match.dupesB.length > 0) && (
                <div className="rounded-lg border border-[#f1dcb4] bg-[#fdf7ec] px-4 py-3 text-[12.5px] text-[#7a4a00]">
                  <div className="font-bold">Names that look like the same place inside one report</div>
                  <p className="mt-0.5">Nothing was grouped automatically. If they are the same place, match each one to the same location below and they'll be combined. Otherwise leave them separate.</p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                    {match.dupesB.map((g) => <li key={`b${g.join()}`}>Safety report: {g.join(" · ")}</li>)}
                    {match.dupesA.map((g) => <li key={`a${g.join()}`}>Loss run: {g.join(" · ")}</li>)}
                  </ul>
                </div>
              )}

              {groups.map((g) => {
                const items = match.suggestions.filter((s) => s.tier === g.tier);
                if (!items.length) return null;
                return (
                  <section key={g.tier}>
                    <div className="mb-2">
                      <h4 className="text-[14px] font-bold text-[#1c2126]">
                        {g.title} <span className="font-semibold text-[#8b929b]">({items.length})</span>
                      </h4>
                      <p className="text-[12px] text-[#5d6570]">{g.sub}</p>
                    </div>
                    <div className="divide-y divide-[#f0f1f3] rounded-xl border border-[#e3e6ea]">
                      {items.map((s) => (
                        <PairRow key={s.b} s={s} d={decisions[s.b]} aNames={aNames} counts={{ a: counts.a, b: counts.b.get(s.b) }} onSet={(a) => set(s.b, a)} />
                      ))}
                    </div>
                  </section>
                );
              })}

              {onlyA.length > 0 && (
                <section>
                  <h4 className="text-[14px] font-bold text-[#1c2126]">
                    Only in the loss run <span className="font-semibold text-[#8b929b]">({onlyA.length})</span>
                  </h4>
                  <p className="text-[12px] text-[#5d6570]">No safety report rows for these. Their claims stay in the dashboard as they are.</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#3c434c]">{onlyA.map((a) => `${a} (${num(counts.a.get(a) ?? 0)} claims)`).join(" · ")}</p>
                </section>
              )}

              {conflicts.length > 0 && (
                <section>
                  <h4 className="text-[14px] font-bold text-[#1c2126]">Hours that don't agree</h4>
                  <p className="text-[12px] text-[#5d6570]">Rows for the same location and year list different hours. Until you pick, that year gets no rate for that location.</p>
                  <div className="mt-2 divide-y divide-[#f0f1f3] rounded-xl border border-[#e3e6ea]">
                    {conflicts.map((c, i) => (
                      <div key={`${c.location}|${c.year}`} className="flex flex-wrap items-center gap-3 px-3 py-2 text-[12.5px]">
                        <span className="font-semibold text-[#1c2126]">{c.location || "Company-wide"}, {c.year}</span>
                        <span className="text-[#5d6570]">{c.values.map((v) => num(v)).join(" vs ")} hours</span>
                        <select className={`${field} ml-auto`} value={c.pick} onChange={(e) => setConflicts(conflicts.map((x, j) => (j === i ? { ...x, pick: e.target.value as HoursConflict["pick"] } : x)))}>
                          <option value="skip">Leave out (no rate)</option>
                          <option value="max">Use the largest</option>
                          <option value="sum">Add them up</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <p className="text-[11.5px] leading-relaxed text-[#6c737d]">
                How matching works: names are compared after setting aside case, punctuation, common abbreviations (Street and St, Center and Ctr) and filler words like "Store". A shared store or site number counts strongly; different numbers or directions (East vs West) are never suggested. Scores run 0 to 100: {th.match.high}+ and a clear best is pre-checked, {th.match.medium}+ is suggested. You can change these under Risk levels.
              </p>

              <Footer onCancel={() => onOpenChange(false)}>
                {!existing && (
                  <button type="button" onClick={() => setStep("columns")} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#5d6570] hover:text-[#1c2126]" disabled={!tables.length}>
                    Back
                  </button>
                )}
                <button type="button" disabled={!!pending.length} onClick={combine} className="rounded-lg bg-[color:var(--brand-deep)] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40" title={pending.length ? `${pending.length} still need a decision` : undefined}>
                  {pending.length ? `Combine reports (${pending.length} to review)` : "Combine reports"}
                </button>
              </Footer>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PairRow({ s, d, aNames, counts, onSet }: { s: Suggestion; d: Decision | undefined; aNames: string[]; counts: { a: Map<string, number>; b?: { cases: number; rec: number } }; onSet: (a: string | null) => void }) {
  const chosen = d?.a ?? null;
  const decided = !!d?.decided;
  const offered = s.options.map((o) => o.a);
  const rest = aNames.filter((a) => !offered.includes(a));
  const isSuggested = chosen != null && chosen === s.a;
  return (
    <div className={`px-3 py-3 ${!decided ? "bg-[#fffbf3]" : ""}`}>
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_20px_minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#8b929b]">Safety report</div>
          <div className="truncate text-[13.5px] font-semibold text-[#1c2126]" title={s.b}>{s.b}</div>
          <div className="text-[11.5px] text-[#6c737d]">{counts.b ? `${num(counts.b.cases)} rows · ${num(counts.b.rec)} recordable` : "Hours only"}</div>
        </div>
        <ArrowRight className="hidden h-4 w-4 text-[#b7bcc4] md:block" />
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#8b929b]">Loss run</div>
          <select aria-label={`Loss run location for ${s.b}`} className={`${field} w-full font-semibold`} value={chosen ?? ""} onChange={(e) => onSet(e.target.value || null)}>
            <option value="">No match (keep separate)</option>
            {s.options.length > 0 && (
              <optgroup label="Closest">
                {s.options.map((o) => (
                  <option key={o.a} value={o.a}>
                    {o.a} · score {o.score}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="All loss run locations">
              {rest.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </optgroup>
          </select>
          <div className="mt-0.5 text-[11.5px] text-[#6c737d]">{chosen ? `${num(counts.a.get(chosen) ?? 0)} claims` : "Stays as its own location"}</div>
        </div>
        <div className="flex items-center gap-2 md:justify-end">
          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${TIER[s.tier].cls}`}>{TIER[s.tier].label}{s.tier !== "low" ? ` · ${s.score}` : ""}</span>
          {s.tier === "medium" && s.a && (
            <div className="flex overflow-hidden rounded-md ring-1 ring-[#d8dce1]">
              <button type="button" onClick={() => onSet(s.a)} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold ${decided && isSuggested ? "bg-[#18794e] text-white" : "bg-white text-[#1c2126] hover:bg-[#f5f6f8]"}`}>
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button type="button" onClick={() => onSet(null)} className={`inline-flex items-center gap-1 border-l border-[#d8dce1] px-2.5 py-1 text-[12px] font-semibold ${decided && chosen == null ? "bg-[#5d6570] text-white" : "bg-white text-[#1c2126] hover:bg-[#f5f6f8]"}`}>
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
          {s.tier === "high" && (
            <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1c2126]">
              <input type="checkbox" checked={isSuggested} onChange={(e) => onSet(e.target.checked ? s.a : null)} className="h-4 w-4 accent-[color:var(--brand-deep)]" />
              Matched
            </label>
          )}
        </div>
      </div>
      {(s.reasons.length > 0 || s.notes.length > 0) && (
        <div className="mt-1.5 space-y-0.5 text-[11.5px] leading-snug">
          {s.reasons.length > 0 && <div className="text-[#3c434c]">Why: {s.reasons.join(" · ")}</div>}
          {s.notes.map((n) => (
            <div key={n} className="flex items-start gap-1 text-[#9a5b00]">
              <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0" /> {n}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function samples(table: Table, headerRow: number, col: number) {
  const out: string[] = [];
  for (let r = headerRow + 1; r < table.rows.length && out.length < 3; r++) {
    const v = table.rows[r]?.[col];
    if (v === "" || v == null) continue;
    out.push(String(v).slice(0, 28));
  }
  return out.join(" · ");
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "warn" | "ok" }) {
  return (
    <div className="min-w-[130px]">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#5d6570]">{label}</div>
      <div className={`text-[20px] font-extrabold tabular-nums ${tone === "warn" ? "text-[#9a5b00]" : tone === "ok" ? "text-[#18794e]" : "text-[#1c2126]"}`}>
        {tone === "ok" && <CheckCircle2 className="mr-1 inline h-4 w-4 align-[-2px]" />}
        {value}
      </div>
      <div className="max-w-[220px] truncate text-[11.5px] text-[#6c737d]" title={sub}>{sub}</div>
    </div>
  );
}

function ErrorBox({ text, warn }: { text: string; warn?: boolean }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] ${warn ? "bg-[#f8edd9] text-[#9a5b00]" : "bg-[#fbe3e1] text-[#b42318]"}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {text}
    </div>
  );
}

function Footer({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-[#e3e6ea] bg-white px-5 py-3 sm:-mx-6 sm:px-6">
      <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-[#5d6570] hover:text-[#1c2126]">
        Cancel
      </button>
      {children}
    </div>
  );
}

