import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Toaster, toast } from "sonner";
import { Download, FileUp, Gauge, Info, Lock, Palette, X } from "lucide-react";
import { DEFAULT_THRESHOLDS, isDefault, mergeThresholds, type Thresholds } from "@/lib/thresholds";
import { ThresholdsDialog } from "@/components/ThresholdsDialog";
import type { Brand, Dataset, Filters, HoursRow } from "@/lib/types";
import { EMPTY_FILTERS } from "@/lib/types";
import { SAMPLE_COMPANIES, coverageLabel, getIndustry, type Industry } from "@/lib/industries";
import { autoMap, fieldsFor } from "@/lib/fields";
import { buildClaims, detectHeaderRow, hoursFromTables } from "@/lib/parse";
import { makeSampleHours, makeSampleTable, SAMPLE_VALUATION } from "@/lib/sample";
import { defaultChoice, resolveBenchmark, type BenchChoice } from "@/lib/bls";
import { hasCaseTypes, hasDays, hasOsha, hoursFor, safetyConcerns, safetyLocations, safetyScope, safetyYears, scopeLocations } from "@/lib/safety";
import { SafetySection } from "@/components/Safety";
import { StartScreen, naicsChipLabel, type StartPick } from "@/components/StartScreen";
import { fmtDay } from "@/lib/normalize";
import {
  applyDims,
  applyYears,
  byYear,
  categoryCompare,
  concerns as findConcerns,
  coverageByYear,
  coverageColor,
  dayOfWeek,
  detailRows,
  filterSummary,
  heatGrid,
  kpis as buildKpis,
  lagDistribution,
  locationRows,
  money,
  monthly,
  num,
  pct,
  severityByCategory,
  topClaims,
  topCounts,
  yearsIn,
} from "@/lib/metrics";
import { buildTheme, deepen, ordinalRamp, readableOn, tint } from "@/lib/color";
import { buildPptx, filteredClaimsXlsx } from "@/lib/exporters";
import { OFFLINE, capability, inClaude, saveFile } from "@/lib/claude";
import { FilterBar, type FilterOptions } from "@/components/FilterBar";
import { ChartCard, SectionHead, Seg, announceSave, savePng } from "@/components/kit";
import { ColumnBars, CompareBars, MonthlyLines, RankBars, StackedBars, YearBars, fmtCount, fmtMoney } from "@/components/charts";
import { BandKey, Findings, HeatGrid, KpiTile, LargeLosses, WatchList } from "@/components/sections";
import { DataDialog } from "@/components/DataDialog";
import { BrandDialog } from "@/components/BrandDialog";
import { ExportDialog } from "@/components/ExportDialog";

const BRAND_KEY = "loss-dashboard.brand.v2";
const TH_KEY = "loss-dashboard.thresholds.v1";
const BENCH_KEY = (id: string) => `loss-dashboard.benchmark.v1.${id}`;
function loadChoice(ind: Industry): BenchChoice {
  try {
    const s = localStorage.getItem(BENCH_KEY(ind.id));
    if (s) return { ...defaultChoice(ind.bls.default), ...JSON.parse(s) };
  } catch {
    /* storage unavailable */
  }
  return defaultChoice(ind.bls.default);
}
const DEFAULT_BRAND: Brand = { companyName: "", website: "", primary: "#0f5e73", accent: "#d0822f", logo: null };
// The start screen saves which template the user picked. A build can still preset one with window.LOSS_INDUSTRY.
const START_KEY = "loss-dashboard.start.v1";
const PRESET = (window as any).LOSS_INDUSTRY as string | undefined;
function loadStart(): { industry: string } | null {
  try {
    return JSON.parse(localStorage.getItem(START_KEY) || "null");
  } catch {
    return null;
  }
}
const SAVED_START = loadStart();
const START_INDUSTRY = getIndustry(SAVED_START?.industry ?? PRESET ?? "general");

function loadBrand(): Brand {
  try {
    const s = localStorage.getItem(BRAND_KEY);
    if (s) return { ...DEFAULT_BRAND, ...JSON.parse(s) };
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_BRAND;
}

function sampleDataset(ind: Industry): Dataset {
  const t = makeSampleTable(ind);
  const F = fieldsFor(ind);
  const h = detectHeaderRow(t.rows, F);
  const mapping = autoMap(t.rows[h] ?? [], F);
  const r = buildClaims(t, h, mapping, ind.coverages[0].key, ind);
  const hw = hoursFromTables([makeSampleHours(ind)]);
  return { claims: r.claims, sourceName: t.name, isSample: true, valuationDay: SAMPLE_VALUATION, rowsRead: r.rowsRead, rowsSkipped: r.skipped, fieldsPresent: r.fieldsPresent, industry: ind.id, hours: hw?.hours, hoursSource: hw ? "Sample hours worked" : undefined };
}

function useMedia(q: string) {
  const [m, setM] = useState(() => (typeof window !== "undefined" ? window.matchMedia(q).matches : true));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "causes", label: "Causes" },
  { id: "locations", label: "Locations" },
  { id: "safety", label: "Safety" },
  { id: "findings", label: "Findings" },
  { id: "large-losses", label: "Large losses" },
];

const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "RL";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "company";

export default function App() {
  const [ind, setInd] = useState<Industry>(START_INDUSTRY);
  const [dataset, setDataset] = useState<Dataset>(() => sampleDataset(START_INDUSTRY));
  const [brand, setBrandState] = useState<Brand>(loadBrand);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [th, setThState] = useState<Thresholds>(() => {
    try {
      return mergeThresholds(JSON.parse(localStorage.getItem(TH_KEY) || "null"));
    } catch {
      return structuredClone(DEFAULT_THRESHOLDS);
    }
  });
  const setTh = (t: Thresholds) => {
    setThState(t);
    try {
      localStorage.setItem(TH_KEY, JSON.stringify(t));
    } catch {
      /* storage off */
    }
  };
  const [choice, setChoiceState] = useState<BenchChoice>(() => loadChoice(START_INDUSTRY));
  const [showStart, setShowStart] = useState(!SAVED_START && !PRESET);
  const [startDone, setStartDone] = useState(!!SAVED_START || !!PRESET);
  const setChoice = (c: BenchChoice, id = ind.id) => {
    setChoiceState(c);
    try {
      localStorage.setItem(BENCH_KEY(id), JSON.stringify(c));
    } catch {
      /* storage off */
    }
  };
  const bench = useMemo(() => resolveBenchmark(choice, ind.bls.default), [choice, ind]);
  const largeAt = th.largeLoss;
  const setLargeAt = (n: number) => setTh({ ...th, largeLoss: n });
  const [dlg, setDlg] = useState<null | "data" | "brand" | "export" | "levels">(null);
  const [trendMetric, setTrendMetric] = useState<"count" | "incurred">("count");
  const [cumulative, setCumulative] = useState(true);
  const [covMetric, setCovMetric] = useState<"count" | "incurred">("incurred");
  const [banner, setBanner] = useState(true);
  const [active, setActive] = useState("overview");
  const [local, setLocal] = useState(false);
  useEffect(() => {
    capability("downloads").then(() => setLocal(!inClaude()));
  }, []);
  const dashRef = useRef<HTMLDivElement>(null);
  const wide = useMedia("(min-width: 640px)");

  const setBrand = (b: Brand) => {
    setBrandState(b);
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(b));
    } catch {
      /* logo too large for storage, or storage off */
    }
  };

  const theme = useMemo(() => buildTheme(brand.primary, brand.accent), [brand.primary, brand.accent]);
  const V = dataset.valuationDay;
  const all = dataset.claims;
  const allYears = useMemo(() => yearsIn(all), [all]);
  const dims = useMemo(() => applyDims(all, filters), [all, filters]);
  const filtered = useMemo(() => applyYears(dims, filters), [dims, filters]);
  const years = useMemo(() => allYears.filter((y) => (filters.yearFrom == null || y >= filters.yearFrom) && (filters.yearTo == null || y <= filters.yearTo)), [allYears, filters.yearFrom, filters.yearTo]);

  const opts: FilterOptions = useMemo(() => {
    const count = (key: "location" | "category" | "region", f: Filters) => {
      const m = new Map<string, number>();
      applyYears(applyDims(all, f), f).forEach((c) => {
        const k = key === "region" ? c.region || c.state : c[key];
        if (k) m.set(k, (m.get(k) ?? 0) + 1);
      });
      return m;
    };
    const lm = count("location", { ...filters, locations: [] });
    const rm = count("region", { ...filters, regions: [] });
    const cm = count("category", { ...filters, categories: [] });
    const allLocs = [...new Set(all.map((c) => c.location))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const allRegs = [...new Set(all.map((c) => c.region || c.state).filter(Boolean))].sort();
    const allCats = [...new Set(all.map((c) => c.category))].sort((a, b) => (cm.get(b) ?? 0) - (cm.get(a) ?? 0));
    return {
      years: allYears,
      locations: allLocs.map((v) => ({ value: v, count: lm.get(v) ?? 0 })),
      regions: allRegs.map((v) => ({ value: v, count: rm.get(v) ?? 0 })),
      categories: allCats.map((v) => ({ value: v, count: cm.get(v) ?? 0 })),
      coverages: [...ind.coverages.map((c) => c.key), "Other"].filter((cv) => all.some((c) => c.coverage === cv)),
    };
  }, [all, filters, allYears, ind]);

  const k = useMemo(() => buildKpis(filtered, dims, V, th), [filtered, dims, V, th]);
  const yr = useMemo(() => byYear(filtered, years, V), [filtered, years, V]);
  const lineYears = years.slice(-4);
  const lineColors = ordinalRamp(theme.primary, lineYears.length);
  const vy = fmtDay(V, "iso").slice(0, 4);
  const lineLabels = lineYears.map((y) => (String(y) === vy ? `${y} YTD` : String(y)));
  const monthlyData = useMemo(() => monthly(filtered, lineYears, V, trendMetric, cumulative), [filtered, lineYears.join(), V, trendMetric, cumulative]);
  const cov = useMemo(() => coverageByYear(filtered, years, V, covMetric, ind), [filtered, years, V, covMetric, ind]);
  const dow = useMemo(() => dayOfWeek(filtered), [filtered]);
  const causes = useMemo(() => categoryCompare(dims, V, 10), [dims, V]);
  const severity = useMemo(() => severityByCategory(filtered, 8), [filtered]);
  const details = useMemo(() => ind.details.map((d) => ({ d, rows: detailRows(filtered, dims, V, d) })), [ind, filtered, dims, V]);
  const F = useMemo(() => fieldsFor(ind), [ind]);
  const fieldLabel = (k: string) => F.find((f) => f.key === k)?.label ?? k;
  const lag = useMemo(() => lagDistribution(filtered), [filtered]);
  const hasLag = lag.some((b) => b.count > 0);
  const locRows = useMemo(() => locationRows(filtered, dims, V, th), [filtered, dims, V, th]);
  const byLoc = useMemo(() => topCounts(filtered, "location", 15), [filtered]);
  const grid = useMemo(() => heatGrid(filtered, 12, 8), [filtered]);
  // Safety rates: location, region and year filters only.
  const sScope = useMemo(() => safetyScope(all, filters), [all, filters]);
  const sLocs = useMemo(() => scopeLocations(all, filters), [all, filters]);
  const osha = useMemo(() => hasOsha(all), [all]);
  const caseTypes = useMemo(() => hasCaseTypes(all), [all]);
  const oshaDays = useMemo(() => hasDays(all), [all]);
  const sYears = useMemo(() => safetyYears(sScope, years, dataset.hours, sLocs, V), [sScope, years, dataset.hours, sLocs, V]);
  const sLocRows = useMemo(() => (sLocs ? [] : safetyLocations(sScope, years, dataset.hours, bench, th)), [sScope, sLocs, years, dataset.hours, bench, th]);
  const wcByYear = useMemo(
    () => sYears.map((r) => ({ year: r.year, label: r.label, partial: r.partial, claims: sScope.filter((c) => c.lossYear === r.year && c.coverage === "WC").length, hours: hoursFor(dataset.hours, r.year, sLocs)?.hours ?? null })),
    [sYears, sScope, dataset.hours, sLocs],
  );
  const sFound = useMemo(() => (osha ? safetyConcerns(sYears, sLocRows, sScope, bench, ind, th) : []), [osha, sYears, sLocRows, sScope, bench, ind, th]);
  const found = useMemo(() => [...findConcerns(dims, V, locRows, ind, th), ...sFound].sort((a, b) => b.band - a.band || b.weight - a.weight), [dims, V, locRows, ind, th, sFound]);
  const largest = useMemo(() => topClaims(filtered, 10), [filtered]);
  const scope = filterSummary(filters, allYears) || "All claims";
  const named = brand.companyName.trim() && !SAMPLE_COMPANIES.has(brand.companyName.trim()) ? brand.companyName.trim() : "";
  const company = named || (dataset.isSample ? ind.sample.company : "Your company");
  const labelW = wide ? 168 : 112;

  const vars = {
    "--brand": brand.primary,
    "--brand-deep": deepen(brand.primary),
    "--brand-tint": tint(brand.primary, 0.9),
    "--accent": brand.accent,
    "--accent-ink": readableOn(brand.accent),
  } as CSSProperties;

  useEffect(() => {
    document.title = ind.id === "general" ? "Loss Dashboard" : `${ind.name.replace(/\b\w/g, (c) => c.toUpperCase())} Loss Dashboard`;
  }, [ind]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(vars as Record<string, string>).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [brand.primary, brand.accent]);

  // Highlight the section in view.
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const toTop = () => dashRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const applyData = (d: Dataset) => {
    setDataset(d);
    if (d.naics) {
      setChoice({ ...choice, naics: d.naics, custom: false });
      toast.message(`Benchmark set to NAICS ${d.naics} from your hours sheet`);
    }
    setFilters(EMPTY_FILTERS);
    setBanner(false);
    toast.success(`Loaded ${num(d.claims.length)} claims`, {
      description: `Valued ${fmtDay(d.valuationDay, "long")}${d.rowsSkipped ? ` · ${d.rowsSkipped} rows skipped` : ""}`,
      action: { label: "Brand it", onClick: () => setDlg("brand") },
    });
  };

  const switchIndustry = (id: string, override?: Partial<BenchChoice>) => {
    const next = getIndustry(id);
    setInd(next);
    if (override) setChoice({ ...loadChoice(next), ...override }, next.id);
    else setChoiceState(loadChoice(next));
    setFilters(EMPTY_FILTERS);
    if (dataset.isSample || !dataset.source) setDataset(sampleDataset(next));
    else {
      const src = dataset.source;
      const defCov = next.coverages.some((c) => c.key === src.defCov) ? src.defCov : "Other";
      const r = buildClaims(src.table, src.headerRow, src.mapping, defCov, next);
      setDataset({ ...dataset, claims: r.claims, industry: next.id, fieldsPresent: r.fieldsPresent });
    }
  };

  const pickStart = (p: StartPick) => {
    switchIndustry(p.industry, { naics: p.code, ownership: p.ownership, custom: false });
    try {
      localStorage.setItem(START_KEY, JSON.stringify({ industry: p.industry, naics: p.code }));
    } catch {
      /* storage off */
    }
    setShowStart(false);
    setStartDone(true);
    const t = getIndustry(p.industry);
    toast.success(`${p.code} ${p.title}`, { description: `${t.id === "general" ? "General" : t.name} template. Safety numbers compare with BLS for this code. Load your loss run under Data.`, action: { label: "Load data", onClick: () => setDlg("data") } });
  };
  const skipStart = () => {
    try {
      localStorage.setItem(START_KEY, JSON.stringify({ industry: ind.id, skipped: true }));
    } catch {
      /* storage off */
    }
    setShowStart(false);
    setStartDone(true);
  };
  const naicsChip = choice.custom ? `Own target${choice.label ? `: ${choice.label}` : ""}` : naicsChipLabel(choice.naics || ind.bls.default);

  const exportInput = () => ({ ind, brand: { ...brand, companyName: company }, theme, filters, allClaims: all, dims, filtered, valuationDay: V, kpis: k, locRows, concerns: found, sourceName: dataset.sourceName, isSample: dataset.isSample, largeAt, th, safety: osha ? { rows: sYears, locRows: sLocRows, bench, caseTypes } : undefined });
  const base = `${slug(company)}-loss-review`;

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-[#1c2126] antialiased" style={vars}>
      <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: "Figtree, system-ui, sans-serif", fontSize: 13 } }} />
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col text-white lg:flex" style={{ background: "var(--brand-deep)" }}>
          <div className="px-5 pb-5 pt-6">
            {brand.logo ? (
              <div className="flex h-[64px] items-center justify-center rounded-xl bg-white px-3">
                <img src={brand.logo.dataUrl} alt={`${company} logo`} className="max-h-[44px] max-w-full object-contain" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl text-[15px] font-extrabold" style={{ background: "var(--accent)", color: "#fff" }}>
                  {initials(company)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold leading-tight">{company}</div>
                  <div className="text-[11.5px] text-white/60">Loss dashboard</div>
                </div>
              </div>
            )}
          </div>
          <nav className="flex-1 space-y-0.5 px-3">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold transition ${active === n.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {n.label}
                {n.id === "findings" && found.length > 0 && <span className="rounded-full bg-white/20 px-2 text-[11px] font-bold">{found.length}</span>}
              </button>
            ))}
          </nav>
          <div className="m-3 rounded-xl bg-white/10 p-3.5 text-[12px] leading-relaxed text-white/75">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/50">Data</div>
            <div className="mt-1 line-clamp-2 font-semibold text-white">{dataset.sourceName}</div>
            <div className="mt-1">
              {num(all.length)} claims · valued {fmtDay(V, "long")}
            </div>
            <button type="button" onClick={() => setDlg("data")} className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[12px] font-bold" style={{ color: "var(--brand-deep)" }}>
              <FileUp className="h-3.5 w-3.5" /> Load a loss run
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div ref={dashRef}>
            <header className="px-4 pb-4 pt-5 sm:px-8 sm:pt-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {brand.logo ? (
                    <div className="export-show flex h-12 shrink-0 items-center rounded-lg bg-white px-2 ring-1 ring-[#e3e6ea] lg:hidden">
                      <img src={brand.logo.dataUrl} alt="" className="max-h-9 max-w-[110px] object-contain" />
                    </div>
                  ) : (
                    <div className="export-show flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold text-white lg:hidden" style={{ background: "var(--brand-deep)" }}>
                      {initials(company)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--accent-ink)" }}>
                      {ind.title}
                    </div>
                    <h1 className="mt-0.5 line-clamp-2 break-words text-[24px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">{company}</h1>
                    <p className="mt-0.5 text-[13px] text-[#5d6570]">
                      Loss years {allYears[0]}–{allYears[allYears.length - 1]} · {num(all.length)} claims · {dataset.isSample ? "synthetic sample data" : dataset.sourceName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {local && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f3ea] px-3 py-1.5 text-[12px] font-semibold text-[#18794e]" data-export-ignore title="This copy runs entirely on this computer. Nothing is sent over the internet.">
                      <Lock className="h-3.5 w-3.5" /> Offline · data stays on this computer
                    </span>
                  )}
                  <button type="button" onClick={() => setShowStart(true)} title="Change industry" className="inline-flex max-w-[280px] items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3c434c] ring-1 ring-[#e3e6ea] hover:ring-[#b7bcc4]">
                    <span className="truncate">{naicsChip}</span>
                    <span className="shrink-0 font-bold" style={{ color: "var(--brand-deep)" }} data-export-ignore>
                      Change
                    </span>
                  </button>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#3c434c] ring-1 ring-[#e3e6ea]">Valued {fmtDay(V, "long")}</span>
                  <div className="flex items-center gap-2" data-export-ignore>
                    <button type="button" onClick={() => setDlg("data")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold ring-1 ring-[#d8dce1] hover:ring-[#b7bcc4]">
                      <FileUp className="h-4 w-4" /> <span>Data</span>
                    </button>
                    <button type="button" onClick={() => setDlg("brand")} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold ring-1 ring-[#d8dce1] hover:ring-[#b7bcc4]">
                      <Palette className="h-4 w-4" /> <span>Brand</span>
                    </button>
                    <button type="button" onClick={() => setDlg("levels")} className="relative inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-semibold ring-1 ring-[#d8dce1] hover:ring-[#b7bcc4]">
                      <Gauge className="h-4 w-4" /> <span>Risk levels</span>
                      {!isDefault(th) && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#d99a1e] ring-2 ring-white" title="Custom levels" />}
                    </button>
                    <button type="button" onClick={() => setDlg("export")} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-bold text-white" style={{ background: "var(--brand-deep)" }}>
                      <Download className="h-4 w-4" /> Export
                    </button>
                  </div>
                </div>
              </div>
              {dataset.isSample && banner && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#e3e6ea] bg-white px-4 py-3 text-[13px]" data-export-ignore>
                  <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent-ink)" }} />
                  <div className="flex-1 text-[#3c434c]">
                    <b className="text-[#1c2126]">This is synthetic sample data.</b> Load your own loss run (Excel, CSV or Word table) and the whole dashboard rebuilds. Then set your name, logo and colors under Brand.
                  </div>
                  <button type="button" onClick={() => setDlg("data")} className="shrink-0 rounded-md px-2.5 py-1 text-[12.5px] font-bold text-white" style={{ background: "var(--brand-deep)" }}>
                    Load data
                  </button>
                  <button type="button" aria-label="Dismiss" onClick={() => setBanner(false)} className="shrink-0 text-[#8b929b] hover:text-[#1c2126]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <nav className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 lg:hidden" data-export-ignore>
                {NAV.map((n) => (
                  <button key={n.id} type="button" onClick={() => go(n.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${active === n.id ? "text-white" : "bg-white text-[#3c434c] ring-1 ring-[#e3e6ea]"}`} style={active === n.id ? { background: "var(--brand-deep)" } : undefined}>
                    {n.label}
                  </button>
                ))}
              </nav>
            </header>

            <div className="sticky top-0 z-30 border-y border-[#e3e6ea] bg-[#f5f6f8]/95 px-4 py-2.5 backdrop-blur sm:px-8" data-export-ignore>
              <FilterBar f={filters} set={setFilters} opts={opts} shown={filtered.length} total={all.length} ind={ind} />
            </div>
            {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
              <div className="px-4 pt-3 text-[12px] font-semibold text-[#5d6570] sm:px-8">Showing: {scope}</div>
            )}

            <div className="space-y-10 px-4 pb-16 pt-6 sm:px-8">
              {/* Overview */}
              <section className="space-y-4">
                <SectionHead id="overview" eyebrow="Overview" title="Where things stand" sub={`Changes compare the same window each year (Jan 1 to ${fmtDay(V, "long").replace(/ \d{4}$/, "")}) so a partial year isn't judged against a full one.`} />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
                  {k.map((x) => (
                    <KpiTile key={x.key} k={x} />
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ChartCard
                    title="Claims by loss year"
                    subtitle="Frequency. The current year is partial and drawn lighter."
                    file="claims-by-year"
                    table={{ cols: [{ key: "label", label: "Year" }, { key: "count", label: "Claims", align: "right", fmt: num }, { key: "avg", label: "Avg cost", align: "right", fmt: (v) => money(v, false) }], rows: yr }}
                  >
                    <YearBars data={yr} metric="count" color={theme.primary} fmt={fmtCount} />
                  </ChartCard>
                  <ChartCard
                    title="Total incurred by loss year"
                    subtitle="Severity. Recent years keep developing as claims mature."
                    file="incurred-by-year"
                    table={{ cols: [{ key: "label", label: "Year" }, { key: "incurred", label: "Incurred", align: "right", fmt: (v) => money(v, false) }], rows: yr }}
                  >
                    <YearBars data={yr} metric="incurred" color={theme.primary} fmt={fmtMoney} />
                  </ChartCard>
                </div>
              </section>

              {/* Trends */}
              <section className="space-y-4">
                <SectionHead id="trends" eyebrow="Trends" title="Year over year" sub="Each line is a loss year. Watch whether this year's line sits above last year's." />
                <ChartCard
                  title={`${trendMetric === "count" ? "Claims" : "Incurred"} by month${cumulative ? ", running total" : ""}`}
                  subtitle={`Last ${lineYears.length} loss years in view`}
                  file="monthly-year-over-year"
                  controls={
                    <div className="mr-1 hidden items-center gap-1.5 sm:flex">
                      <Seg small value={trendMetric} onChange={setTrendMetric} options={[{ value: "count", label: "Claims" }, { value: "incurred", label: "Incurred" }]} />
                      <Seg small value={cumulative ? "cum" : "mon"} onChange={(v) => setCumulative(v === "cum")} options={[{ value: "mon", label: "Monthly" }, { value: "cum", label: "Running total" }]} />
                    </div>
                  }
                  table={{ cols: [{ key: "month", label: "Month" }, ...lineYears.map((y, i) => ({ key: String(y), label: lineLabels[i], align: "right" as const, fmt: (v: any) => (v == null ? "–" : trendMetric === "count" ? num(v) : money(v, false)) }))], rows: monthlyData }}
                >
                  <div className="mb-2 flex flex-wrap gap-1.5 sm:hidden" data-export-ignore>
                    <Seg small value={trendMetric} onChange={setTrendMetric} options={[{ value: "count", label: "Claims" }, { value: "incurred", label: "Incurred" }]} />
                    <Seg small value={cumulative ? "cum" : "mon"} onChange={(v) => setCumulative(v === "cum")} options={[{ value: "mon", label: "Monthly" }, { value: "cum", label: "Running" }]} />
                  </div>
                  <MonthlyLines data={monthlyData} years={lineYears} colors={lineColors} labels={lineLabels} fmt={trendMetric === "count" ? fmtCount : fmtMoney} />
                </ChartCard>
                <div className="grid gap-4 lg:grid-cols-5">
                  <ChartCard
                    className="lg:col-span-3"
                    title={`${covMetric === "count" ? "Claims" : "Incurred"} by line of coverage`}
                    subtitle="Stacked by loss year"
                    file="coverage-by-year"
                    controls={<Seg small value={covMetric} onChange={setCovMetric} options={[{ value: "count", label: "Claims" }, { value: "incurred", label: "Incurred" }]} />}
                    table={{ cols: [{ key: "label", label: "Year" }, ...cov.present.map((cv) => ({ key: cv, label: coverageLabel(ind, cv), align: "right" as const, fmt: (v: any) => (covMetric === "count" ? num(v) : money(v, false)) }))], rows: cov.rows }}
                  >
                    <StackedBars rows={cov.rows} keys={cov.present} names={cov.present.map((cv) => coverageLabel(ind, cv))} colors={cov.present.map((cv) => coverageColor(theme.series, cv, ind))} fmt={covMetric === "count" ? fmtCount : fmtMoney} />
                  </ChartCard>
                  <ChartCard
                    className="lg:col-span-2"
                    title="Claims by day of week"
                    subtitle={ind.dowNote}
                    file="day-of-week"
                    table={{ cols: [{ key: "day", label: "Day" }, { key: "count", label: "Claims", align: "right", fmt: num }], rows: dow }}
                  >
                    <ColumnBars data={dow} xKey="day" yKey="count" name="Claims" color={theme.primary} fmt={fmtCount} h={268} />
                  </ChartCard>
                </div>
              </section>

              {/* Causes */}
              <section className="space-y-4">
                <SectionHead id="causes" eyebrow="Causes" title="What's driving losses" sub={`Carrier cause codes and descriptions are grouped into common ${ind.name.toLowerCase()} categories.`} />
                <div className="grid gap-4 lg:grid-cols-5">
                  <ChartCard
                    className="lg:col-span-3"
                    title="Top causes, last 12 months vs prior"
                    subtitle={`Rolling 12 months ending ${fmtDay(V, "long")}. Red means up more than 25%.`}
                    file="top-causes"
                    table={{ cols: [{ key: "category", label: "Cause" }, { key: "prior", label: "Prior 12", align: "right" }, { key: "current", label: "Last 12", align: "right" }, { key: "change", label: "Change", align: "right", fmt: (v) => pct(v) }], rows: causes }}
                  >
                    <CompareBars data={causes} color={theme.primary} labelWidth={labelW} />
                  </ChartCard>
                  <ChartCard
                    className="lg:col-span-2"
                    title="Average cost per claim by cause"
                    subtitle="Causes with at least 3 claims in view"
                    file="severity-by-cause"
                    table={{ cols: [{ key: "category", label: "Cause" }, { key: "count", label: "Claims", align: "right" }, { key: "avg", label: "Avg cost", align: "right", fmt: (v) => money(v, false) }, { key: "total", label: "Total", align: "right", fmt: (v) => money(v, false) }], rows: severity }}
                  >
                    <RankBars data={severity.map((s) => ({ name: s.category, value: s.avg }))} name="Avg cost" color={theme.primary} fmt={fmtMoney} labelWidth={labelW} />
                  </ChartCard>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {details.map(({ d, rows }) =>
                    rows.length > 0 || d.repeat ? (
                      <ChartCard
                        key={d.file}
                        title={d.title}
                        subtitle={d.subtitle}
                        file={d.file}
                        table={{ cols: [{ key: "name", label: fieldLabel(d.field) }, { key: "count", label: "Claims", align: "right" }, { key: "incurred", label: "Incurred", align: "right", fmt: (v) => money(v, false) }], rows }}
                      >
                        {rows.length ? (
                          <RankBars data={rows.map((b) => ({ name: b.name, value: b.count }))} name="Claims" color={theme.primary} fmt={fmtCount} labelWidth={wide ? 130 : 100} />
                        ) : (
                          <div className="py-10 text-center text-[13px] text-[#5d6570]">No repeats in the last 12 months. Good sign.</div>
                        )}
                      </ChartCard>
                    ) : null,
                  )}
                  {hasLag && (
                    <ChartCard
                      title="Days from loss to report"
                      subtitle="Days from loss to report. Late reports cost more, especially in WC."
                      file="report-lag"
                      table={{ cols: [{ key: "label", label: "Reported" }, { key: "count", label: "Claims", align: "right" }, { key: "avg", label: "Avg cost", align: "right", fmt: (v) => money(v, false) }], rows: lag }}
                      note={(() => {
                        const lateAvg = lag.slice(3).reduce((a, b) => a + b.avg * b.count, 0) / Math.max(1, lag.slice(3).reduce((a, b) => a + b.count, 0));
                        const fastAvg = lag.slice(0, 2).reduce((a, b) => a + b.avg * b.count, 0) / Math.max(1, lag.slice(0, 2).reduce((a, b) => a + b.count, 0));
                        return fastAvg > 0 && lateAvg > 0 ? `Claims reported after a week average ${money(lateAvg)} vs ${money(fastAvg)} for those reported within 3 days.` : undefined;
                      })()}
                    >
                      <ColumnBars data={lag} xKey="label" yKey="count" name="Claims" color={theme.primary} colors={ordinalRamp(theme.primary, lag.length).reverse()} fmt={fmtCount} h={250} />
                    </ChartCard>
                  )}
                </div>
              </section>

              {/* Locations */}
              <section className="space-y-4">
                <SectionHead id="locations" eyebrow={ind.unit.Many} title={`${ind.unit.Many} to watch`} sub={`Which ${ind.unit.many} are getting worse, and what keeps happening there.`} />
                <WatchList ind={ind} rows={locRows} largeAt={largeAt} onPick={(loc) => { setFilters({ ...filters, locations: [loc] }); toTop(); }} />
                <div className="grid gap-4 lg:grid-cols-5">
                  <ChartCard className="lg:col-span-2" title={`Claims by ${ind.unit.one}`} subtitle="Top 15 in the current view" file={`claims-by-${ind.unit.one}`} table={{ cols: [{ key: "name", label: ind.unit.One }, { key: "count", label: "Claims", align: "right" }, { key: "incurred", label: "Incurred", align: "right", fmt: (v) => money(v, false) }], rows: byLoc }}>
                    <RankBars data={byLoc.map((b) => ({ name: b.name, value: b.count }))} name="Claims" color={theme.primary} fmt={fmtCount} labelWidth={wide ? 170 : 120} />
                  </ChartCard>
                  <div className="min-w-0 lg:col-span-3">
                    <HeatGrid ind={ind} grid={grid} base={theme.primary} onPick={(loc, cat) => { setFilters({ ...filters, locations: [loc], categories: [cat] }); toTop(); }} />
                  </div>
                </div>
              </section>

              {/* Safety */}
              <section className="space-y-4">
                <SectionHead
                  id="safety"
                  eyebrow="Safety"
                  title="Safety rates"
                  sub={osha ? "OSHA recordables from the loss run, turned into rates with hours worked and compared with your industry." : "Add OSHA columns and hours worked to see TRIR and DART next to your industry. Optional."}
                />
                <SafetySection
                  ind={ind}
                  th={th}
                  color={theme.primary}
                  series={theme.series}
                  bench={bench}
                  choice={choice}
                  setChoice={(c) => setChoice(c)}
                  osha={osha}
                  caseTypes={caseTypes}
                  days={oshaDays}
                  rows={sYears}
                  wcByYear={wcByYear}
                  locRows={sLocRows}
                  hours={dataset.hours}
                  hoursSource={dataset.hoursSource}
                  years={years}
                  scoped={!!sLocs}
                  onHours={(rows: HoursRow[], source: string, naics?: string) => {
                    setDataset({ ...dataset, hours: rows, hoursSource: source });
                    if (naics) setChoice({ ...choice, naics, custom: false });
                    toast.success(`Hours worked loaded`, { description: source });
                  }}
                  onPick={(loc) => {
                    setFilters({ ...filters, locations: [loc] });
                    toTop();
                  }}
                />
              </section>

              {/* Findings */}
              <section className="space-y-4">
                <SectionHead id="findings" eyebrow="Findings" title="What needs attention" sub="Flagged automatically from the data and ranked by severity. Review before sharing." />
                <Findings ind={ind} items={found} onApply={(p) => { setFilters({ ...EMPTY_FILTERS, yearFrom: filters.yearFrom, yearTo: filters.yearTo, ...p }); toTop(); }} />
                <BandKey ind={ind} th={th} onEdit={() => setDlg("levels")} />
              </section>

              {/* Large losses */}
              <section className="space-y-4">
                <SectionHead id="large-losses" eyebrow="Large losses" title="Biggest claims" />
                <LargeLosses ind={ind} claims={largest} largeAt={largeAt} />
              </section>

              <footer className="border-t border-[#e3e6ea] pt-5 text-[11.5px] leading-relaxed text-[#6c737d]">
                {dataset.isSample ? `Synthetic sample data for a fictional ${ind.name.toLowerCase()} company. ` : `Source: ${dataset.sourceName}. `}
                Valued {fmtDay(V, "long")}. Incurred = paid + reserve. Loss year = year of the date of loss. Causes are grouped automatically; spot-check before external use.
                <div className="mt-2" data-export-ignore>
                  {OFFLINE
                    ? "Runs entirely in this browser. No AI runs inside this tool; findings come from fixed rules and math. "
                    : "Runs in this browser. AI is used only if you click Find colors under Brand. "}
                  For illustration only; not insurance, legal or safety advice. Built with open-source software: React, Recharts, Radix UI (MIT); SheetJS Community Edition (Apache 2.0); PptxGenJS, JSZip, html-to-image (MIT); Lucide icons (ISC); Figtree font (SIL OFL 1.1).
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>

      {showStart && <StartScreen onPick={pickStart} onSkip={skipStart} onClose={startDone ? () => setShowStart(false) : undefined} />}
      <DataDialog open={dlg === "data"} onOpenChange={(v) => setDlg(v ? "data" : null)} onApply={applyData} onSample={() => { setDataset(sampleDataset(ind)); setFilters(EMPTY_FILTERS); }} largeAt={largeAt} setLargeAt={setLargeAt} ind={ind} onIndustry={switchIndustry} />
      <ThresholdsDialog open={dlg === "levels"} onOpenChange={(v) => setDlg(v ? "levels" : null)} th={th} setTh={setTh} unitLabel={ind.unit.One} />
      <BrandDialog open={dlg === "brand"} onOpenChange={(v) => setDlg(v ? "brand" : null)} brand={brand} setBrand={setBrand} theme={theme} />
      <ExportDialog
        open={dlg === "export"}
        onOpenChange={(v) => setDlg(v ? "export" : null)}
        scope={scope}
        onPptx={async () => {
          try {
            const blob = await buildPptx(exportInput());
            announceSave(await saveFile(`${base}.pptx`, blob), `${base}.pptx`);
          } catch (e: any) {
            toast.error(e?.message || "Could not build the slides.");
          }
        }}
        onPng={async () => {
          setDlg(null);
          await new Promise((r) => setTimeout(r, 350));
          await savePng(dashRef.current, `${base}.png`, "#f5f6f8");
        }}
        onXlsx={async () => {
          announceSave(await saveFile(`${base}-claims.xlsx`, filteredClaimsXlsx(filtered, ind)), `${base}-claims.xlsx`);
        }}
      />
    </div>
  );
}
