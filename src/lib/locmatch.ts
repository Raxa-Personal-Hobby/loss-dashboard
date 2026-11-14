// Location matching between two reports (a loss run and a safety report).
//
// Deterministic string rules only: no AI, no network, no outside packages. Every suggestion
// carries plain-language reasons, and nothing here merges anything. It only proposes pairs
// for the user to confirm (see SafetyReportDialog).
//
// Pipeline
//   1. Normalize each name: accents, case, punctuation, common abbreviations, filler words.
//   2. Pull out site numbers (#401, Store 401, P-2103, a leading number, a bare number).
//   3. Score every pair 0-100: word overlap (Dice) 60% + Levenshtein similarity 40%,
//      plus a boost for a shared site number, capped at 40 when numbers, directions or
//      states disagree.
//   4. Sort into High (pre-checked), Medium (suggested) and Low (left unmatched).
//
// Levenshtein rather than Jaro-Winkler: Jaro-Winkler rewards a shared start of the string,
// and the start is the part most likely to differ between systems (store codes, brand
// prefixes, "Store"). Levenshtein treats both names evenly, is length-normalized and reads
// plainly ("2 letters different"). The same measure is used for the word-level typo check.
//
// This file has no runtime imports so the tests can run it with plain `node --test`.

export interface MatchSettings {
  /** Score at or above this can be High (pre-checked) if it is also a clear, mutual best. */
  high: number;
  /** Score at or above this is suggested as Medium. Below is left unmatched. */
  medium: number;
  /** A High pair must beat the next-best candidate by at least this many points. */
  margin: number;
}

/** Template starting points, calibrated on the synthetic sample reports (see tests/). */
export const DEFAULT_MATCH: MatchSettings = { high: 85, medium: 60, margin: 10 };

const NUM_BOOST = 35;
const CONFLICT_CAP = 40;

/* ---------------- Normalization ---------------- */

/** Long forms map to the short form, so "Saint" and "Street" both become "st" and nobody has to guess which one "St" meant. */
const ABBR: Record<string, string> = {
  street: "st", str: "st", saint: "st", avenue: "ave", av: "ave", boulevard: "blvd", road: "rd", drive: "dr", lane: "ln", court: "ct", place: "pl",
  highway: "hwy", parkway: "pkwy", freeway: "fwy", expressway: "expy", circle: "cir", terrace: "ter", trail: "trl",
  north: "n", south: "s", east: "e", west: "w", northeast: "ne", northwest: "nw", southeast: "se", southwest: "sw",
  mount: "mt", mountain: "mtn", fort: "ft", point: "pt", center: "ctr", centre: "ctr", cntr: "ctr", plaza: "plz", square: "sq", heights: "hts",
  junction: "jct", terminal: "term", building: "bldg", warehouse: "whse", international: "intl", apartments: "apt", apartment: "apt", apts: "apt",
  department: "dept", corporate: "corp", corporation: "corp", headquarters: "hq", office: "ofc", offices: "ofc", distribution: "dist",
  medical: "med", hospital: "hosp", industrial: "ind", manufacturing: "mfg", university: "univ", village: "vlg", springs: "spgs", spring: "spg",
  station: "sta", downtown: "dtwn", residences: "res", residence: "res", townhomes: "th", townhouses: "th", senior: "sr", living: "lvg",
};

/** A misspelled long form ("Termnial", "Apartemnts") still maps to its short form. Words of 7+ letters, same first letter, one slip allowed. */
const LONG_FORMS = Object.keys(ABBR).filter((k) => k.length >= 6);
const fuzzyCache = new Map<string, string>();
function fuzzyAbbr(w: string): string {
  if (w.length < 7 || /\d/.test(w)) return w;
  const hit = fuzzyCache.get(w);
  if (hit) return hit;
  const k = LONG_FORMS.find((f) => f.length >= 7 && f[0] === w[0] && Math.abs(f.length - w.length) <= 1 && levenshtein(f, w) <= 1);
  const out = k ? ABBR[k] : w;
  fuzzyCache.set(w, out);
  return out;
}

/** Words that say "this is a place" but don't tell places apart. Dropped for scoring only. */
const FILLER = new Set(["the", "of", "at", "and", "inc", "llc", "ltd", "store", "location", "loc", "site", "unit", "no", "nbr", "num", "number", "branch", "facility", "property", "project", "proj", "job", "jobsite", "dc"]);

/** Words before a number that make it a site number. */
const NUM_MARK = new Set(["store", "site", "loc", "location", "unit", "no", "nbr", "num", "number", "branch", "project", "proj", "job", "property", "terminal", "term", "dc", "facility", "bldg", "building", "plant", "shop", "restaurant", "rest", "id"]);

const DIRS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);
const DIR_WORD: Record<string, string> = { n: "north", s: "south", e: "east", w: "west", ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest" };

const STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(" "));

export interface LocName {
  raw: string;
  /** Site numbers, leading zeros dropped. */
  nums: string[];
  /** Two-letter state codes written like "Ontario, CA" or at the end of the name. */
  states: string[];
  /** Normalized words that tell places apart (directions included). */
  toks: string[];
  /** Directions found in the name, short form. */
  dirs: string[];
  /** All normalized words run together, for the "same name, different spacing" check. */
  compact: string;
}

export function parseLocation(raw: string): LocName {
  const text = String(raw ?? "").replace(/\s+/g, " ").trim();
  const states: string[] = [];
  const stateRe = /,\s*([A-Z]{2})\b|\b([A-Z]{2})\s*(?:\d{5})?\s*$/g;
  let m: RegExpExecArray | null;
  let body = text;
  while ((m = stateRe.exec(text))) {
    const st = m[1] ?? m[2];
    if (STATES.has(st)) {
      states.push(st.toLowerCase());
      body = body.replace(m[0], m[1] ? "," : "");
    }
  }
  let s = body
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/#/g, " # ")
    .replace(/\b([a-z]{1,12})-?(\d+)\b/g, "$1 $2") // P-2103, store401, st-12
    .replace(/\b(\d+)-?([a-z])\b/g, "$1 $2"); // 401-A, 401a
  const words = s.split(/[^a-z0-9#]+/).filter(Boolean);
  const nums: string[] = [];
  const toks: string[] = [];
  const allWords: string[] = [];
  words.forEach((w, i) => {
    if (w === "#") return;
    if (/^\d+$/.test(w)) {
      const prev = words[i - 1];
      const isSite = i === 0 || prev === "#" || (prev != null && (NUM_MARK.has(prev) || /^[a-z]$/.test(prev))) || words.filter((x) => x !== "#").length === 1;
      const n = String(Number(w));
      if (isSite && !(n.length === 4 && /^(19|20)\d\d$/.test(n) && i > 0)) nums.push(n);
      else toks.push(n);
      allWords.push(n);
      return;
    }
    const a = ABBR[w] ?? fuzzyAbbr(w);
    allWords.push(a);
    // A lone letter right before a site number is a prefix (P-2103), not a word.
    if (/^[a-z]$/.test(a) && !DIRS.has(a) && /^\d+$/.test(words[i + 1] ?? "")) return;
    if (!FILLER.has(a)) toks.push(a);
  });
  const dirs = toks.filter((t) => DIRS.has(t));
  return { raw: text, nums: [...new Set(nums)], states: [...new Set(states)], toks, dirs, compact: (toks.length ? toks : allWords).join("") };
}

/* ---------------- Similarity ---------------- */

/** Levenshtein edit distance, counting a swap of two neighboring letters ("Anahiem") as one edit. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let pp: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1);
    }
    pp = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** 1 = identical, 0 = nothing in common. */
export const similarity = (a: string, b: string) => (!a && !b ? 1 : 1 - levenshtein(a, b) / Math.max(a.length, b.length));

/** How two words compare: the same, one an abbreviation (prefix, 3+ letters) of the other, a small typo apart
 *  (same first letter, so Austin and Justin stay different), or not the same. */
function sameWord(x: string, y: string): "exact" | "prefix" | "typo" | null {
  if (x === y) return "exact";
  const short = Math.min(x.length, y.length);
  if (/^\d+$/.test(x) || /^\d+$/.test(y)) return null;
  if (short >= 3 && (x.startsWith(y) || y.startsWith(x))) return "prefix";
  if (short >= 5 && x[0] === y[0] && levenshtein(x, y) <= (Math.max(x.length, y.length) >= 9 ? 2 : 1)) return "typo";
  return null;
}

export interface PairScore {
  a: string;
  b: string;
  score: number;
  /** Score from the words alone, before the site number boost or caps. */
  nameScore: number;
  /** Levenshtein similarity of the cleaned names, 0-1. */
  sim: number;
  letters: number;
  sharedNums: string[];
  sharedWords: string[];
  /** Word pairs that only nearly match ("anaheim" / "anahiem"). A pair that leans on one is never pre-checked without a shared number. */
  typos: [string, string][];
  conflicts: string[];
  sameName: boolean;
}

export interface MatchContext {
  /** Words too common in either report to tell places apart (brand names, "terminal" on every row). */
  common: Set<string>;
  /** Site numbers used by exactly one name in each report. A number only joins when it is unique in the loss run (A). */
  uniqueNumsA: Set<string>;
  uniqueNumsB: Set<string>;
  /** The High cut-off, so short names can be held below it. */
  high: number;
}

const strip = (t: string[], common: Set<string>) => {
  const kept = t.filter((w) => !common.has(w));
  return kept.length ? kept : t;
};

export function scorePair(A: LocName, B: LocName, ctx: MatchContext): PairScore {
  const ta = strip(A.toks, ctx.common);
  const tb = strip(B.toks, ctx.common);
  const used = new Set<number>();
  const shared: string[] = [];
  const typos: [string, string][] = [];
  for (const x of ta) {
    // Prefer an exact or abbreviation match over a typo match.
    let j = tb.findIndex((y, k) => !used.has(k) && (sameWord(x, y) === "exact" || sameWord(x, y) === "prefix"));
    if (j < 0) j = tb.findIndex((y, k) => !used.has(k) && sameWord(x, y) === "typo");
    if (j >= 0) {
      if (sameWord(x, tb[j]) === "typo") typos.push([x, tb[j]]);
      used.add(j);
      shared.push(x);
    }
  }
  const dice = ta.length + tb.length ? (2 * shared.length) / (ta.length + tb.length) : 0;
  const sa = [...ta].sort().join(" ");
  const sb = [...tb].sort().join(" ");
  const sim = similarity(sa, sb);
  const letters = levenshtein(sa, sb);
  const ca = ta.join("");
  const cb = tb.join("");
  const sameName = !!ca && ca === cb;
  let nameScore = sameName ? 100 : Math.round(100 * (0.6 * dice + 0.4 * sim));
  // Very short names ("HQ", "LV") can't be judged by letter similarity.
  if (!sameName && Math.min(ca.length, cb.length) < 4) nameScore = Math.min(nameScore, shared.length ? ctx.high - 1 : 0);
  const sharedNums = A.nums.filter((n) => B.nums.includes(n));
  const conflicts: string[] = [];
  if (A.nums.length && B.nums.length && !sharedNums.length) conflicts.push(`numbers differ (${A.nums.join(", ")} vs ${B.nums.join(", ")})`);
  if (A.dirs.length && B.dirs.length && !A.dirs.some((d) => B.dirs.includes(d))) conflicts.push(`directions differ (${A.dirs.map((d) => DIR_WORD[d]).join(", ")} vs ${B.dirs.map((d) => DIR_WORD[d]).join(", ")})`);
  if (A.states.length && B.states.length && !A.states.some((s) => B.states.includes(s))) conflicts.push(`states differ (${A.states.join(", ").toUpperCase()} vs ${B.states.join(", ").toUpperCase()})`);
  // The number must point to one loss run location. Two safety report names with the same number
  // both reach it, and the one-to-many rule then keeps them from being pre-checked.
  const usableNum = sharedNums.some((n) => ctx.uniqueNumsA.has(n));
  let score = nameScore;
  if (usableNum) score = Math.min(100, score + NUM_BOOST);
  // Leaning on a near-miss word ("Anahiem") is fine for a suggestion, not for a pre-check, unless a number agrees.
  if (typos.length && !usableNum) score = Math.min(score, ctx.high - 1);
  if (conflicts.length) score = Math.min(score, CONFLICT_CAP);
  return { a: A.raw, b: B.raw, score, nameScore, sim, letters, sharedNums, sharedWords: shared, typos, conflicts, sameName };
}

/* ---------------- Matching ---------------- */

export type Tier = "high" | "medium" | "low";

export interface Suggestion {
  /** Safety report name. */
  b: string;
  /** Suggested loss run name, or null when nothing reached Medium. */
  a: string | null;
  tier: Tier;
  score: number;
  /** Plain-language reasons for the suggestion. */
  reasons: string[];
  /** Plain-language notes on why this needs review or wasn't suggested. */
  notes: string[];
  /** Best scoring loss run name even when not suggested, with its score. */
  closest: PairScore | null;
  /** Other loss run names worth offering in the picker, best first. */
  options: PairScore[];
}

export interface MatchResult {
  suggestions: Suggestion[];
  /** Loss run names no safety report name was suggested for. */
  onlyA: string[];
  /** Groups of names inside one report that look like the same place. */
  dupesA: string[][];
  dupesB: string[][];
}

/** One plain-language line per piece of evidence. */
export function explain(p: PairScore): string[] {
  const out: string[] = [];
  if (p.sameName) out.push("Same name once spacing, punctuation and abbreviations are set aside");
  if (p.sharedNums.length) out.push(`Both use number ${p.sharedNums.join(", ")}`);
  if (!p.sameName && p.sharedWords.length) out.push(`Shared words: ${p.sharedWords.join(", ")}`);
  if (!p.sameName && p.nameScore > 0) out.push(`Names ${Math.round(p.sim * 100)}% alike${p.letters ? ` (${p.letters} letter${p.letters === 1 ? "" : "s"} different)` : ""}`);
  if (p.typos.length) out.push(`Close spelling, not identical: ${p.typos.map(([x, y]) => `${x} / ${y}`).join(", ")}`);
  return out;
}

const uniqueNums = (names: LocName[]) => {
  const n = new Map<string, number>();
  names.forEach((x) => x.nums.forEach((k) => n.set(k, (n.get(k) ?? 0) + 1)));
  return new Set([...n].filter(([, c]) => c === 1).map(([k]) => k));
};

const commonWords = (names: LocName[]) => {
  const out = new Set<string>();
  if (names.length < 4) return out;
  const df = new Map<string, number>();
  names.forEach((x) => new Set(x.toks).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  df.forEach((c, t) => {
    if (c / names.length > 0.5 && !DIRS.has(t)) out.add(t);
  });
  return out;
};

/** Names inside one report that look like the same place. Never merged, only shown. */
function duplicates(names: LocName[], ctxSelf: MatchContext, settings: MatchSettings): string[][] {
  const parent = names.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++) {
      const p = scorePair(names[i], names[j], ctxSelf);
      // Inside one report a shared number on two names is itself the signal.
      const sameNum = p.sharedNums.length > 0 && !p.conflicts.length;
      if (!p.conflicts.length && (p.sameName || p.score >= settings.high || sameNum)) parent[find(i)] = find(j);
    }
  const groups = new Map<number, string[]>();
  names.forEach((n, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), n.raw]));
  return [...groups.values()].filter((g) => g.length > 1);
}

/**
 * Suggest a loss run location for each safety report location.
 * A = loss run names, B = safety report names. Each B gets at most one suggestion.
 */
export function matchLocations(aNames: string[], bNames: string[], settings: MatchSettings = DEFAULT_MATCH): MatchResult {
  const uniq = (xs: string[]) => [...new Set(xs.map((x) => String(x ?? "").replace(/\s+/g, " ").trim()).filter(Boolean))];
  const A = uniq(aNames).map(parseLocation);
  const B = uniq(bNames).map(parseLocation);
  const common = new Set([...commonWords(A), ...commonWords(B)]);
  const ctx: MatchContext = { common, uniqueNumsA: uniqueNums(A), uniqueNumsB: uniqueNums(B), high: settings.high };
  const selfA = { ...ctx, uniqueNumsB: ctx.uniqueNumsA };
  const selfB = { ...ctx, uniqueNumsA: ctx.uniqueNumsB };

  // Score every pair. For very large lists, only score pairs that share a word or number.
  const big = A.length * B.length > 1_000_000;
  const index = new Map<string, number[]>();
  if (big) A.forEach((x, i) => [...x.toks, ...x.nums.map((n) => `#${n}`)].forEach((k) => index.set(k, [...(index.get(k) ?? []), i])));
  const scores: PairScore[][] = B.map((b) => {
    const cand = big ? [...new Set([...b.toks, ...b.nums.map((n) => `#${n}`)].flatMap((k) => index.get(k) ?? []))] : A.map((_, i) => i);
    return cand.map((i) => scorePair(A[i], b, ctx)).sort((x, y) => y.score - x.score || x.a.localeCompare(y.a));
  });

  // Best B for each A, to check that a pair is a mutual best.
  const bestForA = new Map<string, { b: string; score: number; second: number }>();
  scores.forEach((list) =>
    list.forEach((p) => {
      const cur = bestForA.get(p.a);
      if (!cur) bestForA.set(p.a, { b: p.b, score: p.score, second: 0 });
      else if (p.score > cur.score) bestForA.set(p.a, { b: p.b, score: p.score, second: cur.score });
      else if (p.score > cur.second) cur.second = p.score;
    }),
  );

  const sitesOnly = (p: PairScore) => p.sharedNums.some((n) => ctx.uniqueNumsA.has(n)) && !p.conflicts.length;

  const suggestions: Suggestion[] = B.map((b, bi) => {
    const list = scores[bi];
    const top = list[0] ?? null;
    const second = list[1] ?? null;
    const notes: string[] = [];
    const options = list.filter((p) => p.score >= Math.min(settings.medium, 30)).slice(0, 6);
    const reach = (p: PairScore | null) => !!p && !p.conflicts.length && (p.score >= settings.medium || sitesOnly(p));
    if (!top || !reach(top)) {
      if (top && top.conflicts.length) notes.push(`Closest is ${top.a}, not suggested: ${top.conflicts.join("; ")}`);
      else if (top && top.score > 0) notes.push(`Closest is ${top.a} (score ${top.score}), too far apart to suggest`);
      else notes.push("No loss run location looks like this one");
      const shared = b.nums.filter((n) => !ctx.uniqueNumsA.has(n)).filter((n) => A.some((a) => a.nums.includes(n)));
      if (shared.length) notes.push(`Number ${shared.join(", ")} is on more than one loss run location, so it wasn't used`);
      return { b: b.raw, a: null, tier: "low", score: top?.score ?? 0, reasons: [], notes, closest: top, options };
    }
    const reasons = explain(top);
    let tier: Tier = top.score >= settings.high ? "high" : "medium";
    if (top.score < settings.medium) notes.push("Matched on the number only; the names have little in common");
    if (second && reach(second) && top.score - second.score < settings.margin) {
      tier = "medium";
      notes.push(`Close second: ${second.a} (score ${second.score}). Pick the right one`);
    }
    const back = bestForA.get(top.a);
    if (back && back.b !== b.raw) {
      tier = "medium";
      notes.push(`${back.b} looks like a closer match for ${top.a}`);
    } else if (back && back.score - back.second < settings.margin && back.second >= settings.medium) {
      tier = "medium";
      notes.push(`Another safety report name also looks like ${top.a}`);
    }
    return { b: b.raw, a: top.a, tier, score: top.score, reasons, notes, closest: top, options };
  });

  // One loss run location suggested for several safety report names: never pre-checked.
  const byA = new Map<string, Suggestion[]>();
  suggestions.forEach((s) => s.a && byA.set(s.a, [...(byA.get(s.a) ?? []), s]));
  byA.forEach((group, a) => {
    if (group.length < 2) return;
    group.forEach((s) => {
      s.tier = "medium";
      const others = group.filter((g) => g !== s).map((g) => g.b);
      if (!s.notes.some((n) => n.startsWith("Also suggested")))
        s.notes.push(`Also suggested for ${others.join(", ")}. If they are the same place, accept each one to combine them under ${a}; otherwise pick one`);
    });
  });

  // A name that looks like another name in the same report is never pre-checked.
  const dupesA = duplicates(A, selfA, settings);
  const dupesB = duplicates(B, selfB, settings);
  const twin = (groups: string[][], name: string | null) => groups.find((g) => name != null && g.includes(name))?.filter((x) => x !== name) ?? [];
  suggestions.forEach((s) => {
    const tb = twin(dupesB, s.b);
    const ta = twin(dupesA, s.a);
    if (tb.length) s.notes.push(`Looks like the same place as ${tb.join(", ")} in the safety report`);
    if (ta.length) s.notes.push(`${s.a} looks like the same place as ${ta.join(", ")} in the loss run`);
    if ((tb.length || ta.length) && s.tier === "high") s.tier = "medium";
  });

  const suggestedA = new Set(suggestions.filter((s) => s.a).map((s) => s.a));
  return {
    suggestions,
    onlyA: A.map((a) => a.raw).filter((a) => !suggestedA.has(a)),
    dupesA,
    dupesB,
  };
}
