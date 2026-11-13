// Synthetic loss runs. Every company, location, person and claim here is invented,
// generated from a fixed seed so the demo looks the same every time.
import type { Table } from "./parse";
import type { Industry } from "./industries";
import { fieldsFor } from "./fields";
import { dayNum, fromDay } from "./normalize";
import { BODY_PARTS, MEDIAN_DAYS_BY_INDUSTRY, MEDIAN_DAYS_BY_NATURE, NATURES, blsRate } from "./bls";
import { HOURS_HEADERS } from "./safety";

export const SAMPLE_VALUATION = dayNum(2026, 10, 31);

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmt = (n: number) => {
  const { y, m, d } = fromDay(n);
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
};

const MON = [0.9, 0.85, 0.95, 0.95, 1.0, 1.1, 1.15, 1.15, 1.0, 0.95, 1.0, 1.1];

type OshaPick = "DAFW" | "DJTR" | "Other";
const CASE_TEXT: Record<OshaPick, string> = { DAFW: "Days away from work", DJTR: "Job transfer or restriction", Other: "Other recordable" };
/** Share of comp claims that end up on the OSHA 300 log. Template assumption: medical-only
 *  claims past first aid are recordable, and a few claims stay first aid or get denied. */
const REC_P = 0.82;
/** Cost by case type, relative to the category's typical claim. Lost-time claims cost the most.
 *  Template assumption, set so the overall average stays near the category medians. */
const SEV_FACTOR = { DAFW: 1.75, DJTR: 1.15, Other: 0.62, None: 0.3 };
/** BLS body part groups to the words a loss run would use. */
const BODY_LABEL: Record<string, string> = {
  Head: "Head", Eye: "Eye", Neck: "Neck", Back: "Lower Back", Trunk: "Trunk", Shoulder: "Shoulder", Arm: "Arm", Hand: "Hand", Wrist: "Wrist",
  "Upper, other": "Elbow", Knee: "Knee", Ankle: "Ankle", Foot: "Foot", Leg: "Leg", "Body systems": "Body Systems", Multiple: "Multiple", Other: "Other",
};

export function makeSampleTable(ind: Industry, seed = ind.sample.seed): Table {
  const S = ind.sample;
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const weighted = <T,>(a: [T, number][]) => {
    const tot = a.reduce((s, x) => s + x[1], 0);
    let u = r() * tot;
    for (const [v, w] of a) if ((u -= w) <= 0) return v;
    return a[a.length - 1][0];
  };
  const normal = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const V = SAMPLE_VALUATION;
  const start = dayNum(2022, 1, 1);
  const headers = fieldsFor(ind).map((f) => f.header!);
  const col = Object.fromEntries(fieldsFor(ind).map((f, i) => [f.key, i])) as Record<string, number>;
  const seq: Record<string, number> = {};
  const rows: unknown[][] = [headers];
  const mixCode = ind.bls.mix;
  const rates = blsRate(mixCode);
  const mdays = MEDIAN_DAYS_BY_INDUSTRY[mixCode] ?? MEDIAN_DAYS_BY_INDUSTRY.all;
  /** Pick from a short list using BLS case counts as weights. */
  const byBls = (keys: string[], counts?: Record<string, number>) => weighted(keys.map((k) => [k, Math.max(1, counts?.[k] ?? 1)] as [string, number]));
  const unitIdx = (code: string) => S.units.findIndex((u) => u.name.startsWith(code) || u.name.includes(code));

  type Opts = { amount?: number; lit?: boolean; open?: boolean; desc?: string; job?: string; body?: string };
  const addClaim = (ui: number, day: number, cov: string, cat: string, o: Opts = {}) => {
    const unit = S.units[ui];
    const { y } = fromDay(day);
    const yy = String(y).slice(2);
    const prefix = S.idPrefix[cov] ?? "CL";
    seq[prefix + yy] = (seq[prefix + yy] ?? 0) + 1;
    const id = `${prefix}-${yy}-${String(seq[prefix + yy]).padStart(5, "0")}`;
    const lr = r();
    let lag = lr < 0.7 ? Math.floor(r() * 3) : lr < 0.88 ? 3 + Math.floor(r() * 5) : lr < 0.96 ? 8 + Math.floor(r() * 23) : 31 + Math.floor(r() * 60);
    if (unit.late && r() < 0.4) lag += 9 + Math.floor(r() * 20);
    const rep = day + lag;
    if (rep > V) return;
    const [med, sig] = S.sev[`${cov}|${cat}`] ?? [3000, 1];
    let lit = o.lit ?? r() < S.litProb(cov, cat);
    let amt = o.amount ?? Math.exp(Math.log(med) + (sig - 0.15) * normal()) * Math.pow(1.05, y - 2022) * (lag > 7 ? 1.35 : 1) * (lit ? 2.0 : 1);
    if (o.amount == null && r() < 0.06) amt = 0; // record-only or denied
    amt = Math.min(o.amount != null ? 2e6 : 350000, Math.round(amt));
    if (amt > 120000 && o.lit == null && r() < 0.5) lit = true;
    const age = V - day;
    let pOpen = age < 90 ? 0.75 : age < 180 ? 0.55 : age < 365 ? 0.35 : age < 730 ? 0.15 : 0.04;
    if (lit) pOpen = Math.min(0.95, pOpen + 0.35);
    const open = o.open ?? (o.amount != null ? true : r() < pOpen);
    const closeDay = open ? null : Math.min(V, rep + 20 + Math.floor(r() * Math.max(30, Math.min(age, 500))));
    const texts = S.causeTextByCov?.[`${cov}|${cat}`] && r() < 0.7 ? S.causeTextByCov[`${cov}|${cat}`] : S.causeText[cat] ?? ["Other"];
    const details = S.detailByCov?.[`${cov}|${cat}`] ?? S.detail[cat] ?? [""];
    const row: unknown[] = new Array(headers.length).fill("");
    const set = (k: string, v: unknown) => {
      if (col[k] != null) row[col[k]] = v;
    };
    set("claimNumber", id);
    set("location", unit.name);
    set("region", unit.region);
    set("state", unit.state);
    set("coverage", pick(S.covText[cov] ?? [cov]));
    set("lossDate", fmt(day));
    set("reportDate", fmt(rep));
    set("closeDate", closeDay ? fmt(closeDay) : "");
    set("status", open ? (r() < 0.06 ? "Reopened" : "Open") : "Closed");
    set("cause", pick(texts));
    const wc = cov === "WC";
    const blsBody = wc && !S.bodyPart?.pool ? S.osha?.bodyByCat?.[cat] : undefined;
    if (S.bodyPart && S.bodyPart.covs.includes(cov))
      set("bodyPart", o.body ?? (S.bodyPart.pool ? S.bodyPart.pool(ui, r) : blsBody ? BODY_LABEL[byBls(blsBody, BODY_PARTS[mixCode])] ?? "Multiple" : pick(S.bodyPart.byCat[cat] ?? S.bodyPart.byCat.Other ?? ["Multiple"])));
    const blsNature = wc ? S.osha?.natureByCat[cat] : undefined;
    const nature = blsNature ? byBls(blsNature, NATURES[mixCode]) : S.nature?.byCat[cat] ?? "Other";
    if (S.nature && S.nature.covs.includes(cov)) set("injury", nature);
    // OSHA 300 detail for comp claims. Case type odds follow the BLS rates for the industry,
    // tilted by how long that kind of injury usually keeps people off work (BLS median days).
    if (wc) {
      const recordable = amt > 0 && (o.amount != null || r() < REC_P);
      set("recordable", recordable ? "Yes" : "No");
      if (recordable) {
        const tilt = (MEDIAN_DAYS_BY_NATURE[nature] ?? 8) / MEDIAN_DAYS_BY_NATURE.All;
        const type: OshaPick = o.amount != null ? "DAFW" : weighted([["DAFW", (rates.dafw ?? 0) * tilt ** 0.7], ["DJTR", (rates.djtr ?? 0) * tilt ** 0.4], ["Other", rates.other ?? 0]]);
        set("caseType", CASE_TEXT[type]);
        const days = (median: number) => Math.max(1, Math.min(180, age, Math.round(Math.exp(Math.log(median) + 0.9 * normal()))));
        if (type === "DAFW") {
          const away = o.amount != null ? Math.min(180, Math.max(1, age)) : days(mdays.dafw * Math.sqrt(tilt));
          set("daysAway", away);
          if (r() < 0.35) set("daysRestricted", days(mdays.djtr * 0.6));
          amt = Math.round(amt * (o.amount != null ? 1 : SEV_FACTOR.DAFW * (away / (mdays.dafw * Math.sqrt(tilt))) ** 0.35));
        } else if (type === "DJTR") {
          set("daysRestricted", days(mdays.djtr * Math.sqrt(tilt)));
          amt = Math.round(amt * SEV_FACTOR.DJTR);
        } else amt = Math.round(amt * SEV_FACTOR.Other);
      } else if (amt > 0) amt = Math.max(150, Math.round(amt * SEV_FACTOR.None));
      amt = Math.min(o.amount != null ? 2e6 : 350000, amt);
    }
    if (S.jobTitle && S.jobTitle.covs.includes(cov)) {
      const w = S.jobTitle.byCat[cat];
      set("jobTitle", o.job ?? (wc && S.jobTitle.wcValue ? S.jobTitle.wcValue : S.jobTitle.pool ? S.jobTitle.pool(ui, r) : w ? weighted(w) : ""));
    }
    set("claimant", cov === "WC" ? `EE-${10000 + Math.floor(r() * 89999)}` : S.claimant(cov));
    const paid = open ? Math.round(amt * (0.1 + r() * 0.55)) : amt;
    set("paid", paid);
    set("reserve", amt - paid);
    set("incurred", amt);
    set("litigated", lit ? "Y" : "N");
    set("description", o.desc ?? pick(details));
    rows.push(row);
  };

  for (let day = start; day <= V; day++) {
    const { y, m, dow } = fromDay(day);
    const trend = Math.pow(S.trend, y - 2022 + (m - 1) / 12);
    S.units.forEach((u, ui) => {
      if ((u.from && y < u.from) || (u.to && y > u.to)) return;
      const p = ((S.annualPerUnit * u.mult * trend) / 365) * S.dow[dow] * MON[m - 1];
      if (r() < p) {
        const cov = weighted(S.coverageMix);
        addClaim(ui, day, cov, weighted(S.mix[cov]));
      }
    });
  }

  // Planted patterns in the last 12 months, the things a risk manager should catch.
  const L12 = V - 364;
  for (const pl of S.plants) {
    const ui = unitIdx(pl.unit);
    if (ui < 0) continue;
    for (let i = 0; i < pl.n; i++) {
      const cov = Array.isArray(pl.cov) ? pl.cov[i % pl.cov.length] : pl.cov;
      addClaim(ui, L12 + Math.floor(r() * 360), cov, pl.cat, { job: pl.job, body: pl.body });
    }
  }
  for (const lg of S.large) {
    const ui = unitIdx(lg.unit);
    if (ui < 0) continue;
    addClaim(ui, dayNum(...lg.date), lg.cov, lg.cat, { amount: lg.amount, lit: lg.lit, open: true, desc: lg.desc, job: lg.job, body: lg.body });
  }

  const [head, ...body] = rows;
  const lossCol = col.lossDate;
  const key = (row: unknown[]) => {
    const [mm, dd, yyyy] = String(row[lossCol]).split("/").map(Number);
    return dayNum(yyyy, mm, dd);
  };
  body.sort((a, b) => key(a) - key(b));
  return { name: S.sourceName, rows: [head, ...body] };
}

/**
 * Hours worked per location and year for the sample. Built from each location's expected
 * comp recordables so the company runs about 10% above the BLS rate for its industry, with
 * some noise per site and year. The current year is prorated to the valuation date.
 */
export function makeSampleHours(ind: Industry, seed = ind.sample.seed + 7): Table {
  const S = ind.sample;
  const r = rng(seed);
  const rates = blsRate(ind.bls.mix);
  const wcShare = (S.coverageMix.find(([c]) => c === "WC")?.[1] ?? 0) / S.coverageMix.reduce((t, x) => t + x[1], 0);
  const V = SAMPLE_VALUATION;
  const { y: lastYear } = fromDay(V);
  const ytd = (V - dayNum(lastYear, 1, 1) + 1) / 365;
  const rows: unknown[][] = [[...HOURS_HEADERS]];
  S.units.forEach((u) => {
    // Some sites run leaner than others. Offices log lots of hours and few injuries.
    const siteMix = (0.85 + r() * 0.35) * (/office|corporate|headquarters|\bhq\b/i.test(u.name) ? 2.5 : 1);
    for (let y = 2022; y <= lastYear; y++) {
      if ((u.from && y < u.from) || (u.to && y > u.to)) continue;
      const part = y === lastYear ? ytd : 1;
      const claims = S.annualPerUnit * u.mult * Math.pow(S.trend, y - 2022 + 0.5) * part;
      const recordables = claims * wcShare * REC_P * 0.94;
      const hours = Math.round(((recordables * 200000) / (rates.trc * 1.1)) * siteMix * (0.95 + r() * 0.1) / 100) * 100;
      if (hours <= 0) continue;
      rows.push([u.name, y, hours, Math.round(hours / (2000 * part)), ""]);
    }
  });
  return { name: "Hours Worked", rows };
}
