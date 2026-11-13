import PptxGenJS from "pptxgenjs";
import * as XLSX from "xlsx";
import { toBlob } from "html-to-image";
import type { Brand, Claim, Filters } from "./types";
import { BAND_LABEL } from "./types";
import { fieldsFor } from "./fields";
import type { Industry } from "./industries";
import { coverageLabel } from "./industries";
import { makeSampleHours, makeSampleTable } from "./sample";
import { HOURS_HEADERS, fmtRate, type SafetyLocation, type SafetyYear } from "./safety";
import { benchmarkLabel, type Benchmark } from "./bls";
import { OSHA_CASE_LABEL } from "./types";
import { SOII_YEAR, getNaics } from "./naics";
import { SOURCES, isDefault, type Thresholds } from "./thresholds";
import { MONTH_LABELS, fmtDay, fromDay, dayNum } from "./normalize";
import type { ChartTheme } from "./color";
import { deepen, ordinalRamp, seqColor, inkOn, PRIOR } from "./color";
import type { Concern, Kpi, LocationRow } from "./metrics";
import { byYear, categoryCompare, coverageByYear, coverageColor, detailRows, filterSummary, heatGrid, money, num, pct, samePeriod, topClaims, yearsIn } from "./metrics";
import { BAND_STYLE } from "@/components/bands";
import type { Table } from "./parse";

const hx = (h: string) => h.replace("#", "").toUpperCase();
const FONT = "Arial";
const INK = "1C2126";
const MUTED = "5D6570";
const LINE = "E3E6EA";

export interface ExportInput {
  ind: Industry;
  th: Thresholds;
  brand: Brand;
  theme: ChartTheme;
  filters: Filters;
  allClaims: Claim[];
  dims: Claim[];
  filtered: Claim[];
  valuationDay: number;
  kpis: Kpi[];
  locRows: LocationRow[];
  concerns: Concern[];
  sourceName: string;
  isSample: boolean;
  largeAt: number;
  safety?: { rows: SafetyYear[]; locRows: SafetyLocation[]; bench: Benchmark; caseTypes: boolean };
}

function moneyFormat(max: number) {
  if (max >= 1e6) return '$#,##0.0,,"M"';
  if (max >= 1e4) return '$#,##0,"K"';
  return "$#,##0";
}

export async function buildPptx(x: ExportInput): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.author = x.brand.companyName || "Risk management";
  pptx.title = `${x.brand.companyName || x.ind.name} ${x.ind.deck.toLowerCase()}`;
  const U = x.ind.unit;
  const primary = hx(x.brand.primary || x.theme.primary);
  const deep = hx(deepen(x.brand.primary || x.theme.primary));
  const series = x.theme.series.map(hx);
  const company = x.brand.companyName || "Your company";
  const valued = fmtDay(x.valuationDay, "long");
  const years = yearsIn(x.filtered);
  const fsum = filterSummary(x.filters, yearsIn(x.allClaims)) || "All claims";
  const footer = `${company} · ${x.ind.deck} · Valued ${valued}`;

  const logo = x.brand.logo;
  const logoBox = (maxW: number, maxH: number) => {
    if (!logo) return null;
    const r = Math.min(maxW / logo.w, maxH / logo.h);
    return { w: logo.w * r, h: logo.h * r };
  };
  const lb = logoBox(1.5, 0.45);

  pptx.defineSlideMaster({
    title: "BODY",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: 13.333, h: 0.09, fill: { color: primary } } },
      { line: { x: 0.5, y: 6.98, w: 12.33, h: 0, line: { color: LINE, width: 0.75 } } },
      { text: { text: footer, options: { x: 0.5, y: 7.02, w: 10, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED } } },
      ...(logo && lb ? [{ image: { data: logo.dataUrl, x: 12.83 - lb.w, y: 0.3, w: lb.w, h: lb.h } }] : []),
    ],
    slideNumber: { x: 12.4, y: 7.02, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: "right" },
  });

  const head = (s: PptxGenJS.Slide, title: string, sub?: string) => {
    s.addText(title, { x: 0.5, y: 0.32, w: 10.8, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: INK });
    if (sub) s.addText(sub, { x: 0.5, y: 0.9, w: 10.8, h: 0.4, fontFace: FONT, fontSize: 12, color: MUTED });
  };
  const note = (s: PptxGenJS.Slide, text: string) =>
    s.addText(text, { x: 0.5, y: 6.55, w: 12.3, h: 0.35, fontFace: FONT, fontSize: 9, color: MUTED, italic: true });
  const chartBase = {
    fontFace: FONT,
    catAxisLabelColor: MUTED,
    valAxisLabelColor: MUTED,
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 9,
    catAxisLabelFontFace: FONT,
    valAxisLabelFontFace: FONT,
    valGridLine: { color: LINE, size: 0.75 },
    catGridLine: { style: "none" as const },
    catAxisLineShow: true,
    catAxisLineColor: "CDD1D7",
    valAxisLineShow: false,
    dataLabelColor: INK,
    dataLabelFontSize: 9,
    dataLabelFontFace: FONT,
    legendFontFace: FONT,
    legendFontSize: 10,
    legendColor: MUTED,
  };

  /* 1. Title */
  {
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.42, h: 7.5, fill: { color: deep } });
    const big = logoBox(3.2, 1.2);
    if (logo && big) s.addImage({ data: logo.dataUrl, x: 1.1, y: 1.0, w: big.w, h: big.h });
    s.addText(company, { x: 1.1, y: 2.55, w: 11, h: 1.0, fontFace: FONT, fontSize: 40, bold: true, color: INK });
    s.addText(x.ind.deck, { x: 1.1, y: 3.45, w: 11, h: 0.6, fontFace: FONT, fontSize: 22, color: hx(x.theme.series[1] ?? x.theme.primary) });
    s.addText(
      [
        { text: `Loss years ${years[0] ?? ""}${years.length > 1 ? `–${years[years.length - 1]}` : ""} · valued ${valued}`, options: { breakLine: true } },
        { text: `Scope: ${fsum}`, options: { breakLine: true } },
        { text: `${num(x.filtered.length)} claims · ${money(x.filtered.reduce((a, c) => a + c.incurred, 0))} incurred` },
      ],
      { x: 1.1, y: 4.3, w: 11, h: 1.2, fontFace: FONT, fontSize: 13, color: MUTED, paraSpaceAfter: 4 },
    );
    s.addText(x.isSample ? "Synthetic sample data. Not a real company." : `Source: ${x.sourceName}`, { x: 1.1, y: 6.7, w: 11, h: 0.35, fontFace: FONT, fontSize: 10, color: MUTED });
  }

  /* 2. KPIs */
  {
    const s = pptx.addSlide({ masterName: "BODY" });
    head(s, "Key metrics", fsum);
    x.kpis.forEach((k, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const X = 0.5 + col * 4.15;
      const Y = 1.5 + row * 2.45;
      s.addShape(pptx.ShapeType.roundRect, { x: X, y: Y, w: 3.95, h: 2.25, fill: { color: "F5F6F8" }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08 });
      s.addText(k.label.toUpperCase(), { x: X + 0.25, y: Y + 0.18, w: 3.5, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: MUTED, charSpacing: 1 });
      s.addText(k.value, { x: X + 0.25, y: Y + 0.5, w: 3.5, h: 0.75, fontFace: FONT, fontSize: 32, bold: true, color: INK });
      s.addText(k.sub, { x: X + 0.25, y: Y + 1.22, w: 3.5, h: 0.35, fontFace: FONT, fontSize: 11, color: MUTED });
      if (k.delta) s.addText(k.delta, { x: X + 0.25, y: Y + 1.55, w: 2.5, h: 0.5, fontFace: FONT, fontSize: 10, color: INK, valign: "top" });
      if (k.band != null) {
        const b = BAND_STYLE[k.band];
        s.addShape(pptx.ShapeType.roundRect, { x: X + 2.85, y: Y + 1.62, w: 0.9, h: 0.3, fill: { color: hx(b.bg) }, line: { color: hx(b.bg) }, rectRadius: 0.15 });
        s.addText(BAND_LABEL[k.band], { x: X + 2.85, y: Y + 1.62, w: 0.9, h: 0.3, fontFace: FONT, fontSize: 9, bold: true, color: hx(b.fg), align: "center", valign: "middle" });
      }
    });
    note(s, `Changes compare the same calendar window in each year so a partial year isn't compared with a full one. Litigation compares the last 12 months with the 12 before.`);
  }

  /* 3. Claims and incurred by year */
  {
    const s = pptx.addSlide({ masterName: "BODY" });
    head(s, "Claims and incurred by loss year", fsum);
    const yr = byYear(x.filtered, years, x.valuationDay);
    const labels = yr.map((r) => r.label);
    s.addText("Claim count", { x: 0.5, y: 1.4, w: 6, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: INK });
    s.addChart(pptx.ChartType.bar, [{ name: "Claims", labels, values: yr.map((r) => r.count) }], {
      ...chartBase, x: 0.4, y: 1.75, w: 6.1, h: 4.7, barDir: "col", chartColors: [series[0]], barGapWidthPct: 70, showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0", valAxisLabelFormatCode: "#,##0",
    });
    const maxInc = Math.max(0, ...yr.map((r) => r.incurred));
    s.addText("Total incurred", { x: 6.9, y: 1.4, w: 6, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: INK });
    s.addChart(pptx.ChartType.bar, [{ name: "Incurred", labels, values: yr.map((r) => Math.round(r.incurred)) }], {
      ...chartBase, x: 6.8, y: 1.75, w: 6.1, h: 4.7, barDir: "col", chartColors: [series[0]], barGapWidthPct: 70, showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: moneyFormat(maxInc), valAxisLabelFormatCode: moneyFormat(maxInc),
    });
    note(s, "Grouped by date of loss. The current year is partial (YTD). Recent incurred keeps developing as claims mature.");
  }

  /* 4. Same-period monthly comparison */
  {
    const { y: vy, m: vm } = fromDay(x.valuationDay);
    const ys = [vy - 2, vy - 1, vy].filter((y) => years.includes(y));
    if (ys.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      head(s, "Month by month, year over year", `Claims by month of loss, January through ${MONTH_LABELS[vm - 1]}`);
      const ramp = ordinalRamp(x.theme.primary, ys.length).map(hx);
      const labels = MONTH_LABELS.slice(0, vm);
      const data = ys.map((y) => ({ name: y === vy ? `${y} YTD` : String(y), labels, values: labels.map((_, mi) => x.filtered.filter((c) => c.lossYear === y && c.lossMonth === mi).length) }));
      s.addChart(pptx.ChartType.bar, data, { ...chartBase, x: 0.4, y: 1.45, w: 12.5, h: 5.0, barDir: "col", barGrouping: "clustered", chartColors: ramp, barGapWidthPct: 60, showLegend: true, legendPos: "t", valAxisLabelFormatCode: "#,##0" });
      const sp = samePeriod(x.filtered, x.valuationDay);
      note(s, `${sp.year} ${sp.label}: ${num(sp.cur.length)} claims vs ${num(sp.prior.length)} in ${sp.year - 1} (${pct(sp.prior.length ? sp.cur.length / sp.prior.length - 1 : null)}).`);
    }
  }

  /* 5. Coverage */
  {
    const s = pptx.addSlide({ masterName: "BODY" });
    head(s, "Incurred by line of coverage", fsum);
    const { rows, present } = coverageByYear(x.filtered, years, x.valuationDay, "incurred", x.ind);
    const labels = rows.map((r) => String(r.label));
    const data = present.map((cv) => ({ name: coverageLabel(x.ind, cv), labels, values: rows.map((r) => Number(r[cv]) || 0) }));
    const max = Math.max(0, ...rows.map((r) => present.reduce((a, cv) => a + (Number(r[cv]) || 0), 0)));
    if (data.length)
      s.addChart(pptx.ChartType.bar, data, { ...chartBase, x: 0.4, y: 1.45, w: 12.5, h: 5.0, barDir: "col", barGrouping: "stacked", chartColors: present.map((cv) => hx(coverageColor(x.theme.series, cv, x.ind))), barGapWidthPct: 60, showLegend: true, legendPos: "t", valAxisLabelFormatCode: moneyFormat(max) });
    note(s, "Stacked by line. Current year is partial.");
  }

  /* 6. Causes */
  {
    const cc = categoryCompare(x.dims, x.valuationDay, 10);
    if (cc.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      head(s, "Top causes of loss", "Last 12 months compared with the 12 months before");
      const rev = [...cc].reverse(); // bar charts plot the first category at the bottom
      const labels = rev.map((c) => c.category);
      s.addChart(
        pptx.ChartType.bar,
        [
          { name: "Prior 12 months", labels, values: rev.map((c) => c.prior) },
          { name: "Last 12 months", labels, values: rev.map((c) => c.current) },
        ],
        { ...chartBase, x: 0.4, y: 1.45, w: 8.4, h: 5.0, barDir: "bar", barGrouping: "clustered", chartColors: [hx(PRIOR), series[0]], barGapWidthPct: 50, showLegend: true, legendPos: "t", showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 8 },
      );
      const rows: PptxGenJS.TableRow[] = [
        [
          { text: "Cause", options: { bold: true, color: MUTED } },
          { text: "Change", options: { bold: true, color: MUTED, align: "right" } },
        ],
        ...cc.map((c) => [
          { text: c.category, options: { color: INK } },
          { text: pct(c.change), options: { color: c.change != null && c.change > 0.05 ? "B42318" : INK, align: "right" as const, bold: c.change != null && c.change > 0.25 } },
        ]),
      ];
      s.addTable(rows, { x: 9.1, y: 1.6, w: 3.8, colW: [2.6, 1.2], fontFace: FONT, fontSize: 10, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.3 });
      note(s, `Causes are grouped from carrier cause codes and loss descriptions into common ${x.ind.name.toLowerCase()} categories.`);
    }
  }

  /* 6b. Industry detail charts (body part, trade, drivers, units, claimant type) */
  {
    const charts = x.ind.details.map((d) => ({ d, rows: detailRows(x.filtered, x.dims, x.valuationDay, d) })).filter((c) => c.rows.length);
    if (charts.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      head(s, "Details", fsum);
      charts.slice(0, 2).forEach(({ d, rows }, i) => {
        const X = 0.4 + i * 6.4;
        s.addText(d.title, { x: X + 0.1, y: 1.35, w: 6, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: INK });
        s.addText(d.subtitle, { x: X + 0.1, y: 1.68, w: 6, h: 0.3, fontFace: FONT, fontSize: 10, color: MUTED });
        const rev = [...rows].reverse();
        s.addChart(pptx.ChartType.bar, [{ name: "Claims", labels: rev.map((r) => r.name), values: rev.map((r) => r.count) }], {
          ...chartBase, x: X, y: 2.05, w: 6.1, h: 4.4, barDir: "bar", chartColors: [series[0]], barGapWidthPct: 45, showValue: true, dataLabelPosition: "outEnd", valAxisHidden: true, valGridLine: { style: "none" },
        });
      });
    }
  }

  /* 7. Heat grid */
  {
    const hg = heatGrid(x.filtered, 12, 7);
    if (hg.locs.length && hg.cats.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      head(s, "Where claims come from", `Claim count by ${U.one} and cause, busiest ${U.many} first`);
      const header: PptxGenJS.TableRow = [{ text: U.One, options: { bold: true, color: MUTED, fontSize: 9 } }, ...hg.cats.map((c) => ({ text: c, options: { bold: true, color: MUTED, fontSize: 8, align: "center" as const } }))];
      const rows: PptxGenJS.TableRow[] = [
        header,
        ...hg.locs.map((loc, i) => [
          { text: loc, options: { color: INK, fontSize: 9 } },
          ...hg.cells[i].map((v) => {
            const bg = v ? seqColor(x.theme.primary, v / hg.max) : "#FFFFFF";
            return { text: v ? String(v) : "", options: { fill: { color: hx(bg) }, color: hx(inkOn(bg)), align: "center" as const, fontSize: 10, bold: v / hg.max > 0.6 } };
          }),
        ]),
      ];
      const colW = [3.2, ...hg.cats.map(() => (12.3 - 3.2) / hg.cats.length)];
      s.addTable(rows, { x: 0.5, y: 1.45, w: 12.3, colW, fontFace: FONT, border: { type: "solid", pt: 1, color: "FFFFFF" }, rowH: 0.36 });
      note(s, `Darker cells mean more claims. Use it to spot one ${U.one} carrying one problem.`);
    }
  }

  /* 8. Watch list */
  {
    const s = pptx.addSlide({ masterName: "BODY" });
    head(s, `${U.One} watch list`, `Ranked by risk signals in the last 12 months, valued ${valued}`);
    const top = x.locRows.slice(0, 12);
    const H = (t: string, align: "left" | "right" | "center" = "left") => ({ text: t, options: { bold: true, color: MUTED, fontSize: 9, align } });
    const rows: PptxGenJS.TableRow[] = [
      [H(U.One), H("Region"), H("Last 12", "right"), H("Prior 12", "right"), H("Change", "right"), H("Incurred", "right"), H("Open", "right"), H("Top cause"), H("Band", "center"), H("Why")],
      ...top.map((r) => {
        const b = BAND_STYLE[r.band];
        return [
          { text: r.location, options: { color: INK, bold: true } },
          { text: r.region, options: { color: MUTED } },
          { text: String(r.l12), options: { align: "right" as const } },
          { text: String(r.p12), options: { align: "right" as const, color: MUTED } },
          { text: pct(r.change), options: { align: "right" as const, color: r.change != null && r.change > 0.25 ? "B42318" : INK } },
          { text: money(r.incurred), options: { align: "right" as const } },
          { text: String(r.open), options: { align: "right" as const } },
          { text: r.topCause ? `${r.topCause} (${r.topCauseN})` : "", options: { color: MUTED } },
          { text: BAND_LABEL[r.band], options: { align: "center" as const, bold: true, color: hx(b.fg), fill: { color: hx(b.bg) } } },
          { text: r.flags.slice(0, 2).join("; "), options: { color: MUTED, fontSize: 8 } },
        ];
      }),
    ];
    s.addTable(rows, { x: 0.5, y: 1.4, w: 12.3, colW: [2.2, 0.9, 0.7, 0.75, 0.75, 1.0, 0.55, 1.9, 0.85, 2.7], fontFace: FONT, fontSize: 9, color: INK, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.36, valign: "middle" });
    note(s, `Signals: frequency vs the average ${U.one}, year-over-year change, incurred vs average, large losses, open litigation, repeat causes, and report lag.`);
  }

  /* 8b. Safety rates, when the loss run had OSHA detail and hours */
  {
    const sf = x.safety;
    const rated = sf?.rows.filter((r) => r.trir != null) ?? [];
    if (sf && rated.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      const b = sf.bench;
      const vsName = b.kind === "custom" ? "Target" : "BLS avg";
      head(s, "Safety rates vs industry", `Per 200,000 hours worked. Compared with ${benchmarkLabel(b)}`);
      const labels = rated.map((r) => r.label);
      const last = rated[rated.length - 1];
      const tiles: [string, number | null, number | null][] = [
        ["TRIR", last.trir, b.trc],
        ...(sf.caseTypes ? ([["DART", last.dart, b.dart], ["Days-away rate", last.dafwRate, b.dafw]] as [string, number | null, number | null][]) : []),
      ];
      tiles.forEach(([label, v, bv], i) => {
        const y = 1.5 + i * 1.05;
        s.addShape(pptx.ShapeType.roundRect, { x: 0.5, y, w: 3.4, h: 0.9, fill: { color: "F7F8F9" }, line: { color: LINE, width: 0.75 }, rectRadius: 0.08 });
        s.addText(label.toUpperCase(), { x: 0.65, y: y + 0.06, w: 3.1, h: 0.25, fontFace: FONT, fontSize: 9, bold: true, color: MUTED });
        s.addText(fmtRate(v), { x: 0.65, y: y + 0.3, w: 1.4, h: 0.5, fontFace: FONT, fontSize: 24, bold: true, color: INK });
        s.addText(bv != null ? `${last.label}\n${vsName} ${bv.toFixed(1)}${v != null && bv > 0 ? ` (${pct(v / bv - 1)})` : ""}` : last.label, { x: 2.0, y: y + 0.28, w: 1.85, h: 0.55, fontFace: FONT, fontSize: 9.5, color: MUTED });
      });
      const ref = (val: number | null, n: number) => (val == null ? [] : [{ type: pptx.ChartType.line, data: [{ name: vsName, labels, values: Array(n).fill(val) }], options: { chartColors: ["3C434C"], lineSize: 1.5, lineDash: "dash" as const, lineDataSymbol: "none" as const } }]);
      s.addText("TRIR by loss year", { x: 4.3, y: 1.4, w: 8, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: INK });
      // Combo chart (bars + dashed benchmark line). pptxgenjs takes (types[], options) for combos.
      (s.addChart as unknown as (t: unknown[], o: object) => void)(
        [{ type: pptx.ChartType.bar, data: [{ name: "TRIR", labels, values: rated.map((r) => Math.round(r.trir! * 100) / 100) }], options: { chartColors: [series[0]], barGapWidthPct: 70, showValue: true, dataLabelPosition: "outEnd" as const, dataLabelFormatCode: "0.00" } }, ...ref(b.trc, labels.length)],
        { ...chartBase, x: 4.2, y: 1.75, w: 8.7, h: sf.locRows.length ? 2.6 : 4.6, showLegend: true, legendPos: "t", valAxisLabelFormatCode: "0.0", valAxisMinVal: 0 },
      );
      if (sf.locRows.length) {
        const H = (t: string, align: "left" | "right" | "center" = "left") => ({ text: t, options: { bold: true, color: MUTED, fontSize: 9, align } });
        const rows: PptxGenJS.TableRow[] = [
          [H(U.One), H("Recordables", "right"), H("Hours", "right"), H("TRIR", "right"), H("DART", "right"), H("Level", "center")],
          ...sf.locRows.slice(0, 6).map((r) => {
            const st = BAND_STYLE[r.band];
            return [
              { text: r.location, options: { bold: true, color: INK } },
              { text: num(r.recordable), options: { align: "right" as const } },
              { text: num(Math.round(r.hours)), options: { align: "right" as const, color: MUTED } },
              { text: fmtRate(r.trir), options: { align: "right" as const, bold: true } },
              { text: fmtRate(r.dartRate), options: { align: "right" as const } },
              { text: BAND_LABEL[r.band], options: { align: "center" as const, bold: true, color: hx(st.fg), fill: { color: hx(st.bg) } } },
            ];
          }),
        ];
        s.addTable(rows, { x: 4.3, y: 4.5, w: 8.5, colW: [3.0, 1.1, 1.3, 0.9, 0.9, 1.3], fontFace: FONT, fontSize: 9, color: INK, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.28, valign: "middle" });
      }
      note(s, `Rate = cases x 200,000 / hours worked. ${b.kind === "custom" ? "Target set by the user." : `BLS ${SOII_YEAR} national average, all employer sizes.`} The current year is partial (YTD).${rated.some((r) => r.estimated) ? " Some hours estimated from average employees x 2,000." : ""}`);
    }
  }

  /* 9. Findings */
  {
    const list = x.concerns.slice(0, 6);
    if (list.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      head(s, "What needs attention", "Generated from the data; review before sharing");
      list.forEach((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const X = 0.5 + col * 6.2;
        const Y = 1.4 + row * 1.72;
        const b = BAND_STYLE[c.band];
        s.addShape(pptx.ShapeType.rect, { x: X, y: Y, w: 6.0, h: 1.58, fill: { color: "FFFFFF" }, line: { color: LINE, width: 0.75 } });
        s.addShape(pptx.ShapeType.rect, { x: X, y: Y, w: 0.08, h: 1.58, fill: { color: hx(b.fg) }, line: { color: hx(b.fg) } });
        s.addText(BAND_LABEL[c.band].toUpperCase(), { x: X + 0.25, y: Y + 0.08, w: 2, h: 0.25, fontFace: FONT, fontSize: 8, bold: true, color: hx(b.fg), charSpacing: 1 });
        s.addText(c.title, { x: X + 0.25, y: Y + 0.3, w: 5.6, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: INK, fit: "shrink" });
        s.addText(c.detail, { x: X + 0.25, y: Y + 0.68, w: 5.6, h: 0.4, fontFace: FONT, fontSize: 9, color: MUTED, valign: "top", fit: "shrink" });
        s.addText(`Next step: ${c.action}`, { x: X + 0.25, y: Y + 1.05, w: 5.6, h: 0.48, fontFace: FONT, fontSize: 9, color: INK, valign: "top", fit: "shrink" });
      });
    }
  }

  /* 10. Large losses */
  {
    const big = topClaims(x.filtered, 10);
    if (big.length) {
      const s = pptx.addSlide({ masterName: "BODY" });
      head(s, "Largest claims", fsum);
      const H = (t: string, align: "left" | "right" | "center" = "left") => ({ text: t, options: { bold: true, color: MUTED, fontSize: 9, align } });
      const rows: PptxGenJS.TableRow[] = [
        [H("Claim"), H(U.One), H("Loss date"), H("Line"), H("Cause"), H("Status"), H("Litigated", "center"), H("Paid", "right"), H("Reserve", "right"), H("Incurred", "right")],
        ...big.map((c) => [
          { text: c.id, options: { bold: true } },
          { text: c.location },
          { text: fmtDay(c.lossDay) },
          { text: c.coverage },
          { text: c.category },
          { text: c.status, options: { color: c.status === "Open" ? "9A5B00" : MUTED } },
          { text: c.litigated ? "Yes" : "", options: { align: "center" as const, color: "B42318", bold: true } },
          { text: money(c.paid, false), options: { align: "right" as const } },
          { text: money(c.reserve, false), options: { align: "right" as const } },
          { text: money(c.incurred, false), options: { align: "right" as const, bold: true } },
        ]),
      ];
      s.addTable(rows, { x: 0.5, y: 1.4, w: 12.3, colW: [1.25, 2.2, 0.95, 0.85, 1.85, 0.75, 0.8, 1.2, 1.2, 1.25], fontFace: FONT, fontSize: 9, color: INK, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.38, valign: "middle" });
      note(s, "Claimant names are left out on purpose.");
    }
  }

  /* 11. Notes */
  {
    const s = pptx.addSlide({ masterName: "BODY" });
    head(s, "Notes and definitions");
    const lines = [
      `Source: ${x.isSample ? "synthetic sample data (not a real company)" : x.sourceName}. ${num(x.allClaims.length)} claims loaded; ${num(x.filtered.length)} in this view.`,
      `Scope: ${fsum}.`,
      `Valued as of ${valued}. Loss year = calendar year of the date of loss.`,
      "Incurred = paid + outstanding reserve. Recent years are less developed and usually grow.",
      "Same-period change compares January 1 through the valuation date in each year.",
      "Last 12 months = the 365 days ending on the valuation date; prior 12 = the 365 days before that.",
      `Large loss = incurred of ${money(x.largeAt, false)} or more.`,
      `Levels: ${BAND_LABEL.join(", ")}. ${isDefault(x.th) ? "Default starting points were used." : "Custom levels were set by the user."} Same-period change cut points: ${x.th.changeBands.join(", ")}%. Report lag cut points: ${x.th.lagBands.join(", ")} days.`,
      `Report-lag defaults follow published research: ${SOURCES.threeDay.short} (3-day standard), ${SOURCES.hartford.short} and ${SOURCES.ncci.short}. Other defaults are template starting points, not industry benchmarks.`,
      "Cause categories are grouped automatically from carrier cause codes and descriptions; spot-check before external use.",
    ];
    s.addText(
      lines.map((t) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: true } })),
      { x: 0.5, y: 1.3, w: 12.3, h: 5.2, fontFace: FONT, fontSize: 13, color: INK, paraSpaceAfter: 8, valign: "top" },
    );
  }

  return (await pptx.write({ outputType: "blob" })) as Blob;
}

/* ---------------- PNG ---------------- */

function fontCss() {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) if (rule instanceof CSSFontFaceRule) css += rule.cssText + "\n";
    } catch {
      /* cross-origin sheet */
    }
  }
  return css;
}

export async function nodeToPng(node: HTMLElement, background = "#f5f6f8"): Promise<Blob> {
  // Hide buttons and filters in the live page so the layout closes up, then draw.
  const root = document.documentElement;
  root.classList.add("exporting");
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  try {
    const blob = await toBlob(node, {
      pixelRatio: 2,
      backgroundColor: background,
      cacheBust: false,
      fontEmbedCSS: fontCss(),
      filter: (n) => !(n instanceof HTMLElement && n.dataset && n.dataset.exportIgnore !== undefined),
    });
    if (!blob) throw new Error("Could not draw the image.");
    return blob;
  } finally {
    root.classList.remove("exporting");
  }
}

/* ---------------- Excel ---------------- */

const wbBlob = (wb: XLSX.WorkBook) => new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
const toDate = (n: number | null) => {
  if (n == null) return "";
  const { y, m, d } = fromDay(n);
  return new Date(y, m - 1, d);
};

export function filteredClaimsXlsx(claims: Claim[], ind: Industry) {
  const F = fieldsFor(ind);
  const lab = (k: string) => F.find((f) => f.key === k)?.header ?? k;
  const rows = claims.map((c) => ({
    "Claim Number": c.id,
    [lab("location")]: c.location,
    Region: c.region,
    State: c.state,
    Line: c.coverage,
    "Date of Loss": toDate(c.lossDay),
    "Date Reported": toDate(c.reportDay),
    "Days to Report": c.lagDays ?? "",
    Status: c.status,
    "Loss Category": c.category,
    "Cause (as reported)": c.causeRaw,
    [lab("bodyPart")]: c.bodyPart,
    [lab("jobTitle")]: c.jobTitle,
    Paid: Math.round(c.paid * 100) / 100,
    Reserve: Math.round(c.reserve * 100) / 100,
    Incurred: Math.round(c.incurred * 100) / 100,
    Litigated: c.litigated ? "Y" : "N",
    Description: c.description,
    "OSHA Recordable": c.recordable == null ? "" : c.recordable ? "Yes" : "No",
    "OSHA Case Type": c.caseType ? OSHA_CASE_LABEL[c.caseType] : "",
    "Days Away From Work": c.daysAway ?? "",
    "Days Restricted or Transferred": c.daysRestricted ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true, dateNF: "mm/dd/yyyy" });
  ws["!cols"] = [14, 26, 10, 6, 8, 12, 12, 8, 8, 24, 30, 12, 16, 12, 12, 12, 8, 50, 10, 22, 10, 12].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Claims");
  return wbBlob(wb);
}

export function templateXlsx(ind: Industry) {
  const fields = fieldsFor(ind);
  const sample = sampleRows(makeSampleTable(ind), ind);
  // Three example rows: the first claim of three different lines where possible.
  const covCol = fields.findIndex((f) => f.key === "coverage");
  const seen = new Set<string>();
  const covKey = (text: string) => Object.entries(ind.sample.covText).find(([, list]) => list.includes(text))?.[0] ?? text;
  const examples = sample.slice(1).filter((r) => {
    const k = covKey(String(r[covCol]));
    if (seen.has(k) || seen.size >= 3) return false;
    seen.add(k);
    return true;
  });
  const ws = XLSX.utils.aoa_to_sheet([sample[0], ...examples], { cellDates: true, dateNF: "mm/dd/yyyy" });
  ws["!cols"] = fields.map((f) => ({ wch: f.key === "description" ? 46 : f.key === "cause" ? 32 : f.key === "location" ? 26 : 14 }));
  const guide = [
    ["Column", "Needed?", "What it's for", "Example"],
    ...fields.map((f) => [f.header ?? f.label, f.required ? "Required" : f.key === "incurred" ? "Required (or Paid + Reserve)" : "Optional", f.help, f.example]),
    [],
    ["Tips", "", "Header names don't have to match. The dashboard recognizes common carrier and TPA names (\"DOL\", \"Total Incurred\", \"Medical Paid\"...). Title rows above the headers are fine.", ""],
    ["", "", "One row per claim works best. Feature-level runs (one row per BI/PD or med/indemnity) are merged by claim number.", ""],
    ["", "", "Accepted files: .xlsx, .xls, .csv, or a Word .docx with the loss run as a table. Google Sheets: File > Download > .xlsx.", ""],
    ["", "", "The example rows are synthetic sample data. Delete them before adding your own claims.", ""],
    [],
    ["Safety rates (optional)", "", "Fill in the four OSHA columns and the Hours Worked sheet and the dashboard works out your TRIR and DART and compares them with the BLS average for your industry.", ""],
    ["TRIR", "", "Recordable cases x 200,000 / hours worked. 200,000 hours = 100 people working full time for a year.", ""],
    ["DART", "", "(Days-away cases + job transfer or restriction cases) x 200,000 / hours worked.", ""],
    ["Hours Worked sheet", "", "One row per year, or per location per year. Leave Location blank for a company total. Use line 19a of the OSHA 300A, or average employees (counted as 2,000 hours each).", ""],
    ["NAICS Code", "", `Optional. Your industry code, so the dashboard compares you with the right BLS ${SOII_YEAR} average. You can also type it in the Safety section.`, ind.bls.default],
  ];
  const wg = XLSX.utils.aoa_to_sheet(guide);
  wg["!cols"] = [{ wch: 24 }, { wch: 26 }, { wch: 80 }, { wch: 36 }];
  const nm = getNaics(ind.bls.default)?.name ?? "";
  const hrs = XLSX.utils.aoa_to_sheet([
    [...HOURS_HEADERS],
    ["", 2024, 210000, 105, ind.bls.default],
    ["", 2025, 224000, 112, ""],
    [ind.sample.units[0]?.name ?? "Location 1", 2025, 61000, 31, ""],
    [],
    [`Example rows. Replace with yours. Blank Location = company total. NAICS ${ind.bls.default} is ${nm}.`],
  ]);
  hrs["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Loss Run");
  XLSX.utils.book_append_sheet(wb, hrs, "Hours Worked");
  XLSX.utils.book_append_sheet(wb, wg, "Field Guide");
  return wbBlob(wb);
}

/** Sample table rows with the date columns turned into real Excel dates. */
function sampleRows(t: Table, ind: Industry) {
  const fields = fieldsFor(ind);
  const dateCols = new Set(fields.map((f, i) => (f.key.endsWith("Date") ? i : -1)).filter((i) => i >= 0));
  return t.rows.map((r, i) =>
    i === 0
      ? r
      : r.map((v, j) => {
          if (dateCols.has(j) && typeof v === "string" && v) {
            const [mm, dd, yy] = v.split("/").map(Number);
            return toDate(dayNum(yy, mm, dd));
          }
          return v;
        }),
  );
}

export function sampleXlsx(t: Table, ind: Industry) {
  const ws = XLSX.utils.aoa_to_sheet([[`${ind.sample.company}: loss run (synthetic data, not a real company)`], [], ...sampleRows(t, ind)], { cellDates: true, dateNF: "mm/dd/yyyy" });
  ws["!cols"] = fieldsFor(ind).map((f) => ({ wch: f.key === "description" ? 50 : f.key === "cause" ? 34 : f.key === "location" ? 28 : 14 }));
  const hrs = XLSX.utils.aoa_to_sheet(makeSampleHours(ind).rows);
  hrs["!cols"] = [{ wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Loss Run");
  XLSX.utils.book_append_sheet(wb, hrs, "Hours Worked");
  return wbBlob(wb);
}
