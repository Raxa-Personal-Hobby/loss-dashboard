import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, num, pct } from "@/lib/metrics";
import { PRIOR } from "@/lib/color";

const TICK = { fill: "#5d6570", fontSize: 11, fontFamily: "Figtree, system-ui, sans-serif" };
const AXIS_LINE = { stroke: "#cdd1d7" };
const GRID = "#edeff1";

export type Fmt = (v: number) => string;
export const fmtCount: Fmt = (v) => num(v);
export const fmtMoney: Fmt = (v) => money(v);

export function Empty({ h = 240, text = "No claims match these filters." }: { h?: number; text?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#f7f8f9] text-[13px] text-[#5d6570]" style={{ height: h }}>
      {text}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#3c434c]">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Tip({ active, payload, label, fmt, labelFmt }: any) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p: any) => p.value != null);
  if (!rows.length) return null;
  return (
    <div className="min-w-[150px] rounded-lg border border-[#e3e6ea] bg-white px-3 py-2 text-[12px] shadow-[0_10px_28px_-10px_rgba(20,24,28,0.3)]">
      <div className="mb-1 font-semibold text-[#1c2126]">{labelFmt ? labelFmt(label, payload) : label}</div>
      {rows.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-[1px]">
          <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: p.color ?? p.fill }} aria-hidden />
          <span className="text-[#5d6570]">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-[#1c2126]">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const cursorFill = { fill: "rgba(20,32,46,0.04)" };

/* Bars by loss year. The partial current year is drawn lighter and labeled YTD. */
export function YearBars({ data, metric, color, fmt }: { data: { label: string; count: number; incurred: number; partial: boolean }[]; metric: "count" | "incurred"; color: string; fmt: Fmt }) {
  if (!data.length) return <Empty />;
  const vals = data.map((d) => d[metric]);
  const peak = vals.indexOf(Math.max(...vals));
  const last = data.length - 1;
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={metric === "incurred" ? 56 : 40} tickFormatter={(v) => (metric === "incurred" ? money(v) : num(v))} />
          <Tooltip cursor={cursorFill} content={<Tip fmt={fmt} />} />
          <Bar dataKey={metric} name={metric === "count" ? "Claims" : "Incurred"} fill={color} radius={[4, 4, 0, 0]} maxBarSize={64} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={color} fillOpacity={d.partial ? 0.55 : 1} />
            ))}
            <LabelList
              dataKey={metric}
              position="top"
              content={(p: any) => (p.index === last || p.index === peak ? <text x={p.x + p.width / 2} y={p.y - 6} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#1c2126">{fmt(p.value)}</text> : null)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* One line per year across Jan..Dec, direct-labeled at each line's end. */
export function MonthlyLines({ data, years, colors, fmt, labels }: { data: Record<string, any>[]; years: number[]; colors: string[]; fmt: Fmt; labels: string[] }) {
  if (!years.length) return <Empty h={300} />;
  return (
    <>
      <Legend items={years.map((_, i) => ({ label: labels[i], color: colors[i] }))} />
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 46, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="month" tick={TICK} axisLine={AXIS_LINE} tickLine={false} interval={0} minTickGap={2} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => fmt(v)} />
            <Tooltip content={<Tip fmt={fmt} />} cursor={{ stroke: "#cdd1d7", strokeWidth: 1 }} />
            {years.map((y, i) => {
              let lastIdx = -1;
              data.forEach((r, j) => r[y] != null && (lastIdx = j));
              const latest = i === years.length - 1;
              return (
                <Line
                  key={y}
                  type="linear"
                  dataKey={String(y)}
                  name={labels[i]}
                  stroke={colors[i]}
                  strokeWidth={latest ? 2.75 : 2}
                  dot={false}
                  activeDot={{ r: 4.5, stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                  label={(p: any) => (p.index === lastIdx && i >= years.length - 2 ? <text x={p.x + 6} y={p.y + 4} fontSize={11} fontWeight={latest ? 700 : 600} fill="#3c434c">{String(y)}</text> : <g />)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export function StackedBars({ rows, keys, colors, names, fmt, h = 270 }: { rows: Record<string, any>[]; keys: string[]; colors: string[]; names: string[]; fmt: Fmt; h?: number }) {
  if (!rows.length || !keys.length) return <Empty h={h} />;
  return (
    <>
      <Legend items={keys.map((_, i) => ({ label: names[i], color: colors[i] }))} />
      <div className="w-full" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => fmt(v)} />
            <Tooltip cursor={cursorFill} content={<Tip fmt={fmt} />} />
            {keys.map((k, i) => (
              <Bar key={k} dataKey={k} name={names[i]} stackId="a" fill={colors[i]} stroke="#ffffff" strokeWidth={1.5} radius={i === keys.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={64} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* Last 12 months vs prior 12, per cause. Prior is gray so the current period carries the color. */
export function CompareBars({ data, color, labelWidth }: { data: { category: string; current: number; prior: number; change: number | null }[]; color: string; labelWidth: number }) {
  if (!data.length) return <Empty h={300} />;
  const h = Math.max(220, data.length * 34 + 30);
  return (
    <>
      <Legend items={[{ label: "Prior 12 months", color: PRIOR }, { label: "Last 12 months", color }]} />
      <div className="w-full" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 52, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid horizontal={false} stroke={GRID} />
            <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="category" tick={{ ...TICK, fill: "#3c434c" }} axisLine={AXIS_LINE} tickLine={false} width={labelWidth} interval={0} tickFormatter={(v) => (labelWidth < 140 ? String(v).replace(/\//g, "/ ") : v)} />
            <Tooltip cursor={cursorFill} content={<Tip fmt={fmtCount} labelFmt={(l: string, p: any[]) => `${l} · ${pct(p[0]?.payload?.change ?? null)}`} />} />
            <Bar dataKey="prior" name="Prior 12 months" fill={PRIOR} radius={[0, 4, 4, 0]} barSize={10} isAnimationActive={false} />
            <Bar dataKey="current" name="Last 12 months" fill={color} radius={[0, 4, 4, 0]} barSize={10} isAnimationActive={false}>
              <LabelList
                dataKey="current"
                content={(p: any) => {
                  const d = data[p.index];
                  if (!d) return null;
                  const bad = d.change != null && d.change > 0.25;
                  return (
                    <text x={p.x + p.width + 6} y={p.y + p.height / 2 + 4} fontSize={11} fontWeight={bad ? 700 : 500} fill={bad ? "#b42318" : "#5d6570"}>
                      {d.change == null ? "new" : pct(d.change)}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* Ranked horizontal bars, values at the bar ends instead of an x-axis. */
export function RankBars({ data, color, fmt, labelWidth, colors, name }: { data: { name: string; value: number }[]; color: string; fmt: Fmt; labelWidth: number; colors?: string[]; name: string }) {
  if (!data.length) return <Empty h={220} />;
  const h = Math.max(160, data.length * 30 + 10);
  return (
    <div className="w-full" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap="26%">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tick={{ ...TICK, fill: "#3c434c" }} axisLine={AXIS_LINE} tickLine={false} width={labelWidth} interval={0} tickFormatter={(v) => (labelWidth < 140 ? String(v).replace(/\//g, "/ ") : v)} />
          <Tooltip cursor={cursorFill} content={<Tip fmt={fmt} />} />
          <Bar dataKey="value" name={name} fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
            {colors && data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            <LabelList dataKey="value" position="right" content={(p: any) => <text x={p.x + p.width + 6} y={p.y + p.height / 2 + 4} fontSize={11.5} fontWeight={600} fill="#1c2126">{fmt(p.value)}</text>} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ColumnBars({ data, xKey, yKey, color, colors, fmt, name, h = 220, labelPeak = true }: { data: Record<string, any>[]; xKey: string; yKey: string; color: string; colors?: string[]; fmt: Fmt; name: string; h?: number; labelPeak?: boolean }) {
  if (!data.length || data.every((d) => !d[yKey])) return <Empty h={h} />;
  const vals = data.map((d) => d[yKey] as number);
  const peak = vals.indexOf(Math.max(...vals));
  return (
    <div className="w-full" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey={xKey} tick={TICK} axisLine={AXIS_LINE} tickLine={false} interval={0} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => fmt(v)} allowDecimals={false} />
          <Tooltip cursor={cursorFill} content={<Tip fmt={fmt} />} />
          <Bar dataKey={yKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={52} isAnimationActive={false}>
            {colors && data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            {labelPeak && (
              <LabelList dataKey={yKey} content={(p: any) => (p.index === peak ? <text x={p.x + p.width / 2} y={p.y - 6} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#1c2126">{fmt(p.value)}</text> : null)} />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* A safety rate by loss year with the benchmark as a dashed reference line.
   Years with no hours have no bar. The partial current year is drawn lighter. */
export function RateBars({ data, color, bench, benchLabel, name }: { data: { label: string; rate: number | null; partial: boolean; cases: number }[]; color: string; bench: number | null; benchLabel: string; name: string }) {
  const shown = data.filter((d) => d.rate != null);
  if (!shown.length) return <Empty text="No years with hours worked in view." />;
  const fmt = (v: number) => v.toFixed(v >= 10 ? 1 : 2);
  const top = Math.max(bench ?? 0, ...shown.map((d) => d.rate!)) * 1.18;
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: bench != null ? 76 : 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={40} domain={[0, Math.max(0.5, Math.ceil(top * 2) / 2)]} tickFormatter={(v) => String(v)} />
          <Tooltip cursor={cursorFill} content={<Tip fmt={fmt} labelFmt={(l: string, p: any[]) => `${l} · ${num(p?.[0]?.payload?.cases ?? 0)} cases`} />} />
          {bench != null && (
            <ReferenceLine
              y={bench}
              stroke="#3c434c"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={(p: any) => (
                <text x={p.viewBox.x + p.viewBox.width + 6} y={p.viewBox.y + 4} fontSize={11} fontWeight={600} fill="#3c434c">
                  {benchLabel} {fmt(bench)}
                </text>
              )}
            />
          )}
          <Bar dataKey="rate" name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={64} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={color} fillOpacity={d.partial ? 0.55 : 1} />
            ))}
            <LabelList dataKey="rate" position="top" content={(p: any) => (p.value == null ? null : <text x={p.x + p.width / 2} y={p.y - 6} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#1c2126">{fmt(p.value)}</text>)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
