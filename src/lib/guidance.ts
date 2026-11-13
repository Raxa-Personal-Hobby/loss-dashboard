/**
 * Loss prevention guidance shown with each finding.
 *
 * The text and sources live in data/loss-prevention-guidance.json so they can be
 * read, reviewed and changed without touching code. GUIDANCE.md is the readable
 * copy of the same file (rebuild it with `node scripts/build-guidance-md.mjs`).
 *
 * Every item summarizes what a public source says, in our own words, and links to it.
 * Nothing here is advice; see GUIDANCE_DISCLAIMER.
 */
import data from "../../data/loss-prevention-guidance.json";

export type GuideKind = "public" | "research" | "review" | "note";

export interface GuideSource {
  id: string;
  agency: string;
  title: string;
  url: string;
}

export interface Guide {
  id: string;
  kind: GuideKind;
  text: string;
  sources: GuideSource[];
}

type FindingKey =
  | "largeOpen"
  | "largeLitigated"
  | "largeMore"
  | "frequency"
  | "severity"
  | "lateReporting"
  | "litigation"
  | "repeatPeople"
  | "aging"
  | "dataQuality"
  | "dart"
  | "rateRise"
  | "hotLocations";

interface RawGuide {
  kind: string;
  text: string;
  sources: string[];
}
interface RawData {
  checked: string;
  disclaimer: string;
  kinds: Record<string, string>;
  sources: Record<string, { agency: string; title: string; url: string }>;
  guides: Record<string, RawGuide>;
  causes: Record<string, Record<string, string>>;
  findings: Record<string, string | Record<string, string>>;
}

const D = data as unknown as RawData;

/** Date the sources were last checked, as YYYY-MM-DD. */
export const GUIDANCE_CHECKED = D.checked;
export const GUIDANCE_DISCLAIMER = D.disclaimer;

/** Short label shown before the guidance text, by kind. */
export const GUIDE_LABEL: Record<GuideKind, string> = {
  public: D.kinds.public ?? "Public guidance",
  research: D.kinds.research ?? "Published research",
  review: D.kinds.review ?? "Who can help",
  note: D.kinds.note ?? "Note",
};

const cache = new Map<string, Guide>();

export function guideById(id: string): Guide {
  const hit = cache.get(id);
  if (hit) return hit;
  const raw = D.guides[id] ?? D.guides.other;
  const g: Guide = {
    id: D.guides[id] ? id : "other",
    kind: (raw.kind as GuideKind) ?? "note",
    text: raw.text,
    sources: raw.sources.map((s) => ({ id: s, ...D.sources[s] })).filter((s) => s.url),
  };
  cache.set(id, g);
  return g;
}

/** Guidance for a cause category in a template. Unknown causes get the "other" note. */
export function guideForCause(industry: string, cause: string): Guide {
  const id = D.causes[industry]?.[cause] ?? D.causes.general?.[cause] ?? "other";
  return guideById(id);
}

/** Guidance for a finding that isn't tied to one cause (large losses, aging and so on). */
export function guideForFinding(key: FindingKey, industry?: string): Guide {
  const v = D.findings[key];
  const id = typeof v === "string" ? v : (v?.[industry ?? "general"] ?? v?.general ?? "other");
  return guideById(id);
}

/** All cause names that have guidance for a template. Used by tests. */
export function guidanceCauses(industry: string): string[] {
  return Object.keys(D.causes[industry] ?? {});
}

/** "OSHA" or "OSHA; NIOSH (CDC)", for tight spaces like slides. */
export function sourceAgencies(g: Guide): string {
  return [...new Set(g.sources.map((s) => s.agency))].join("; ");
}

/** The fields a finding carries for its guidance. */
export function asFinding(g: Guide) {
  return { action: g.text, kind: g.kind, sources: g.sources };
}
