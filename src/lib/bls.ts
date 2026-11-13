// Public benchmark data from the U.S. Bureau of Labor Statistics (BLS),
// Survey of Occupational Injuries and Illnesses (SOII). Public domain.
// Pulled Nov 13, 2026. Each block says which table it came from.

import { SOII_YEAR, getNaics, lookupNaics, naicsLabel, ownershipTotal, type Ownership } from "./naics";

export const BLS_RATE_YEAR = SOII_YEAR;
export const BLS_MIX_YEARS = "2023-2024";

export const BLS_LINKS = {
  rates: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/table-1-injury-and-illness-rates-by-industry-2024-national.htm",
  mixes: "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/soii-case-and-demographic-characteristics-historical-data/2023-2024.htm",
  calculator: "https://www.bls.gov/iif/",
};

/** Rates for any NAICS code come from ./naics (BLS SOII Table 1, 2024). This file keeps the
 *  case mixes used to build the sample data and the benchmark the user picked. */
export interface Benchmark {
  code: string; // NAICS code, "" for a total, "custom" for the user's own numbers
  name: string;
  kind: "bls" | "custom";
  ownership: Ownership | "all";
  trc: number;
  dart: number | null;
  dafw: number | null;
  djtr: number | null;
  other: number | null;
  /** Set when the NAICS typed wasn't published and a parent group was used. */
  note: string;
}

/** What the user picked in the benchmark box. Saved per industry. */
export interface BenchChoice {
  naics: string;
  ownership: Ownership;
  custom: boolean;
  trc: number | null;
  dart: number | null;
  label: string;
}

export const defaultChoice = (naics: string): BenchChoice => ({ naics, ownership: "private", custom: false, trc: null, dart: null, label: "" });

export function resolveBenchmark(choice: BenchChoice, fallback: string): Benchmark {
  if (choice.custom && choice.trc != null && choice.trc > 0) {
    return { code: "custom", name: choice.label.trim() || "Your target", kind: "custom", ownership: choice.ownership, trc: choice.trc, dart: choice.dart != null && choice.dart > 0 ? choice.dart : null, dafw: null, djtr: null, other: null, note: "" };
  }
  const m = lookupNaics(choice.naics, choice.ownership) ?? lookupNaics(fallback, "private");
  const r = m?.rate ?? ownershipTotal("private");
  return { ...r, kind: "bls", note: m?.note ?? "" };
}

/** Rates for a code, for the sample data. */
export const blsRate = (code: string) => getNaics(code) ?? ownershipTotal("private");

/** DART case counts by part of body, 2023-2024 combined.
 *  Source: BLS SOII biennial Table R2, "Detailed industry by selected parts of body affected (Number)".
 *  "Head" etc. are the parts left after the named sub-parts are taken out of each group total. */
export const BODY_PARTS: Record<string, Record<string, number>> = {
  "7225": { Head: 8300, Eye: 2260, Neck: 750, Back: 11430, Trunk: 3400, Shoulder: 5250, Arm: 7970, Hand: 41720, Wrist: 5830, "Upper, other": 3410, Knee: 8560, Ankle: 5690, Foot: 5360, Leg: 5540, "Body systems": 2550, Multiple: 9970, Other: 2810 },
  "23": { Head: 10550, Eye: 7080, Neck: 1750, Back: 24830, Trunk: 9780, Shoulder: 13190, Arm: 12590, Hand: 44130, Wrist: 5500, "Upper, other": 2850, Knee: 18350, Ankle: 12890, Foot: 11640, Leg: 14890, "Body systems": 3450, Multiple: 14500, Other: 2680 },
  "484": { Head: 3970, Eye: 790, Neck: 1220, Back: 12950, Trunk: 4170, Shoulder: 7160, Arm: 3690, Hand: 7400, Wrist: 2110, "Upper, other": 1380, Knee: 6250, Ankle: 6170, Foot: 3440, Leg: 5620, "Body systems": 900, Multiple: 6740, Other: 1130 },
  "531": { Head: 880, Eye: 150, Neck: 580, Back: 3650, Trunk: 900, Shoulder: 1530, Arm: 1510, Hand: 4880, Wrist: 640, "Upper, other": 700, Knee: 1840, Ankle: 2530, Foot: 1610, Leg: 2190, "Body systems": 1880, Multiple: 2320, Other: 190 },
};

/** DART case counts by nature of injury, 2023-2024 combined.
 *  Source: BLS SOII biennial Table R1, "Detailed industry by selected natures (Number)". */
export const NATURES: Record<string, Record<string, number>> = {
  "7225": { "Sprain/Strain": 26530, Fracture: 7100, Laceration: 32850, Abrasion: 360, Contusion: 13140, Burn: 14370, "Chemical Burn": 860, Amputation: 110, "Carpal Tunnel": 510, Tendonitis: 470, "Multiple Injuries": 2010, Soreness: 5480 },
  "23": { "Sprain/Strain": 59670, Fracture: 25530, Laceration: 38300, Abrasion: 1230, Contusion: 11590, Burn: 1570, "Chemical Burn": 640, Amputation: 500, "Carpal Tunnel": 120, Tendonitis: 370, "Multiple Injuries": 4630, Soreness: 5320 },
  "484": { "Sprain/Strain": 34930, Fracture: 5590, Laceration: 4450, Abrasion: 340, Contusion: 5940, Burn: 560, "Chemical Burn": 170, Amputation: 100, "Carpal Tunnel": 70, Tendonitis: 90, "Multiple Injuries": 1800, Soreness: 2280 },
  "531": { "Sprain/Strain": 9410, Fracture: 1570, Laceration: 3710, Abrasion: 120, Contusion: 1670, Burn: 1170, "Chemical Burn": 50, Amputation: 0, "Carpal Tunnel": 0, Tendonitis: 0, "Multiple Injuries": 520, Soreness: 690 },
};

/** DART case counts by event or exposure, 2023-2024 combined.
 *  Source: BLS SOII biennial Table R4, "Detailed industry by selected events or exposures (Number)". */
export interface EventCounts {
  total: number;
  contactPersonAnimal: number;
  struckByObject: number; // struck by propelled, falling, collapsing object
  caughtRunning: number; // struck, caught or compressed by running equipment
  contactNonRunning: number; // contact with non-running objects or equipment (knives, edges, doors)
  fallLower: number;
  slipStepping: number; // slip, trip, stumble while stepping between levels
  fallSameLevel: number; // slip, trip, stumble or fall on same level
  overexertion: number; // all overexertion, repetitive motion and bodily reaction
  transportation: number;
  violence: number;
  explosionsFires: number;
  exposure: number; // harmful substances or environments (heat, chemicals, electricity)
  other: number;
}

export const EVENTS: Record<string, EventCounts> = {
  "7225": { total: 130780, contactPersonAnimal: 610, struckByObject: 11600, caughtRunning: 3210, contactNonRunning: 33670, fallLower: 2870, slipStepping: 2920, fallSameLevel: 32980, overexertion: 19950, transportation: 1920, violence: 1850, explosionsFires: 150, exposure: 17880, other: 610 },
  "23": { total: 210660, contactPersonAnimal: 1010, struckByObject: 22850, caughtRunning: 7850, contactNonRunning: 49070, fallLower: 27270, slipStepping: 11050, fallSameLevel: 23570, overexertion: 47460, transportation: 9980, violence: 400, explosionsFires: 410, exposure: 5960, other: 1950 },
  "484": { total: 75090, contactPersonAnimal: 540, struckByObject: 6420, caughtRunning: 800, contactNonRunning: 8530, fallLower: 5360, slipStepping: 6970, fallSameLevel: 10860, overexertion: 24030, transportation: 8250, violence: 210, explosionsFires: 300, exposure: 1480, other: 950 },
  "531": { total: 27970, contactPersonAnimal: 840, struckByObject: 1220, caughtRunning: 290, contactNonRunning: 4520, fallLower: 1970, slipStepping: 1900, fallSameLevel: 5050, overexertion: 7210, transportation: 1390, violence: 210, explosionsFires: 0, exposure: 2920, other: 270 },
};

/** For the General template's sample: the four industries above added together. */
const sumOf = (tables: Record<string, Record<string, number>>) => {
  const out: Record<string, number> = {};
  for (const code of ["7225", "23", "484", "531"]) for (const [k, v] of Object.entries(tables[code] ?? {})) out[k] = (out[k] ?? 0) + v;
  return out;
};
BODY_PARTS.private = sumOf(BODY_PARTS);
NATURES.private = sumOf(NATURES);

/** Median days away from work by nature of injury, all industries, 2023-2024.
 *  Source: BLS SOII biennial Table R67, "Detailed nature by number of days by case type". */
export const MEDIAN_DAYS_BY_NATURE: Record<string, number> = {
  All: 8,
  "Sprain/Strain": 13,
  Fracture: 40,
  Laceration: 4,
  Abrasion: 4,
  Contusion: 6,
  Burn: 6,
  "Chemical Burn": 3,
  Amputation: 42,
  Concussion: 6,
  Dislocation: 20,
  Hernia: 29,
  "Multiple Injuries": 16,
  Soreness: 6,
  "Electric Shock": 6, // electrocution, electric shock (R67 code 1532)
  "Carpal Tunnel": 28, // R67 code 2741
  Tendonitis: 21, // other or unspecified tendonitis, R67 code 2755
  "Heat Exhaustion": 2, // heat exhaustion, fatigue, R67 code 1722
  Crush: 12, // nonfatal crushing injuries, R67 code 103
  "Foreign Body": 2, // eye abrasions and irritation, R67 code 1311
};

/** Median days by industry and case type, 2023-2024.
 *  Source: BLS SOII biennial Table R65, "Detailed industry by number of days by case type". */
export const MEDIAN_DAYS_BY_INDUSTRY: Record<string, { dafw: number; djtr: number; dart: number }> = {
  all: { dafw: 8, djtr: 15, dart: 14 },
  "7225": { dafw: 5, djtr: 10, dart: 7 },
  "23": { dafw: 11, djtr: 12, dart: 14 },
  "484": { dafw: 19, djtr: 13, dart: 20 },
  "531": { dafw: 7, djtr: 14, dart: 13 },
};

export const benchmarkLabel = (b: Benchmark) => (b.kind === "custom" ? `${b.name} (your numbers)` : naicsLabel(b));
/** Who the comparison is against, for finding text. */
export const benchmarkSource = (b: Benchmark) => (b.kind === "custom" ? `your target (${b.name})` : `BLS ${BLS_RATE_YEAR} average for ${naicsLabel(b)}`);
