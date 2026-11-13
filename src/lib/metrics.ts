import type { Band, Claim, Coverage, Filters } from "./types";
import type { DetailChart, Industry } from "./industries";
import { MONTH_LABELS, fromDay, fmtDay } from "./normalize";
import { bandOf, type Thresholds } from "./thresholds";

export const money = (n: number, compact = true) => {
  if (!isFinite(n)) return "$0";
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (!compact) return s + "$" + Math.round(a).toLocaleString("en-US");
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`;
  return `${s}$${Math.round(a)}`;
};
export const num = (n: number) => Math.round(n).toLocaleString("en-US");
export const pct = (n: number | null, digits = 0) => (n == null || !isFinite(n) ? "n/a" : `${n > 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`);
export const change = (cur: number, prior: number) => (prior > 0 ? cur / prior - 1 : cur > 0 ? null : 0);

export function applyDims(claims: Claim[], f: Filters) {
  const locs = new Set(f.locations);
  const regs = new Set(f.regions);
  const covs = new Set(f.coverages);
  const cats = new Set(f.categories);
  return claims.filter(
    (c) =>
      (!locs.size || locs.has(c.location)) &&
      (!regs.size || regs.has(c.region || c.state)) &&
      (!covs.size || covs.has(c.coverage)) &&
      (!cats.size || cats.has(c.category)) &&
      (f.status === "all" || c.status === f.status) &&
      (!f.litigatedOnly || c.litigated),
  );
}
export const applyYears = (claims: Claim[], f: Filters) =>
  claims.filter((c) => (f.yearFrom == null || c.lossYear >= f.yearFrom) && (f.yearTo == null || c.lossYear <= f.yearTo));

const sum = (cs: Claim[], k: "incurred" | "paid" | "reserve" = "incurred") => cs.reduce((s, c) => s + c[k], 0);

/** Same calendar window (Jan 1 to the valuation month/day) for the valuation year and the year before. */
export function samePeriod(claims: Claim[], V: number) {
  const { y, m, d } = fromDay(V);
  const md = (c: Claim) => {
    const x = fromDay(c.lossDay);
    return x.m * 100 + x.d;
  };
  const cut = m * 100 + d;
  const cur = claims.filter((c) => c.lossYear === y && md(c) <= cut);
  const prior = claims.filter((c) => c.lossYear === y - 1 && md(c) <= cut);
  return { cur, prior, year: y, label: `Jan 1 to ${MONTH_LABELS[m - 1]} ${d}` };
}
export function rolling(claims: Claim[], V: number) {
  return {
    l12: claims.filter((c) => c.lossDay > V - 365 && c.lossDay <= V),
    p12: claims.filter((c) => c.lossDay > V - 730 && c.lossDay <= V - 365),
  };
}

export const bandFromChange = (ch: number | null, th: Thresholds): Band => (ch == null ? 2 : bandOf(ch * 100, th.changeBands));

export interface Kpi {
  key: string;
  label: string;
  value: string;
  sub: string;
  delta: string;
  deltaDir: "up" | "down" | "flat" | "none";
  band: Band | null;
  bandNote: string;
}

export function kpis(filtered: Claim[], dims: Claim[], V: number, th: Thresholds): Kpi[] {
  const sp = samePeriod(dims, V);
  const rl = rolling(dims, V);
  const n = filtered.length;
  const inc = sum(filtered);
  const open = filtered.filter((c) => c.status === "Open");
  const lit = filtered.filter((c) => c.litigated).length;
  const lags = filtered.map((c) => c.lagDays).filter((x): x is number => x != null);
  const avgLag = lags.length ? lags.reduce((a, b) => a + b, 0) / lags.length : null;
  const late = lags.filter((x) => x > th.find.lateDays).length;
  const chCount = change(sp.cur.length, sp.prior.length);
  const chInc = change(sum(sp.cur), sum(sp.prior));
  const avgCur = sp.cur.length ? sum(sp.cur) / sp.cur.length : 0;
  const avgPrior = sp.prior.length ? sum(sp.prior) / sp.prior.length : 0;
  const chAvg = change(avgCur, avgPrior);
  const litRate = (cs: Claim[]) => (cs.length ? cs.filter((c) => c.litigated).length / cs.length : 0);
  const litPts = (litRate(rl.l12) - litRate(rl.p12)) * 100;
  const dir = (x: number | null) => (x == null ? "none" : x > 0.005 ? "up" : x < -0.005 ? "down" : "flat");
  const vs = `vs ${sp.year - 1}, ${sp.label}`;
  const lagBand: Band | null = avgLag == null ? null : bandOf(avgLag, th.lagBands);
  return [
    { key: "claims", label: "Claims", value: num(n), sub: `${num(sp.cur.length)} in ${sp.year} so far`, delta: `${pct(chCount)} ${vs}`, deltaDir: dir(chCount), band: bandFromChange(chCount, th), bandNote: "Level follows the same-period change in claim count." },
    { key: "incurred", label: "Total incurred", value: money(inc), sub: `${money(sum(filtered, "paid"))} paid`, delta: `${pct(chInc)} ${vs}`, deltaDir: dir(chInc), band: bandFromChange(chInc, th), bandNote: "Older years are more developed, so recent incurred usually grows." },
    { key: "avg", label: "Average cost per claim", value: money(n ? inc / n : 0), sub: `Median ${money(median(filtered.map((c) => c.incurred)))}`, delta: `${pct(chAvg)} ${vs}`, deltaDir: dir(chAvg), band: bandFromChange(chAvg, th), bandNote: "Severity. Level follows the same-period change." },
    { key: "open", label: "Open claims", value: num(open.length), sub: `${n ? Math.round((open.length / n) * 100) : 0}% open · ${money(sum(open, "reserve"))} reserved`, delta: `${filtered.filter((c) => c.status === "Open" && V - c.lossDay > 365).length} open over a year`, deltaDir: "none", band: null, bandNote: "" },
    { key: "lit", label: "Litigation rate", value: `${n ? ((lit / n) * 100).toFixed(1) : "0.0"}%`, sub: `${num(lit)} litigated claims`, delta: `${litPts >= 0 ? "+" : ""}${litPts.toFixed(1)} pts, last 12 mo vs prior`, deltaDir: litPts > 0.05 ? "up" : litPts < -0.05 ? "down" : "flat", band: bandOf(litPts, th.litBands), bandNote: "Level follows the change in points." },
    { key: "lag", label: "Average days to report", value: avgLag == null ? "n/a" : avgLag.toFixed(1), sub: lags.length ? `${Math.round((late / lags.length) * 100)}% reported after ${th.find.lateDays} days` : "Add a Date reported column", delta: avgLag == null ? "" : "Aim for 24 to 48 hours", deltaDir: "none", band: lagBand, bandNote: "Research from NCCI and The Hartford ties later reporting to higher WC claim costs." },
  ];
}

export function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function yearsIn(claims: Claim[]) {
  return [...new Set(claims.map((c) => c.lossYear))].sort((a, b) => a - b);
}

export function byYear(claims: Claim[], years: number[], V: number) {
  const vy = fromDay(V).y;
  return years.map((y) => {
    const cs = claims.filter((c) => c.lossYear === y);
    const inc = sum(cs);
    return { year: y, label: y === vy ? `${y} YTD` : String(y), count: cs.length, incurred: inc, avg: cs.length ? inc / cs.length : 0, partial: y === vy };
  });
}

export function monthly(claims: Claim[], years: number[], V: number, metric: "count" | "incurred", cumulative: boolean) {
  const { y: vy, m: vm } = fromDay(V);
  return MONTH_LABELS.map((label, mi) => {
    const row: Record<string, number | string | null> = { month: label };
    for (const y of years) {
      if (y === vy && mi > vm - 1) {
        row[y] = null;
        continue;
      }
      const cs = claims.filter((c) => c.lossYear === y && (cumulative ? c.lossMonth <= mi : c.lossMonth === mi));
      row[y] = metric === "count" ? cs.length : Math.round(sum(cs));
    }
    return row;
  });
}

export function coverageByYear(claims: Claim[], years: number[], V: number, metric: "count" | "incurred", ind: Industry) {
  const vy = fromDay(V).y;
  const present = [...ind.coverages.map((c) => c.key), "Other"].filter((cv) => claims.some((c) => c.coverage === cv));
  const rows = years.map((y) => {
    const row: Record<string, number | string> = { label: y === vy ? `${y} YTD` : String(y) };
    for (const cv of present) {
      const cs = claims.filter((c) => c.lossYear === y && c.coverage === cv);
      row[cv] = metric === "count" ? cs.length : Math.round(sum(cs));
    }
    return row;
  });
  return { rows, present };
}

export function categoryCompare(dims: Claim[], V: number, limit = 10) {
  const { l12, p12 } = rolling(dims, V);
  const cats = new Map<string, { cur: number; prior: number; curInc: number }>();
  for (const c of l12) {
    const e = cats.get(c.category) ?? { cur: 0, prior: 0, curInc: 0 };
    e.cur++;
    e.curInc += c.incurred;
    cats.set(c.category, e);
  }
  for (const c of p12) {
    const e = cats.get(c.category) ?? { cur: 0, prior: 0, curInc: 0 };
    e.prior++;
    cats.set(c.category, e);
  }
  return [...cats.entries()]
    .map(([category, e]) => ({ category, current: e.cur, prior: e.prior, change: change(e.cur, e.prior), incurred: e.curInc }))
    .sort((a, b) => b.current - a.current || b.prior - a.prior)
    .slice(0, limit);
}

export function severityByCategory(claims: Claim[], limit = 10) {
  const m = new Map<string, Claim[]>();
  claims.forEach((c) => m.set(c.category, [...(m.get(c.category) ?? []), c]));
  return [...m.entries()]
    .filter(([, cs]) => cs.length >= 3)
    .map(([category, cs]) => ({ category, avg: sum(cs) / cs.length, count: cs.length, total: sum(cs) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, limit);
}

export function topCounts(claims: Claim[], key: "bodyPart" | "jobTitle" | "location", limit = 8) {
  const m = new Map<string, { count: number; incurred: number }>();
  for (const c of claims) {
    const k = c[key];
    if (!k) continue;
    const e = m.get(k) ?? { count: 0, incurred: 0 };
    e.count++;
    e.incurred += c.incurred;
    m.set(k, e);
  }
  return [...m.entries()].map(([name, e]) => ({ name, ...e })).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function dayOfWeek(claims: Claim[]) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts = new Array(7).fill(0);
  claims.forEach((c) => counts[fromDay(c.lossDay).dow]++);
  // Show Monday first, the way schedules are written.
  return [1, 2, 3, 4, 5, 6, 0].map((i) => ({ day: names[i], count: counts[i] }));
}

export const LAG_BUCKETS = [
  { label: "0–1", lo: 0, hi: 1 },
  { label: "2–3", lo: 2, hi: 3 },
  { label: "4–7", lo: 4, hi: 7 },
  { label: "8–14", lo: 8, hi: 14 },
  { label: "15–30", lo: 15, hi: 30 },
  { label: "31+", lo: 31, hi: 1e9 },
];
export function lagDistribution(claims: Claim[]) {
  return LAG_BUCKETS.map((b) => {
    const cs = claims.filter((c) => c.lagDays != null && c.lagDays >= b.lo && c.lagDays <= b.hi);
    return { label: b.label, count: cs.length, avg: cs.length ? sum(cs) / cs.length : 0 };
  });
}

export interface LocationRow {
  location: string;
  region: string;
  claims: number;
  incurred: number;
  avg: number;
  l12: number;
  p12: number;
  change: number | null;
  open: number;
  litigated: number;
  topCause: string;
  topCauseN: number;
  avgLag: number | null;
  large: number;
  score: number;
  band: Band;
  flags: string[];
}

export function locationRows(filtered: Claim[], dims: Claim[], V: number, th: Thresholds): LocationRow[] {
  const largeAt = th.largeLoss;
  const T = th.loc;
  const locs = [...new Set(dims.map((c) => c.location))];
  const { l12: L, p12: P } = rolling(dims, V);
  const l12Counts = locs.map((loc) => L.filter((c) => c.location === loc).length);
  const avgL12 = l12Counts.reduce((a, b) => a + b, 0) / Math.max(1, locs.length);
  const l12Inc = locs.map((loc) => sum(L.filter((c) => c.location === loc)));
  const avgInc = l12Inc.reduce((a, b) => a + b, 0) / Math.max(1, locs.length);
  return locs
    .map((loc, i) => {
      const all = filtered.filter((c) => c.location === loc);
      const l12 = L.filter((c) => c.location === loc);
      const p12 = P.filter((c) => c.location === loc).length;
      const cats = new Map<string, number>();
      l12.forEach((c) => cats.set(c.category, (cats.get(c.category) ?? 0) + 1));
      const [topCause, topCauseN] = [...cats.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
      const lags = l12.map((c) => c.lagDays).filter((x): x is number => x != null);
      const avgLag = lags.length ? lags.reduce((a, b) => a + b, 0) / lags.length : null;
      const large = l12.filter((c) => c.incurred >= largeAt).length;
      const openLit = dims.filter((c) => c.location === loc && c.status === "Open" && c.litigated).length;
      const ch = change(l12.length, p12);
      const flags: string[] = [];
      let score = 0;
      const fi = avgL12 > 0 ? l12Counts[i] / avgL12 : 0;
      const add = (pts: number, flag?: string) => {
        if (pts <= 0) return;
        score += pts;
        if (flag) flags.push(flag);
      };
      if (fi >= T.freq3) add(T.freq3Pts, `${fi.toFixed(1)}x average frequency`);
      else if (fi >= T.freq2) add(T.freq2Pts, `${fi.toFixed(1)}x average frequency`);
      else if (fi >= T.freq1) add(T.freq1Pts);
      const diff = l12.length - p12;
      if (l12.length >= T.spikeMin && diff >= T.spikeAdd && ch != null && ch * 100 >= T.spikePct) add(T.spikePts, `Claims ${pct(ch)} YoY`);
      else if (l12.length >= T.riseMin && diff >= T.riseAdd && (ch == null || ch * 100 >= T.risePct)) add(T.risePts, ch == null ? "New claim activity" : `Claims ${pct(ch)} YoY`);
      const si = avgInc > 0 ? l12Inc[i] / avgInc : 0;
      if (si >= T.sev2) add(T.sev2Pts, `${si.toFixed(1)}x average incurred`);
      else if (si >= T.sev1) add(T.sev1Pts, `${si.toFixed(1)}x average incurred`);
      if (large >= 2) add(T.large2Pts, `${large} large losses`);
      else if (large === 1) add(T.large1Pts, "1 large loss");
      if (openLit) add(T.litPts, `${openLit} open in litigation`);
      if (topCauseN >= T.rep2) add(T.rep2Pts, `${topCauseN} ${topCause}`);
      else if (topCauseN >= T.rep1) add(T.rep1Pts, `${topCauseN} ${topCause}`);
      if (avgLag != null && avgLag > T.lagDays && lags.length >= 3) add(T.lagPts, `${avgLag.toFixed(0)}-day report lag`);
      const band: Band = bandOf(score, th.scoreBands);
      const inc = sum(all);
      const anyRegion = dims.find((c) => c.location === loc);
      return {
        location: loc,
        region: anyRegion?.region || anyRegion?.state || "",
        claims: all.length,
        incurred: inc,
        avg: all.length ? inc / all.length : 0,
        l12: l12.length,
        p12,
        change: ch,
        open: all.filter((c) => c.status === "Open").length,
        litigated: all.filter((c) => c.litigated).length,
        topCause,
        topCauseN,
        avgLag,
        large,
        score,
        band,
        flags,
      };
    })
    .sort((a, b) => b.score - a.score || b.l12 - a.l12 || b.incurred - a.incurred);
}

export function heatGrid(claims: Claim[], rows = 12, cols = 8) {
  const locs = topCounts(claims, "location", rows).map((x) => x.name);
  const catCount = new Map<string, number>();
  claims.forEach((c) => catCount.set(c.category, (catCount.get(c.category) ?? 0) + 1));
  const cats = [...catCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, cols).map(([k]) => k);
  const cells = locs.map((loc) => cats.map((cat) => claims.filter((c) => c.location === loc && c.category === cat).length));
  const max = Math.max(1, ...cells.flat());
  return { locs, cats, cells, max };
}

export function topClaims(claims: Claim[], n = 10) {
  return [...claims].sort((a, b) => b.incurred - a.incurred).slice(0, n);
}

/* ---------------- Findings ---------------- */

export interface Concern {
  id: string;
  band: Band;
  title: string;
  detail: string;
  action: string;
  weight: number;
  filter?: Partial<Filters>;
}

export function concerns(dims: Claim[], V: number, locRows: LocationRow[], ind: Industry, th: Thresholds): Concern[] {
  const largeAt = th.largeLoss;
  const T = th.find;
  const out: Concern[] = [];
  const TIPS = ind.tips;
  const tip = (cat: string) => TIPS[cat] ?? TIPS.Other ?? "";
  const { l12, p12 } = rolling(dims, V);
  const sp = samePeriod(dims, V);

  // Store frequency spikes
  const covered = new Set<string>();
  for (const r of locRows) {
    if (r.l12 >= T.spikeMin && r.l12 - r.p12 >= T.spikeAdd && r.change != null && r.change * 100 >= T.spikePct) {
      const band: Band = r.change * 100 >= T.spikeSevPct && r.l12 >= T.spikeSevMin ? 4 : 3;
      out.push({
        id: `spike-${r.location}`,
        band,
        title: `${r.location}: claims ${pct(r.change)} in the last 12 months`,
        detail: `${r.l12} claims vs ${r.p12} the year before. Top cause: ${r.topCause} (${r.topCauseN}).`,
        action: tip(r.topCause),
        weight: r.l12 * (1 + r.change),
        filter: { locations: [r.location] },
      });
      covered.add(`${r.location}|${r.topCause}`);
    }
  }
  // Repeat causes at one store
  const pairs = new Map<string, number>();
  l12.forEach((c) => pairs.set(`${c.location}|${c.category}`, (pairs.get(`${c.location}|${c.category}`) ?? 0) + 1));
  const repeats = [...pairs.entries()].filter(([k, n]) => n >= T.repeatMin && !covered.has(k) && !k.endsWith("|Other")).sort((a, b) => b[1] - a[1]).slice(0, 6);
  for (const [k, n] of repeats) {
    const [loc, cat] = k.split("|");
    out.push({
      id: `repeat-${k}`,
      band: n >= T.repeatHigh ? 3 : 2,
      title: `${n} ${cat} claims at ${loc} in 12 months`,
      detail: `Same cause, same ${ind.unit.one}, inside a year. That usually points to one fixable condition.`,
      action: tip(cat),
      weight: n * 2,
      filter: { locations: [loc], categories: [cat] },
    });
  }
  // Large losses still open
  const big = dims.filter((c) => c.incurred >= largeAt && c.status === "Open").sort((a, b) => b.incurred - a.incurred);
  big.slice(0, 4).forEach((c) =>
    out.push({
      id: `large-${c.id}`,
      band: c.litigated && c.incurred >= largeAt * 2.5 ? 4 : c.litigated || c.incurred >= largeAt * 2 ? 3 : 2,
      title: `Open large loss ${c.id}: ${money(c.incurred)} at ${c.location}`,
      detail: `${c.coverage} · ${c.category} · loss date ${fmtDay(c.lossDay)}${c.litigated ? " · in litigation" : ""}. ${money(c.reserve)} still reserved.`,
      action: c.litigated
        ? "Ask defense counsel for a budget and a settlement range; confirm the carrier has excess and umbrella on notice."
        : "Ask the adjuster for a written action plan and a date to close or settle. Check for subrogation.",
      weight: c.incurred / 10000,
      filter: { locations: [c.location] },
    }),
  );
  if (big.length > 4) {
    out.push({
      id: "large-more",
      band: 2,
      title: `${big.length - 4} more open claim${big.length - 4 === 1 ? "" : "s"} over ${money(largeAt)}`,
      detail: `${money(big.slice(4).reduce((s, c) => s + c.reserve, 0))} reserved across them.`,
      action: "Set a quarterly large-loss review with the carrier or TPA.",
      weight: 5,
    });
  }
  // Company-wide cause trends
  for (const cc of categoryCompare(dims, V, 20)) {
    if (cc.category === "Other" || cc.current < T.catMin || cc.change == null || cc.change * 100 < T.catPct) continue;
    out.push({
      id: `cat-${cc.category}`,
      band: cc.change * 100 >= T.catHighPct ? 3 : 2,
      title: `${cc.category} claims ${pct(cc.change)} across the company`,
      detail: `${cc.current} in the last 12 months vs ${cc.prior} the year before.`,
      action: tip(cc.category),
      weight: cc.current * cc.change,
      filter: { categories: [cc.category] },
    });
  }
  // Overall frequency and severity
  const chCount = change(sp.cur.length, sp.prior.length);
  if (chCount != null && chCount * 100 >= T.freqPct && sp.cur.length >= T.minClaims) {
    out.push({
      id: "freq",
      band: chCount * 100 >= T.freqHighPct ? 3 : 2,
      title: `Claim count ${pct(chCount)} vs last year, same period`,
      detail: `${sp.cur.length} claims ${sp.label} ${sp.year} vs ${sp.prior.length} in ${sp.year - 1}. Check whether ${ind.exposure} grew at the same pace.`,
      action: `Compare against ${ind.exposure} to see if the rate is really rising, then target the top two causes.`,
      weight: 8,
    });
  }
  const avgC = sp.cur.length ? sp.cur.reduce((s, c) => s + c.incurred, 0) / sp.cur.length : 0;
  const avgP = sp.prior.length ? sp.prior.reduce((s, c) => s + c.incurred, 0) / sp.prior.length : 0;
  const chAvg = change(avgC, avgP);
  if (chAvg != null && chAvg * 100 >= T.sevPct && sp.cur.length >= T.minClaims) {
    out.push({
      id: "sev",
      band: chAvg * 100 >= T.sevHighPct ? 3 : 2,
      title: `Average claim cost ${pct(chAvg)} vs last year`,
      detail: `${money(avgC)} per claim vs ${money(avgP)}. Recent claims are still developing, so this tends to grow.`,
      action: "Look at the largest few claims first; one or two often drive the jump. Push for early return-to-work on WC.",
      weight: 7,
    });
  }
  // Late reporting
  const lagged = l12.filter((c) => c.lagDays != null);
  if (lagged.length >= 10) {
    const late = lagged.filter((c) => (c.lagDays ?? 0) > T.lateDays);
    const share = late.length / lagged.length;
    if (share * 100 >= T.lateShare) {
      const worst = locRows.filter((r) => r.avgLag != null && r.avgLag > T.lateDays).slice(0, 3).map((r) => r.location);
      out.push({
        id: "lag",
        band: share * 100 >= T.lateHighShare ? 3 : 2,
        title: `${Math.round(share * 100)}% of claims reported more than ${T.lateDays} days after the loss`,
        detail: worst.length ? `Slowest ${ind.unit.many}: ${worst.join(", ")}.` : `${late.length} of ${lagged.length} claims in the last 12 months.`,
        action: "Report every incident within 24 to 48 hours, even minor ones. NCCI and The Hartford both found late-reported WC claims cost more.",
        weight: share * 30,
        filter: worst.length ? { locations: worst } : undefined,
      });
    }
  }
  // Litigation
  const lr = (cs: typeof dims) => (cs.length ? cs.filter((c) => c.litigated).length / cs.length : 0);
  const litNow = lr(l12);
  const litDelta = litNow - lr(p12);
  if (l12.length >= T.minClaims && (litNow * 100 >= T.litRate || litDelta * 100 >= T.litDelta)) {
    out.push({
      id: "lit",
      band: litNow * 100 >= T.litHighRate || litDelta * 100 >= T.litHighDelta ? 3 : 2,
      title: `Litigation rate ${(litNow * 100).toFixed(1)}% in the last 12 months`,
      detail: `${litDelta >= 0 ? "Up" : "Down"} ${Math.abs(litDelta * 100).toFixed(1)} points from the year before. Litigated claims usually cost more and take longer to close.`,
      action: ind.litigationAction,
      weight: 9,
      filter: { litigatedOnly: true },
    });
  }
  // Repeat people or units (drivers with several crashes, for example)
  if (ind.repeat) {
    const rep = topCounts(l12, ind.repeat.field, 50).filter((x) => x.count >= 2);
    if (rep.length) {
      const top = rep.slice(0, 3).map((x) => `${x.name} (${x.count})`).join(", ");
      const worst = rep[0].count;
      out.push({
        id: "repeat-people",
        band: worst >= 3 && rep.length >= 3 ? 3 : worst >= 3 ? 2 : 1,
        title: `${rep.length} ${rep.length === 1 ? ind.repeat.noun : ind.repeat.nouns} with 2 or more claims in 12 months`,
        detail: `Most frequent: ${top}.`,
        action: ind.repeat.action,
        weight: rep.length * worst,
      });
    }
  }
  // Aging
  const aging = dims.filter((c) => c.status === "Open" && V - c.lossDay > T.agingDays);
  if (aging.length >= T.agingMin) {
    out.push({
      id: "aging",
      band: aging.length >= T.agingHigh ? 2 : 1,
      title: `${aging.length} claims open more than ${T.agingDays === 365 ? "a year" : `${T.agingDays} days`}`,
      detail: `${money(aging.reduce((s, c) => s + c.reserve, 0))} still reserved on them.`,
      action: "Ask the TPA for a closure plan on each. Old open claims tie up collateral and inflate experience mods.",
      weight: aging.length,
      filter: { status: "Open" },
    });
  }
  // Data quality
  const other = dims.filter((c) => c.category === "Other").length;
  if (dims.length >= 20 && (other / dims.length) * 100 >= T.otherShare) {
    out.push({
      id: "dq",
      band: 1,
      title: `${Math.round((other / dims.length) * 100)}% of claims have no clear cause`,
      detail: "The cause column is blank or too vague to group.",
      action: tip("Other"),
      weight: 2,
      filter: { categories: ["Other"] },
    });
  }
  return out.sort((a, b) => b.band - a.band || b.weight - a.weight);
}

export function filterSummary(f: Filters, allYears: number[]) {
  const parts: string[] = [];
  const y0 = f.yearFrom ?? allYears[0];
  const y1 = f.yearTo ?? allYears[allYears.length - 1];
  if (y0 != null) parts.push(y0 === y1 ? `${y0}` : `${y0}–${y1}`);
  if (f.locations.length) parts.push(f.locations.length === 1 ? f.locations[0] : `${f.locations.length} locations`);
  if (f.regions.length) parts.push(f.regions.join(", "));
  if (f.coverages.length) parts.push(f.coverages.join(", "));
  if (f.categories.length) parts.push(f.categories.length === 1 ? f.categories[0] : `${f.categories.length} causes`);
  if (f.status !== "all") parts.push(`${f.status} only`);
  if (f.litigatedOnly) parts.push("Litigated only");
  return parts.join(" · ");
}

export function coverageColor(series: string[], cv: Coverage, ind: Industry) {
  const i = ind.coverages.findIndex((c) => c.key === cv);
  return i < 0 ? "#9aa0a8" : series[i] ?? "#9aa0a8";
}

/** Data for an industry's extra chart (body part, trade, driver, unit, claimant type...). */
export function detailRows(filtered: Claim[], dims: Claim[], V: number, d: DetailChart, limit = 8) {
  const covOk = (c: Claim) => !d.coverages || d.coverages.includes(c.coverage);
  if (d.repeat) {
    const { l12 } = rolling(dims, V);
    return topCounts(l12.filter(covOk), d.field, 50).filter((x) => x.count >= 2).slice(0, 10);
  }
  return topCounts(filtered.filter(covOk), d.field, limit);
}
