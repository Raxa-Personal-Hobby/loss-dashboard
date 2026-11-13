// Color math for brand-driven charts. CVD simulation and OKLab Delta E follow the
// data-viz validator (Machado 2009 severity 1.0, OKLab x100), so brand palettes are
// checked the same way the reference palette was.

type RGB = [number, number, number];

export const isHex = (v: string) => /^#?[0-9a-fA-F]{6}$/.test(v.trim());
export const normHex = (v: string) => {
  let h = v.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  return isHex(h) ? `#${h.toLowerCase()}` : null;
};

const hex2srgb = (h: string): RGB => {
  const s = h.replace(/^#/, "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255) as RGB;
};
const s2lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lin2s = (c: number) => {
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
const lin = (h: string) => hex2srgb(h).map(s2lin) as RGB;
const toHex = (rgb: RGB) => "#" + rgb.map((c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0")).join("");

const relLum = (h: string) => {
  const [r, g, b] = lin(h);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function oklabFromLin([r, g, b]: RGB): RGB {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function linFromOklab([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
export const oklch = (h: string): RGB => {
  const [L, a, b] = oklabFromLin(lin(h));
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
};
const inGamut = (rgb: RGB) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);
/** OKLCH to hex, pulling chroma in until the color fits sRGB. */
export function fromOklch(L: number, C: number, H: number) {
  const hr = (H * Math.PI) / 180;
  let c = C;
  for (let i = 0; i < 40; i++) {
    const rgb = linFromOklab([L, c * Math.cos(hr), c * Math.sin(hr)]);
    if (inGamut(rgb)) return toHex(rgb.map(lin2s) as RGB);
    c *= 0.93;
  }
  return toHex(linFromOklab([L, 0, 0]).map(lin2s) as RGB);
}

const MACHADO: Record<"protan" | "deutan", number[][]> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};
const simulate = (h: string, kind: "protan" | "deutan"): RGB => {
  const [r, g, b] = lin(h);
  const M = MACHADO[kind];
  const cl = (c: number) => Math.max(0, Math.min(1, c));
  return [cl(M[0][0] * r + M[0][1] * g + M[0][2] * b), cl(M[1][0] * r + M[1][1] * g + M[1][2] * b), cl(M[2][0] * r + M[2][1] * g + M[2][2] * b)];
};
export function deltaE(a: string, b: string, kind?: "protan" | "deutan") {
  const x = oklabFromLin(kind ? simulate(a, kind) : lin(a));
  const y = oklabFromLin(kind ? simulate(b, kind) : lin(b));
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}
const cvdMin = (a: string, b: string) => Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan"));

export function mix(a: string, b: string, t: number) {
  const x = hex2srgb(a);
  const y = hex2srgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t) as RGB);
}

/** Validated reference categorical order (dataviz skill, light mode). */
export const DEFAULT_SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
export const NEUTRAL = "#9aa0a8";
export const PRIOR = "#c3c8d0";

/** Move a brand color into the light-mode series band. Returns null if it is too gray to work as a series. */
export function fitSeries(hex: string) {
  const [L, C, H] = oklch(hex);
  if (C < 0.06) return null;
  const L2 = Math.min(0.68, Math.max(0.46, L));
  const C2 = Math.max(C, 0.1);
  return fromOklch(L2, C2, H);
}

export interface ChartTheme {
  series: string[]; // categorical, validated adjacent-pair order
  primary: string; // series slot 1
  notes: string[];
  usedBrand: boolean[];
}

export function buildTheme(primary: string, accent: string): ChartTheme {
  const chosen: string[] = [];
  const notes: string[] = [];
  const usedBrand = [false, false];
  const fits = (c: string, floor = 20) => {
    const last = chosen[chosen.length - 1];
    if (last && (cvdMin(last, c) < 8 || deltaE(last, c) < 15)) return false;
    return chosen.every((p) => deltaE(p, c) >= floor && cvdMin(p, c) >= 6);
  };
  [primary, accent].forEach((b, i) => {
    const h = normHex(b || "");
    if (!h) return;
    const f = fitSeries(h);
    if (!f) {
      notes.push(`${i === 0 ? "Primary" : "Accent"} ${h} is close to gray, so charts use a standard color in its place.`);
      return;
    }
    if (fits(f)) {
      chosen.push(f);
      usedBrand[i] = true;
      if (deltaE(f, h) > 6) notes.push(`${i === 0 ? "Primary" : "Accent"} was lightened or deepened a little so chart marks stay readable.`);
    } else notes.push(`Accent is too close to the primary for color-blind readers, so charts swap in a standard color.`);
  });
  // Fill from the validated reference order, relaxing the all-pairs floor only if needed.
  for (const floor of [20, 16, 12]) {
    for (const d of DEFAULT_SERIES) {
      if (chosen.length >= 6) break;
      if (!chosen.includes(d) && fits(d, floor)) chosen.push(d);
    }
  }
  while (chosen.length < 6) {
    const rest = DEFAULT_SERIES.filter((d) => !chosen.includes(d));
    if (!rest.length) break;
    const score = (d: string) => Math.min(...chosen.map((p) => deltaE(p, d)));
    chosen.push(rest.sort((a, b) => score(b) - score(a))[0]);
  }
  return { series: chosen, primary: chosen[0], notes, usedBrand };
}

/** Ordered steps for years: oldest lightest, newest = base. Lightest step keeps >= 2:1 on white. */
export function ordinalRamp(base: string, n: number) {
  if (n <= 1) return [base];
  const [L0, C0, H] = oklch(base);
  const Lnew = Math.min(L0, 0.55);
  let Lmax = Lnew;
  for (let L = Lnew; L <= 0.9; L += 0.005) {
    if (contrast(fromOklch(L, C0 * 0.7, H), "#ffffff") < 2.05) break;
    Lmax = L;
  }
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = (n - 1 - i) / (n - 1); // 1 for oldest
    out.push(fromOklch(Lnew + (Lmax - Lnew) * t, C0 * (1 - 0.35 * t), H));
  }
  return out;
}

/** Single-hue sequential ramp for heat grids: near-white to deep. */
export function seqColor(base: string, t: number) {
  const [, C, H] = oklch(base);
  const L = 0.97 - 0.57 * t;
  return fromOklch(L, Math.max(0.015, C * (0.15 + 0.85 * t)), H);
}
export const inkOn = (bg: string) => (contrast(bg, "#1c2126") >= contrast(bg, "#ffffff") ? "#1c2126" : "#ffffff");

/** Darken until white text passes 4.5:1, for the sidebar and title bars. */
export function deepen(hex: string) {
  let [L, C, H] = oklch(hex);
  let out = hex;
  for (let i = 0; i < 40 && contrast(out, "#ffffff") < 7; i++) {
    L -= 0.02;
    out = fromOklch(L, C, H);
  }
  return out;
}
/** Darken a color until it reads as text on the given background. */
export function readableOn(hex: string, bg = "#f5f6f8", ratio = 4.5) {
  let [L, C, H] = oklch(hex);
  let out = hex;
  for (let i = 0; i < 50 && contrast(out, bg) < ratio; i++) {
    L -= 0.015;
    out = fromOklch(L, C, H);
  }
  return out;
}
export function tint(hex: string, t = 0.9) {
  return mix(hex, "#ffffff", t);
}

/** Pull the main colors out of an uploaded logo. */
export async function logoColors(dataUrl: string): Promise<string[]> {
  const img = await loadImage(dataUrl);
  const size = 72;
  const cv = document.createElement("canvas");
  const scale = Math.min(1, size / Math.max(img.naturalWidth || size, img.naturalHeight || size));
  cv.width = Math.max(1, Math.round((img.naturalWidth || size) * scale));
  cv.height = Math.max(1, Math.round((img.naturalHeight || size) * scale));
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, cv.width, cv.height);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cv.width, cv.height).data;
  } catch {
    return [];
  }
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++;
    e.r += r;
    e.g += g;
    e.b += b;
    buckets.set(key, e);
  }
  const cands = [...buckets.values()]
    .map((e) => ({ n: e.n, hex: toHex([e.r / e.n / 255, e.g / e.n / 255, e.b / e.n / 255]) }))
    .filter((c) => {
      const [L, C] = oklch(c.hex);
      return !(L > 0.94 && C < 0.03); // drop white backgrounds
    })
    .sort((a, b) => {
      const ca = oklch(a.hex)[1] >= 0.05 ? 1 : 0;
      const cb = oklch(b.hex)[1] >= 0.05 ? 1 : 0;
      return cb - ca || b.n - a.n; // colorful first, then by area
    });
  const out: string[] = [];
  for (const c of cands) {
    if (out.every((o) => deltaE(o, c.hex) > 14)) out.push(c.hex);
    if (out.length >= 5) break;
  }
  return out;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read that image."));
    img.src = src;
  });
}

export const PRESETS: { name: string; primary: string; accent: string }[] = [
  { name: "Teal & amber", primary: "#0f5e73", accent: "#d0822f" },
  { name: "Bistro red", primary: "#9b1c1c", accent: "#d39b2a" },
  { name: "Market green", primary: "#1f5c3a", accent: "#e07a1f" },
  { name: "Charcoal & teal", primary: "#2b2f36", accent: "#0f8b8d" },
  { name: "Plum & gold", primary: "#4b2142", accent: "#c8902b" },
];
