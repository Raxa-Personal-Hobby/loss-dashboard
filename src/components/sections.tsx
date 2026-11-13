import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronsUpDown, Filter, Minus } from "lucide-react";
import type { Band, Claim, Filters } from "@/lib/types";
import type { Concern, Kpi, LocationRow } from "@/lib/metrics";
import type { Industry } from "@/lib/industries";
import { isDefault, type Thresholds } from "@/lib/thresholds";
import { money, pct } from "@/lib/metrics";
import { fmtDay } from "@/lib/normalize";
import { inkOn, seqColor } from "@/lib/color";
import { BAND_STYLE, BandPill } from "./bands";
import { ChartCard } from "./kit";

export function KpiTile({ k }: { k: Kpi }) {
  const Icon = k.deltaDir === "up" ? ArrowUpRight : k.deltaDir === "down" ? ArrowDownRight : Minus;
  return (
    <div className="flex min-w-0 flex-col rounded-[14px] border border-[#e3e6ea] bg-white p-4" title={k.bandNote || undefined}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5d6570]">{k.label}</div>
        {k.band != null && <BandPill band={k.band} size="xs" />}
      </div>
      <div className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.02em] text-[#1c2126]">{k.value}</div>
      <div className="mt-1.5 truncate text-[12px] text-[#5d6570]">{k.sub}</div>
      {k.delta && (
        <div className="mt-auto flex items-center gap-1 pt-3 text-[11.5px] font-semibold text-[#3c434c]">
          {k.deltaDir !== "none" && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
          <span className="leading-tight">{k.delta}</span>
        </div>
      )}
    </div>
  );
}

type SortKey = "score" | "location" | "l12" | "change" | "incurred" | "open" | "litigated";

export function WatchList({ rows, onPick, largeAt, ind }: { rows: LocationRow[]; onPick: (loc: string) => void; largeAt: number; ind: Industry }) {
  const U = ind.unit;
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "score", dir: -1 });
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const val = (r: LocationRow) => (sort.k === "change" ? r.change ?? 9 : sort.k === "location" ? r.location : (r as any)[sort.k]);
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = typeof x === "string" ? x.localeCompare(y) : x - y;
      return c * sort.dir || b.l12 - a.l12;
    });
  }, [rows, sort]);
  const shown = all ? sorted : sorted.slice(0, 12);
  const H = ({ k, children, right }: { k: SortKey; children: string; right?: boolean }) => (
    <th className={`whitespace-nowrap border-b border-[#e3e6ea] px-3 py-2.5 font-semibold text-[#5d6570] ${right ? "text-right" : "text-left"}`}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-[#1c2126]" onClick={() => setSort({ k, dir: sort.k === k ? (-sort.dir as 1 | -1) : k === "location" ? 1 : -1 })}>
        {children}
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </button>
    </th>
  );
  return (
    <ChartCard
      title={`${U.One} watch list`}
      subtitle={`Ranked by risk signals in the last 12 months. Tap a ${U.one} to filter the whole dashboard.`}
      file={`${U.one}-watch-list`}
      note={`Signals: frequency vs the average ${U.one}, change vs the prior 12 months, incurred vs average, large losses (${money(largeAt)}+), open litigation, repeat causes, and report lag. Claims and incurred columns follow your filters.`}
    >
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[860px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-[#f7f8f9]">
              <H k="location">{U.One}</H>
              <H k="score">Band</H>
              <H k="l12" right>
                Last 12 mo
              </H>
              <H k="change" right>
                Change
              </H>
              <H k="incurred" right>
                Incurred
              </H>
              <H k="open" right>
                Open
              </H>
              <H k="litigated" right>
                Litigated
              </H>
              <th className="border-b border-[#e3e6ea] px-3 py-2.5 text-left font-semibold text-[#5d6570]">Why it's flagged</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.location} className="group cursor-pointer border-b border-[#f0f1f3] last:border-0 hover:bg-[#f9f9fa]" onClick={() => onPick(r.location)}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1c2126]">{r.location}</span>
                    <Filter className="h-3 w-3 text-[#9aa0a8] opacity-0 group-hover:opacity-100" aria-hidden />
                  </div>
                  <div className="text-[11.5px] text-[#6c737d]">
                    {r.region}
                    {r.region && r.topCause ? " · " : ""}
                    {r.topCause ? `Top cause: ${r.topCause}` : ""}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <BandPill band={r.band} size="xs" />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className="font-semibold">{r.l12}</span> <span className="text-[#8b929b]">vs {r.p12}</span>
                </td>
                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.change != null && r.change > 0.25 ? "text-[#b42318]" : r.change != null && r.change < -0.1 ? "text-[#18794e]" : "text-[#1c2126]"}`}>
                  {r.change == null ? (r.l12 ? "new" : "–") : pct(r.change)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{money(r.incurred)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.open}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.litigated}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {r.flags.length ? (
                      r.flags.slice(0, 3).map((fl) => (
                        <span key={fl} className="rounded-md bg-[#f0f1f3] px-1.5 py-0.5 text-[11px] font-medium text-[#3c434c]">
                          {fl}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11.5px] text-[#9aa0a8]">Nothing unusual</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 12 && (
        <button type="button" data-export-ignore onClick={() => setAll(!all)} className="mt-3 text-[12.5px] font-semibold text-[color:var(--brand-deep)] hover:underline">
          {all ? "Show top 12" : `Show all ${rows.length} ${U.many}`}
        </button>
      )}
    </ChartCard>
  );
}

export function HeatGrid({ grid, base, onPick, ind }: { grid: { locs: string[]; cats: string[]; cells: number[][]; max: number }; base: string; onPick: (loc: string, cat: string) => void; ind: Industry }) {
  const U = ind.unit;
  const table = {
    cols: [{ key: "loc", label: U.One }, ...grid.cats.map((c) => ({ key: c, label: c, align: "right" as const }))],
    rows: grid.locs.map((loc, i) => Object.fromEntries([["loc", loc], ...grid.cats.map((c, j) => [c, grid.cells[i][j]])])),
  };
  return (
    <ChartCard title="Where claims come from" subtitle={`Claim count by ${U.one} and cause. Darker means more. Tap a cell to filter.`} file={`${U.one}-by-cause`} table={table} note={`Busiest 12 ${U.many} and top 8 causes in the current view.`}>
      {grid.locs.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[#5d6570]">No claims match these filters.</div>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="grid min-w-[700px] gap-[3px]" style={{ gridTemplateColumns: `minmax(150px,1.5fr) repeat(${grid.cats.length}, minmax(76px,1fr))` }}>
            <div />
            {grid.cats.map((c) => (
              <div key={c} className="flex items-end justify-center px-0.5 pb-1 text-center text-[10.5px] font-semibold leading-tight text-[#5d6570]">
                {c.replace(/\//g, "/\u200b")}
              </div>
            ))}
            {grid.locs.map((loc, i) => (
              <div key={loc} className="contents">
                <div className="truncate py-1.5 pr-2 text-[12px] font-semibold text-[#1c2126]" title={loc}>
                  {loc}
                </div>
                {grid.cells[i].map((v, j) => {
                  const bg = v ? seqColor(base, v / grid.max) : "#f6f7f9";
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => v && onPick(loc, grid.cats[j])}
                      title={`${loc} · ${grid.cats[j]}: ${v}`}
                      className="flex h-8 items-center justify-center rounded-[4px] text-[11.5px] font-semibold tabular-nums transition hover:ring-2 hover:ring-[#1c2126]/20"
                      style={{ background: bg, color: v ? inkOn(bg) : "#c3c8d0" }}
                    >
                      {v || "·"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export function Findings({ items, onApply, ind }: { items: Concern[]; onApply: (f: Partial<Filters>) => void; ind: Industry }) {
  const [all, setAll] = useState(false);
  if (!items.length)
    return (
      <div className="rounded-[14px] border border-[#e3e6ea] bg-white p-6 text-[13.5px] text-[#5d6570]">
        {`Nothing crossed a threshold in this view. That's a good sign, but check the watch list for ${ind.unit.many} trending up.`}
      </div>
    );
  const shown = all ? items : items.slice(0, 8);
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((c) => {
          const s = BAND_STYLE[c.band];
          return (
            <article key={c.id} className="relative flex flex-col overflow-hidden rounded-[12px] border border-[#e3e6ea] bg-white p-4 pl-5">
              <span className="absolute inset-y-0 left-0 w-[4px]" style={{ background: s.dot }} aria-hidden />
              <div className="flex items-center justify-between gap-2">
                <BandPill band={c.band} size="xs" />
                {c.filter && (
                  <button type="button" data-export-ignore onClick={() => onApply(c.filter!)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--brand-deep)] hover:underline">
                    <Filter className="h-3 w-3" /> Show me
                  </button>
                )}
              </div>
              <h4 className="mt-2 text-[14.5px] font-bold leading-snug text-[#1c2126]">{c.title}</h4>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#5d6570]">{c.detail}</p>
              <p className="mt-2.5 rounded-lg bg-[#f6f7f9] px-3 py-2 text-[12.5px] leading-relaxed text-[#3c434c]">
                <span className="font-semibold text-[#1c2126]">Next step: </span>
                {c.action}
              </p>
            </article>
          );
        })}
      </div>
      {items.length > 8 && (
        <button type="button" onClick={() => setAll(!all)} className="mt-3 text-[12.5px] font-semibold text-[color:var(--brand-deep)] hover:underline">
          {all ? "Show fewer" : `Show all ${items.length} findings`}
        </button>
      )}
    </div>
  );
}

export function BandKey({ ind, th, onEdit }: { ind: Industry; th: Thresholds; onEdit: () => void }) {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const cells = (cuts: number[], unit: string, signed = false) => {
    const f = (v: number) => `${signed && v > 0 ? "+" : ""}${fmt(v)}${unit}`;
    return [`${f(cuts[0])} or less`, `${f(cuts[0])} to ${f(cuts[1])}`, `${f(cuts[1])} to ${f(cuts[2])}`, `${f(cuts[2])} to ${f(cuts[3])}`, `Over ${f(cuts[3])}`];
  };
  const rows: { m: string; c: string[]; src: string }[] = [
    { m: "Same-period change (claims, incurred, average cost)", c: cells(th.changeBands, "%", true), src: "Template starting point" },
    { m: "Litigation rate change", c: cells(th.litBands, " pts", true), src: "Template starting point" },
    { m: "Average days to report", c: cells(th.lagBands, " days"), src: "Gallagher/PRIMA 3-day standard; The Hartford; NCCI 2015" },
    { m: `${ind.unit.One} signal score`, c: cells(th.scoreBands, ""), src: "Template starting point" },
  ];
  return (
    <ChartCard
      title="What the colors mean"
      subtitle="Five levels, from Low to Severe. You set the cut points under Risk levels."
      file="color-levels"
      controls={
        <button type="button" onClick={onEdit} className="mr-1 rounded-md px-2 py-1 text-[12px] font-semibold text-[color:var(--brand-deep)] hover:underline">
          Edit levels
        </button>
      }
      note={isDefault(th) ? "Showing the default starting points. Report-lag levels follow published research; the rest are template starting points, not industry benchmarks." : "Showing custom levels set in this browser."}
    >
      <div className="-mx-4 overflow-x-auto sm:-mx-5">
        <table className="w-full min-w-[720px] border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-[#5d6570] sm:px-5">Metric</th>
              {([0, 1, 2, 3, 4] as Band[]).map((b) => (
                <th key={b} className="px-2 py-2 text-left">
                  <BandPill band={b} size="xs" />
                </th>
              ))}
              <th className="px-2 py-2 text-left font-semibold text-[#5d6570]">Default based on</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.m} className="border-t border-[#f0f1f3]">
                <td className="px-4 py-2 font-semibold text-[#1c2126] sm:px-5">{r.m}</td>
                {r.c.map((x, i) => (
                  <td key={i} className="whitespace-nowrap px-2 py-2 text-[#3c434c]">
                    {x}
                  </td>
                ))}
                <td className="px-2 py-2 text-[11px] text-[#6c737d]">{r.src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

export function LargeLosses({ claims, largeAt, ind }: { claims: Claim[]; largeAt: number; ind: Industry }) {
  return (
    <ChartCard title="Largest claims" subtitle={`Top 10 by incurred in the current view. Large loss threshold: ${money(largeAt, false)}.`} file="largest-claims" note="Claimant names stay out of the dashboard and exports.">
      {claims.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[#5d6570]">No claims match these filters.</div>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#f7f8f9] text-[#5d6570]">
                {["Claim", ind.unit.One, "Loss date", "Line", "Cause", "Status", "Paid", "Reserve", "Incurred"].map((h, i) => (
                  <th key={h} className={`whitespace-nowrap border-b border-[#e3e6ea] px-3 py-2.5 font-semibold ${i >= 6 ? "text-right" : "text-left"} ${i === 0 ? "pl-4 sm:pl-5" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id + c.coverage} className="border-b border-[#f0f1f3] align-top last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 pl-4 font-semibold text-[#1c2126] sm:pl-5">
                    {c.id}
                    {c.litigated && <span className="ml-1.5 rounded bg-[#fbe3e1] px-1.5 py-[1px] text-[10.5px] font-bold text-[#b42318]">LIT</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="whitespace-nowrap text-[#1c2126]">{c.location}</div>
                    {c.description && <div className="mt-0.5 max-w-[320px] text-[11.5px] leading-snug text-[#6c737d]">{c.description}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{fmtDay(c.lossDay)}</td>
                  <td className="px-3 py-2">{c.coverage}</td>
                  <td className="whitespace-nowrap px-3 py-2">{c.category}</td>
                  <td className="px-3 py-2">
                    <span className={c.status === "Open" ? "font-semibold text-[#9a5b00]" : "text-[#5d6570]"}>{c.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(c.paid, false)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{money(c.reserve, false)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums text-[#1c2126]">{money(c.incurred, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}

