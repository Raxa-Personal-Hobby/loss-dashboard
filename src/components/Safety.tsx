import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronsUpDown, Circle, Search, Upload } from "lucide-react";
import type { HoursRow } from "@/lib/types";
import type { Industry } from "@/lib/industries";
import type { Thresholds } from "@/lib/thresholds";
import type { Kpi } from "@/lib/metrics";
import { num, pct } from "@/lib/metrics";
import { benchmarkLabel, type BenchChoice, type Benchmark } from "@/lib/bls";
import { SOII_NEXT, SOII_URL, SOII_YEAR, getNaics, type Ownership } from "@/lib/naics";
import { findIndustries } from "@/lib/naics-titles";
import { BASE_HOURS, fmtRate, rateBand, rateOf, type SafetyLocation, type SafetyYear } from "@/lib/safety";
import { ACCEPT, hoursFromTables, readFile } from "@/lib/parse";
import { BandPill } from "./bands";
import { ChartCard } from "./kit";
import { KpiTile } from "./sections";
import { RateBars, StackedBars, fmtCount } from "./charts";

const OWNERSHIP: { value: Ownership; label: string }[] = [
  { value: "private", label: "Private company" },
  { value: "state", label: "State government" },
  { value: "local", label: "Local government" },
];

const field = "rounded-md border border-[#d8dce1] bg-white px-2 py-1.5 text-[13px] text-[#1c2126] outline-none focus:border-[color:var(--brand)]";

/* Pick what the safety rates are compared against: a NAICS code (BLS) or the user's own numbers. */
export function BenchmarkBox({ ind, choice, setChoice, bench }: { ind: Industry; choice: BenchChoice; setChoice: (c: BenchChoice) => void; bench: Benchmark }) {
  const shown = (code: string) => (code === "private" ? "" : code);
  const [q, setQ] = useState(shown(choice.naics));
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => (q.trim() && !/^\d{6}$/.test(q.trim()) ? findIndustries(q, choice.ownership, 8) : []), [q, choice.ownership]);
  // Keep the box in step when the code changes from outside (an hours sheet with a NAICS column, a chip).
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setQ(shown(choice.naics));
  }, [choice.naics]);
  const pickCode = (code: string) => {
    setQ(code);
    setOpen(false);
    setChoice({ ...choice, naics: code, custom: false });
  };
  return (
    <div className="rounded-[14px] border border-[#e3e6ea] bg-white p-4 sm:p-5" data-export-ignore>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#1c2126]">Compare against</h3>
          <p className="mt-0.5 text-[12.5px] text-[#5d6570]">
            Type your NAICS code or a few words like "roofing". Rates come from BLS {SOII_YEAR} for that industry. Not sure of your code? It's on your OSHA 300A or your tax return.
          </p>
        </div>
        <div className="flex rounded-lg bg-[#f1f3f5] p-0.5 text-[12.5px] font-semibold">
          {[
            { v: false, label: "BLS industry" },
            { v: true, label: "My own numbers" },
          ].map((o) => (
            <button key={String(o.v)} type="button" onClick={() => setChoice({ ...choice, custom: o.v })} className={`rounded-md px-3 py-1.5 ${choice.custom === o.v ? "bg-white text-[#1c2126] shadow-sm" : "text-[#5d6570]"}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {!choice.custom ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b929b]" />
                <input
                  ref={inputRef}
                  className={`${field} w-full pl-8`}
                  value={q}
                  placeholder="NAICS code, like 722511"
                  aria-label="NAICS code or industry words"
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 150)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQ(v);
                    setOpen(true);
                    if (/^\d{2,6}$|^(31-33|44-45|48-49)$/.test(v.trim())) setChoice({ ...choice, naics: v.trim(), custom: false });
                  }}
                />
              </label>
              <select className={field} value={choice.ownership} aria-label="Ownership" onChange={(e) => setChoice({ ...choice, ownership: e.target.value as Ownership })}>
                {OWNERSHIP.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {open && hits.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[#e3e6ea] bg-white py-1 shadow-[0_12px_32px_-12px_rgba(20,24,28,0.35)]">
                {hits.map((h) => (
                  <button key={h.code} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickCode(h.code)} className="flex w-full items-baseline gap-3 px-3 py-1.5 text-left text-[13px] hover:bg-[#f5f6f8]">
                    <span className="w-14 shrink-0 font-mono text-[12px] text-[#5d6570]">{h.code}</span>
                    <span className="min-w-0 flex-1 truncate text-[#1c2126]">{h.title}</span>
                    {h.bls && <span className="shrink-0 tabular-nums text-[12px] text-[#5d6570]" title={h.bls.note || undefined}>TRIR {h.bls.rate.trc.toFixed(1)}{h.bls.exact ? "" : "*"}</span>}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ind.bls.options.map((code) => {
                const r = code === "private" ? null : getNaics(code);
                const label = r ? `${code} ${r.name}` : "All private industry";
                const on = choice.naics === code && !choice.custom && choice.ownership === "private";
                return (
                  <button key={code} type="button" onClick={() => { setChoice({ ...choice, naics: code, ownership: "private", custom: false }); setQ(shown(code)); }} className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${on ? "text-white ring-transparent" : "bg-white text-[#3c434c] ring-[#e3e6ea] hover:ring-[#cdd1d7]"}`} style={on ? { background: "var(--brand-deep)" } : undefined}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <BenchFacts bench={bench} />
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-[#1c2126]">Name for this target</span>
            <input className={`${field} mt-1 w-full`} value={choice.label} placeholder="Carrier goal, company goal, last year..." onChange={(e) => setChoice({ ...choice, label: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-[#1c2126]">TRIR target</span>
            <input className={`${field} mt-1 w-full`} type="number" min={0} step={0.1} value={choice.trc ?? ""} placeholder="2.0" onChange={(e) => setChoice({ ...choice, trc: e.target.value === "" ? null : Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-[#1c2126]">DART target (optional)</span>
            <input className={`${field} mt-1 w-full`} type="number" min={0} step={0.1} value={choice.dart ?? ""} placeholder="1.0" onChange={(e) => setChoice({ ...choice, dart: e.target.value === "" ? null : Number(e.target.value) })} />
          </label>
          {!(choice.trc != null && choice.trc > 0) && <p className="text-[12px] text-[#9a5b00] sm:col-span-3">Enter a TRIR target. Until then the BLS rate for NAICS {choice.naics || ind.bls.default} is used.</p>}
        </div>
      )}
    </div>
  );
}

function BenchFacts({ bench }: { bench: Benchmark }) {
  const cell = (label: string, v: number | null) => (
    <div className="min-w-[64px]">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5d6570]">{label}</div>
      <div className="text-[18px] font-extrabold tabular-nums text-[#1c2126]">{v == null ? "–" : v.toFixed(1)}</div>
    </div>
  );
  return (
    <div className="rounded-lg bg-[#f7f8f9] px-3.5 py-3 md:w-[300px]">
      <div className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-[#1c2126]" title={benchmarkLabel(bench)}>
        {benchmarkLabel(bench)}
      </div>
      <div className="mt-1.5 flex gap-4">
        {cell("TRIR", bench.trc)}
        {cell("DART", bench.dart)}
        {cell("Days away", bench.dafw)}
      </div>
      <div className="mt-1.5 text-[11px] leading-snug text-[#6c737d]">
        {bench.note || (bench.kind === "custom" ? "Your numbers, per 100 full-time workers." : <>Cases per 100 full-time workers, BLS {SOII_YEAR}. <a className="underline" href={SOII_URL} target="_blank" rel="noreferrer">Source</a></>)}
      </div>
    </div>
  );
}

/* Type company-wide hours by year, or upload a sheet with hours by location. */
export function HoursEditor({ years, hours, source, onSave }: { years: number[]; hours: HoursRow[] | undefined; source?: string; onSave: (rows: HoursRow[], source: string, naics?: string) => void }) {
  const company = (y: number) => hours?.filter((h) => h.year === y && !h.location).reduce((s, h) => s + h.hours, 0) || 0;
  const byLoc = hours?.some((h) => h.location);
  const [mode, setMode] = useState<"hours" | "employees">("hours");
  const [draft, setDraft] = useState<Record<number, string>>(() => Object.fromEntries(years.map((y) => [y, company(y) ? String(company(y)) : ""])));
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const save = () => {
    const rows: HoursRow[] = [];
    for (const y of years) {
      const v = Number(String(draft[y] ?? "").replace(/[, ]/g, ""));
      if (v > 0) rows.push({ location: "", year: y, hours: mode === "employees" ? v * 2000 : v, estimated: mode === "employees" });
    }
    const keep = (hours ?? []).filter((h) => h.location || !years.includes(h.year));
    onSave([...keep, ...rows], keep.length ? `${source ?? "Uploaded"} + typed in` : "Typed in");
  };
  const upload = async (f: File) => {
    setErr("");
    try {
      const t = await readFile(f);
      const r = hoursFromTables(t);
      if (!r) throw new Error("Couldn't find hours in that file. It needs a Year column plus Hours Worked or Average Employees.");
      onSave(r.hours, `${f.name} › ${r.sheet}`, r.naics || undefined);
    } catch (e: any) {
      setErr(e?.message || "Could not read that file.");
    }
  };
  return (
    <div className="rounded-[14px] border border-[#e3e6ea] bg-white p-4 sm:p-5" data-export-ignore>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-[#1c2126]">Hours worked</h3>
          <p className="mt-0.5 text-[12.5px] text-[#5d6570]">
            Rates need hours. Use line 19a "Total hours worked by all employees" from each year's OSHA 300A, or average employees (counted as 2,000 hours each).{byLoc ? " Hours by location are loaded from your file; typing a company total here is optional." : ""}
          </p>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-[#d8dce1] hover:ring-[#b7bcc4]">
          <Upload className="h-3.5 w-3.5" /> Upload hours by location
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select className={field} value={mode} onChange={(e) => setMode(e.target.value as "hours" | "employees")} aria-label="What you're entering">
          <option value="hours">Total hours worked</option>
          <option value="employees">Average employees</option>
        </select>
        {years.map((y) => (
          <label key={y} className="block w-[120px]">
            <span className="text-[11.5px] font-semibold text-[#5d6570]">{y}</span>
            <input className={`${field} mt-0.5 w-full tabular-nums`} inputMode="numeric" value={draft[y] ?? ""} placeholder={mode === "hours" ? "210,000" : "105"} onChange={(e) => setDraft({ ...draft, [y]: e.target.value })} />
          </label>
        ))}
        <button type="button" onClick={save} className="h-[34px] rounded-lg px-3.5 text-[13px] font-bold text-white" style={{ background: "var(--brand-deep)" }}>
          Use these
        </button>
      </div>
      {source && <p className="mt-2 text-[11.5px] text-[#6c737d]">Hours now from: {source}</p>}
      {err && <p className="mt-2 text-[12px] text-[#b42318]">{err}</p>}
    </div>
  );
}

/* What each optional input unlocks. Shown until the data has both OSHA detail and hours. */
function Unlock({ osha, caseTypes, days, hasHours }: { osha: boolean; caseTypes: boolean; days: boolean; hasHours: boolean }) {
  const rows = [
    { done: osha, add: "OSHA Recordable column (Yes or No)", get: "Recordable cases by year" },
    { done: caseTypes, add: "OSHA Case Type column (Days away, Job transfer or restriction, Other)", get: "DART rate and the case mix" },
    { done: days, add: "Days away and days restricted columns (OSHA 300 columns K and L)", get: "Lost days and the severity rate" },
    { done: hasHours, add: "Hours worked by year, typed below or as a sheet in your file", get: "TRIR, DART and days-away rate next to the BLS average" },
  ];
  return (
    <div className="rounded-[14px] border border-[#e3e6ea] bg-white p-4 sm:p-5">
      <h3 className="text-[15px] font-bold text-[#1c2126]">Add more, see more</h3>
      <p className="mt-0.5 text-[12.5px] text-[#5d6570]">All optional. Each one you add turns on more of this section. The blank template already has these columns.</p>
      <table className="mt-3 w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11.5px] font-semibold text-[#5d6570]">
            <th className="w-7 pb-1.5" />
            <th className="pb-1.5">Add this</th>
            <th className="pb-1.5">You get</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.add} className="border-t border-[#f0f1f3] align-top">
              <td className="py-2">{r.done ? <CheckCircle2 className="h-4 w-4 text-[#18794e]" aria-label="Have it" /> : <Circle className="h-4 w-4 text-[#b7bcc4]" aria-label="Not yet" />}</td>
              <td className="py-2 pr-3 text-[#1c2126]">{r.add}</td>
              <td className="py-2 text-[#3c434c]">{r.get}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LocationRates({ rows, ind, bench, onPick }: { rows: SafetyLocation[]; ind: Industry; bench: Benchmark; onPick: (loc: string) => void }) {
  const [sort, setSort] = useState<{ k: keyof SafetyLocation; dir: 1 | -1 }>({ k: "trir", dir: -1 });
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const x = a[sort.k];
    const y = b[sort.k];
    return (typeof x === "string" ? x.localeCompare(String(y), undefined, { numeric: true }) : (x as number) - (y as number)) * sort.dir;
  }), [rows, sort]);
  const shown = all ? sorted : sorted.slice(0, 12);
  const head = (k: keyof SafetyLocation, children: string, right?: boolean) => (
    <th key={k} className={`whitespace-nowrap border-b border-[#e3e6ea] px-3 py-2.5 font-semibold text-[#5d6570] ${right ? "text-right" : "text-left"}`}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-[#1c2126]" onClick={() => setSort({ k, dir: sort.k === k ? (-sort.dir as 1 | -1) : k === "location" ? 1 : -1 })}>
        {children}
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </button>
    </th>
  );
  return (
    <ChartCard
      title={`Safety rates by ${ind.unit.one}`}
      subtitle={`All years in view combined. Level compares each ${ind.unit.one}'s TRIR with ${bench.kind === "custom" ? "your target" : "the BLS average"} (${bench.trc.toFixed(1)}). Tap a row to filter.`}
      file="safety-by-location"
      table={{ cols: [{ key: "location", label: ind.unit.One }, { key: "recordable", label: "Recordables", align: "right" }, { key: "hours", label: "Hours", align: "right", fmt: num }, { key: "trir", label: "TRIR", align: "right", fmt: fmtRate }, { key: "dartRate", label: "DART", align: "right", fmt: fmtRate }], rows: sorted }}
    >
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr>
              {head("location", ind.unit.One)}
              {head("recordable", "Recordables", true)}
              {head("hours", "Hours", true)}
              {head("trir", "TRIR", true)}
              {head("dartRate", "DART", true)}
              <th className="border-b border-[#e3e6ea] px-3 py-2.5 text-left font-semibold text-[#5d6570]">Level</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.location} className="cursor-pointer border-b border-[#f0f1f3] hover:bg-[#f7f8f9]" onClick={() => onPick(r.location)}>
                <td className="px-3 py-2 font-semibold text-[#1c2126]">{r.location}</td>
                <td className="px-3 py-2 text-right tabular-nums">{num(r.recordable)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-[#5d6570]">{num(Math.round(r.hours))}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmtRate(r.trir)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtRate(r.dartRate)}</td>
                <td className="px-3 py-2">{r.recordable > 0 || r.trir > 0 ? <BandPill band={r.band} size="xs" /> : <span className="text-[12px] text-[#8b929b]">No cases</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 && (
        <button type="button" className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--brand-deep)" }} onClick={() => setAll(!all)} data-export-ignore>
          {all ? "Show top 12" : `Show all ${rows.length}`}
        </button>
      )}
    </ChartCard>
  );
}

export interface SafetyProps {
  ind: Industry;
  th: Thresholds;
  color: string;
  series: string[];
  bench: Benchmark;
  choice: BenchChoice;
  setChoice: (c: BenchChoice) => void;
  osha: boolean;
  caseTypes: boolean;
  days: boolean;
  rows: SafetyYear[];
  wcByYear: { year: number; label: string; partial: boolean; claims: number; hours: number | null }[];
  locRows: SafetyLocation[];
  hours: HoursRow[] | undefined;
  hoursSource?: string;
  years: number[];
  scoped: boolean;
  onHours: (rows: HoursRow[], source: string, naics?: string) => void;
  onPick: (loc: string) => void;
}

export function SafetySection(p: SafetyProps) {
  const { bench, rows, ind } = p;
  const withHours = rows.filter((r) => r.hours != null);
  const hasHours = withHours.length > 0;
  const last = withHours[withHours.length - 1] ?? rows[rows.length - 1];
  const benchShort = bench.kind === "custom" ? "target" : "BLS";
  const vsText = (rate: number | null, b: number | null) => (rate == null || b == null || !(b > 0) ? "" : `${pct(rate / b - 1)} vs ${benchShort} ${b.toFixed(1)}`);
  const dir = (rate: number | null, b: number | null): Kpi["deltaDir"] => (rate == null || b == null ? "none" : rate > b * 1.02 ? "up" : rate < b * 0.98 ? "down" : "flat");
  const hrsText = last?.hours ? `${num(Math.round(last.hours))} hrs${last.estimated ? " (est.)" : ""}` : "";

  const kpis: Kpi[] = (() => {
    if (!last) return [];
    if (p.osha && hasHours) {
      return [
        { key: "trir", label: "TRIR", value: fmtRate(last.trir), sub: `${last.label} · ${num(last.recordable)} recordables · ${hrsText}`, delta: vsText(last.trir, bench.trc), deltaDir: dir(last.trir, bench.trc), band: rateBand(last.trir, bench.trc, p.th), bandNote: "TRIR divided by the benchmark. 1.0 is right at the average." },
        { key: "dart", label: "DART rate", value: p.caseTypes ? fmtRate(last.dart) : "–", sub: p.caseTypes ? `${num(last.dafw + last.djtr)} days-away or restricted cases` : "Needs an OSHA case type column", delta: p.caseTypes ? vsText(last.dart, bench.dart) : "", deltaDir: p.caseTypes ? dir(last.dart, bench.dart) : "none", band: p.caseTypes ? rateBand(last.dart, bench.dart ?? 0, p.th) : null, bandNote: "" },
        { key: "dafw", label: "Days-away rate", value: p.caseTypes ? fmtRate(last.dafwRate) : "–", sub: p.caseTypes ? `${num(last.dafw)} days-away cases` : "Needs an OSHA case type column", delta: p.caseTypes ? vsText(last.dafwRate, bench.dafw) : "", deltaDir: p.caseTypes ? dir(last.dafwRate, bench.dafw) : "none", band: p.caseTypes ? rateBand(last.dafwRate, bench.dafw ?? 0, p.th) : null, bandNote: "" },
        { key: "sev", label: "Severity rate", value: p.days ? fmtRate(last.severity) : "–", sub: p.days ? `${num(last.daysAway)} days away · ${num(last.daysRestricted)} restricted` : "Needs a days away column", delta: p.days ? "Days away per 200,000 hours" : "", deltaDir: "none", band: null, bandNote: "" },
      ];
    }
    if (p.osha) {
      return [
        { key: "rec", label: "Recordable cases", value: num(last.recordable), sub: last.label, delta: "Add hours to get TRIR", deltaDir: "none", band: null, bandNote: "" },
        { key: "dart", label: "DART cases", value: p.caseTypes ? num(last.dafw + last.djtr) : "–", sub: p.caseTypes ? `${num(last.dafw)} days away · ${num(last.djtr)} restricted` : "Needs an OSHA case type column", delta: "", deltaDir: "none", band: null, bandNote: "" },
        { key: "days", label: "Days away", value: p.days ? num(last.daysAway) : "–", sub: p.days ? last.label : "Needs a days away column", delta: "", deltaDir: "none", band: null, bandNote: "" },
        { key: "rdays", label: "Days restricted", value: p.days ? num(last.daysRestricted) : "–", sub: p.days ? last.label : "Needs a days restricted column", delta: "", deltaDir: "none", band: null, bandNote: "" },
      ];
    }
    return [];
  })();

  const rateData = (k: "trir" | "dart") => rows.map((r) => ({ label: r.label, rate: r[k], partial: r.partial, cases: k === "trir" ? r.recordable : r.dafw + r.djtr }));
  const caseKeys = ["dafw", "djtr", "other", "typeUnknown"].filter((k) => rows.some((r) => (r as any)[k] > 0));
  const caseNames: Record<string, string> = { dafw: "Days away", djtr: "Job transfer or restriction", other: "Other recordable", typeUnknown: "Type not given" };
  const proxy = p.wcByYear.map((w) => ({ label: w.label, rate: rateOf(w.claims, w.hours), partial: w.partial, cases: w.claims }));
  const benchLabel = bench.kind === "custom" ? "Target" : "BLS";

  return (
    <div className="space-y-4">
      <BenchmarkBox ind={ind} choice={p.choice} setChoice={p.setChoice} bench={bench} />

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((x) => (
            <KpiTile key={x.key} k={x} />
          ))}
        </div>
      )}

      {p.osha && hasHours && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="TRIR by loss year"
            subtitle={`Recordable cases per 200,000 hours. Dashed line: ${benchmarkLabel(bench)}.`}
            file="trir-by-year"
            table={{ cols: [{ key: "label", label: "Year" }, { key: "recordable", label: "Recordables", align: "right" }, { key: "hours", label: "Hours", align: "right", fmt: (v) => (v == null ? "–" : num(Math.round(v))) }, { key: "trir", label: "TRIR", align: "right", fmt: fmtRate }], rows }}
            note={withHours.some((r) => r.estimated) ? "Some hours are estimated from average employees x 2,000." : undefined}
          >
            <RateBars data={rateData("trir")} color={p.color} bench={bench.trc} benchLabel={benchLabel} name="TRIR" />
          </ChartCard>
          {p.caseTypes ? (
            <ChartCard
              title="DART rate by loss year"
              subtitle="Cases with days away, restricted duty or a job transfer, per 200,000 hours."
              file="dart-by-year"
              table={{ cols: [{ key: "label", label: "Year" }, { key: "dafw", label: "Days away", align: "right" }, { key: "djtr", label: "Restricted", align: "right" }, { key: "dart", label: "DART", align: "right", fmt: fmtRate }], rows }}
            >
              <RateBars data={rateData("dart")} color={p.color} bench={bench.dart} benchLabel={benchLabel} name="DART" />
            </ChartCard>
          ) : (
            <Unlock osha={p.osha} caseTypes={p.caseTypes} days={p.days} hasHours={hasHours} />
          )}
        </div>
      )}

      {p.osha && (p.caseTypes || p.days) && (
        <div className="grid gap-4 md:grid-cols-2">
          {p.caseTypes && (
            <ChartCard
              title="Recordable cases by type"
              subtitle="How serious the recordables were, by loss year. Matches the OSHA 300 log columns H, I and J."
              file="osha-case-types"
              table={{ cols: [{ key: "label", label: "Year" }, ...caseKeys.map((k) => ({ key: k, label: caseNames[k], align: "right" as const }))], rows }}
            >
              <StackedBars rows={rows} keys={caseKeys} names={caseKeys.map((k) => caseNames[k])} colors={caseKeys.map((_, i) => p.series[i])} fmt={fmtCount} h={250} />
            </ChartCard>
          )}
          {p.days && (
            <ChartCard
              title="Days lost by loss year"
              subtitle="Days away from work and days on restricted duty or transfer. OSHA caps each case at 180 days."
              file="osha-days"
              table={{ cols: [{ key: "label", label: "Year" }, { key: "daysAway", label: "Days away", align: "right", fmt: num }, { key: "daysRestricted", label: "Days restricted", align: "right", fmt: num }], rows }}
              note="Recent years keep adding days while cases stay open."
            >
              <StackedBars rows={rows} keys={["daysAway", "daysRestricted"]} names={["Days away", "Days restricted"]} colors={[p.series[0], p.series[1]]} fmt={fmtCount} h={250} />
            </ChartCard>
          )}
        </div>
      )}

      {!p.osha && hasHours && proxy.some((x) => x.rate != null) && (
        <ChartCard
          title="Comp claims per 200,000 hours"
          subtitle="A stand-in until the loss run has an OSHA Recordable column. Not the same as TRIR, so it isn't compared with BLS."
          file="comp-claim-rate"
          table={{ cols: [{ key: "label", label: "Year" }, { key: "cases", label: "Comp claims", align: "right" }, { key: "rate", label: "Per 200k hrs", align: "right", fmt: fmtRate }], rows: proxy }}
          note="Not every comp claim is OSHA recordable, and some recordable injuries never become claims."
        >
          <RateBars data={proxy} color={p.color} bench={null} benchLabel="" name="Comp claims per 200k hrs" />
        </ChartCard>
      )}

      {p.osha && hasHours && p.locRows.length > 0 && <LocationRates rows={p.locRows} ind={ind} bench={bench} onPick={p.onPick} />}

      {(!p.osha || !hasHours || (!p.caseTypes && !hasHours)) && <Unlock osha={p.osha} caseTypes={p.caseTypes} days={p.days} hasHours={hasHours} />}

      <HoursEditor key={p.years.join() + (p.hoursSource ?? "")} years={p.years} hours={p.hours} source={p.hoursSource} onSave={p.onHours} />

      <p className="text-[11.5px] leading-relaxed text-[#6c737d]">
        Rate = cases x {num(BASE_HOURS)} / hours worked, the same formula OSHA and BLS use ({num(BASE_HOURS)} hours is 100 people working full time for a year). Safety rates use the {ind.unit.one}, region and year filters; cause and coverage filters don't apply.
        {p.scoped ? " Hours follow the locations you picked." : ""} BLS rates are national averages for all employer sizes. {SOII_NEXT}
      </p>
    </div>
  );
}
