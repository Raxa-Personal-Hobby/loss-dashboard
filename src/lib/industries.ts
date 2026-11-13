// Industry profiles. Everything that changes between industries lives here:
// coverage lines, cause categories and their matching rules,
// field labels, wording, the extra charts, and the synthetic sample data.
import type { FieldKey } from "./types";
import { EVENTS, NATURES, BODY_PARTS } from "./bls";

export type IndustryId = "restaurant" | "construction" | "fleet" | "realestate" | "general";

export interface CoverageDef {
  key: string;
  label: string;
  short: string;
  match: RegExp;
}

export interface FieldOverride {
  label?: string;
  header?: string;
  synonyms?: string[];
  extraSynonyms?: string[];
  help?: string;
  example?: string;
}

export interface DetailChart {
  field: "bodyPart" | "jobTitle";
  title: string;
  subtitle: string;
  coverages?: string[]; // limit to these lines
  repeat?: boolean; // last 12 months, 2+ claims only
  file: string;
}

type W<T> = [T, number][];
export interface SampleSpec {
  seed: number;
  company: string;
  sourceName: string;
  annualPerUnit: number;
  trend: number;
  units: { name: string; region: string; state: string; mult: number; from?: number; to?: number; late?: boolean }[];
  coverageMix: W<string>;
  mix: Record<string, W<string>>;
  covText: Record<string, string[]>;
  causeText: Record<string, string[]>;
  causeTextByCov?: Record<string, string[]>; // key `${cov}|${cat}`
  detail: Record<string, string[]>;
  detailByCov?: Record<string, string[]>;
  sev: Record<string, [number, number]>; // key `${cov}|${cat}` -> [median, sigma]
  idPrefix: Record<string, string>;
  litProb: (cov: string, cat: string) => number;
  claimant: (cov: string) => string;
  bodyPart?: { covs: string[]; byCat: Record<string, string[]>; pool?: (unitIdx: number, r: () => number) => string };
  jobTitle?: { covs: string[]; byCat: Record<string, W<string>>; pool?: (unitIdx: number, r: () => number) => string; wcValue?: string };
  nature?: { covs: string[]; byCat: Record<string, string> };
  /** WC detail for the sample, picked with BLS weights (keys are BLS body part and nature names). */
  osha?: { bodyByCat?: Record<string, string[]>; natureByCat: Record<string, string[]> };
  dow: number[];
  plants: { unit: string; n: number; cov: string | string[]; cat: string; job?: string; body?: string }[];
  large: { unit: string; date: [number, number, number]; cov: string; cat: string; amount: number; lit: boolean; desc: string; job?: string; body?: string }[];
}

export interface Industry {
  id: IndustryId;
  name: string;
  title: string; // "Restaurant loss dashboard"
  deck: string; // "Restaurant loss review"
  unit: { one: string; many: string; One: string; Many: string };
  coverages: CoverageDef[]; // display order
  matchOrder: string[]; // order to test coverage text
  categories: string[];
  rules: [string, RegExp[]][];
  boost: Record<string, string[]>; // coverage -> categories that win ties
  fallback: Record<string, string>; // coverage -> category when nothing matches
  fields: Partial<Record<FieldKey, FieldOverride>>;
  details: DetailChart[];
  dowNote: string;
  exposure: string; // what frequency should be compared against
  benchmark: string;
  repeat?: { field: "jobTitle" | "bodyPart"; noun: string; nouns: string };
  /** BLS industry codes (NAICS): the default benchmark, the choices offered, and the one the sample mixes follow. */
  bls: { default: string; options: string[]; mix: string };
  sample: SampleSpec;
}

/* WC cause mixes for the sample data, built from BLS SOII 2023-2024 DART case counts by
   event or exposure (Table R4) and nature (Table R1). Each line notes the BLS events used. */
const cutsFrom = (code: string) => Math.min(NATURES[code].Laceration, EVENTS[code].contactNonRunning);
const WC_MIX: Record<string, [string, number][]> = {
  restaurant: (() => {
    const e = EVENTS["7225"];
    const cut = cutsFrom("7225");
    return [
      ["Slip/Trip/Fall", e.fallLower + e.slipStepping + e.fallSameLevel], // all falls, slips, trips
      ["Cut/Laceration", cut], // contact with non-running objects that ended in a cut (R1 cuts)
      ["Struck By/Caught", e.contactPersonAnimal + e.struckByObject + e.caughtRunning + e.contactNonRunning - cut], // the rest of contact incidents
      ["Strain/Lifting", e.overexertion], // overexertion and bodily reaction
      ["Burn/Scald", e.exposure + e.explosionsFires], // heat and chemical exposure, fires
      ["Assault/Robbery", e.violence], // violent acts
      ["Vehicle/Delivery", e.transportation], // transportation incidents
    ];
  })(),
  construction: (() => {
    const e = EVENTS["23"];
    const cut = cutsFrom("23");
    const eye = Math.min(BODY_PARTS["23"].Eye, e.contactNonRunning - cut);
    return [
      ["Fall from Height", e.fallLower], // fall to lower level
      ["Slip/Trip", e.slipStepping + e.fallSameLevel], // slips and trips, same level or stepping
      ["Struck By", e.struckByObject + e.contactPersonAnimal + e.contactNonRunning - cut - eye], // struck by objects, other contact
      ["Caught In/Between", e.caughtRunning], // struck, caught or compressed by running equipment
      ["Cut/Puncture", cut], // contact with non-running objects that ended in a cut (R1 cuts)
      ["Eye Injury", eye], // eye cases (R2), taken out of contact with objects
      ["Strain/Lifting", e.overexertion], // overexertion and bodily reaction
      ["Electrical", Math.round(e.exposure / 2) + e.explosionsFires], // half of harmful exposures, plus explosions and fires (template split)
      ["Heat Illness", Math.round(e.exposure / 2)], // the other half of harmful exposures (template split)
      ["Vehicle/Equipment", e.transportation], // transportation incidents
    ];
  })(),
  fleet: (() => {
    const e = EVENTS["484"];
    return [
      ["Driver Injury: Slip/Fall", e.fallLower + e.slipStepping + e.fallSameLevel], // all falls, slips, trips
      ["Driver Injury: Strain/Loading", e.overexertion], // overexertion and bodily reaction
      ["Driver Injury: In Crash", e.transportation], // transportation incidents
      ["Driver Injury: Struck/Caught", e.contactPersonAnimal + e.struckByObject + e.caughtRunning + e.contactNonRunning], // all contact incidents
      ["Other", e.violence + e.explosionsFires + e.exposure + e.other], // everything else
    ];
  })(),
  // Any other industry: the average of the four BLS industry mixes above, by share.
  general: (() => {
    const cats = ["Slip/Trip/Fall", "Strain/Lifting", "Struck By/Caught", "Cut/Puncture", "Burn/Exposure", "Assault/Violence", "Vehicle"];
    const shares = ["7225", "23", "484", "531"].map((code) => {
      const e = EVENTS[code];
      const cut = cutsFrom(code);
      const v = [e.fallLower + e.slipStepping + e.fallSameLevel, e.overexertion, e.contactPersonAnimal + e.struckByObject + e.caughtRunning + e.contactNonRunning - cut, cut, e.exposure + e.explosionsFires, e.violence, e.transportation];
      const t = v.reduce((a, b) => a + b, 0);
      return v.map((x) => x / t);
    });
    return cats.map((c, i) => [c, Math.round((shares.reduce((a, s) => a + s[i], 0) / shares.length) * 1000)] as [string, number]);
  })(),
  realestate: (() => {
    const e = EVENTS["531"];
    const cut = cutsFrom("531");
    return [
      ["Slip/Trip/Fall", e.fallLower + e.slipStepping + e.fallSameLevel], // all falls, slips, trips
      ["Strain/Lifting", e.overexertion], // overexertion and bodily reaction
      ["Cut/Puncture", cut], // contact with non-running objects that ended in a cut (R1 cuts)
      ["Dog Bite/Animal", e.contactPersonAnimal], // contact with other person or animal
      ["Vehicle/Parking", e.transportation], // transportation incidents
      ["Assault/Security", e.violence], // violent acts
      ["Other", e.struckByObject + e.caughtRunning + e.contactNonRunning - cut + e.exposure + e.explosionsFires + e.other], // struck by, chemical exposure, other
    ];
  })(),
};

const WC: RegExp = /(worker|work\s*comp|wkrs|\bw\.?\s*\/?\s*c\b|\bwc\b|wcomp|employer'?s? liab|\bwcel\b|\bel\b)/;
const AUTO = /(auto|vehicle|\bal\b|\bapd\b|\bbap\b|\bca\b|fleet|motor|collision|comprehensive|hired|non-?owned|\bpip\b|\bum\b|uninsured)/;
const GL = /(general liab|gen\.? liab|\bgl\b|\bcgl\b|liabil|premises|products|liquor|\bll\b|umbrella|excess)/;
const PROP = /(property|\bprop\b|building|contents|business income|equipment breakdown|\beb\b|boiler|inland marine|spoilage|flood|\bfire\b|\bcrime\b|theft|burglary)/;

const DOW_WEEKEND = [1.15, 0.85, 0.8, 0.85, 0.95, 1.25, 1.3];
const DOW_WEEKDAY = [0.3, 1.2, 1.25, 1.25, 1.2, 1.1, 0.5];
const DOW_FLAT = [0.95, 1.05, 1.05, 1.05, 1.0, 0.95, 0.95];

/* ======================================================================
   Restaurant
   ====================================================================== */
const restaurant: Industry = {
  id: "restaurant",
  name: "Restaurant",
  title: "Restaurant loss dashboard",
  deck: "Restaurant loss review",
  unit: { one: "location", many: "locations", One: "Location", Many: "Locations" },
  coverages: [
    { key: "WC", label: "Workers' comp", short: "WC", match: WC },
    { key: "GL", label: "General liability", short: "GL", match: /(general liab|gen\.? liab|\bgl\b|\bcgl\b|liabil|premises|products|liquor|\bll\b|umbrella|excess|slip)/ },
    { key: "Auto", label: "Auto", short: "Auto", match: AUTO },
    { key: "Property", label: "Property", short: "Property", match: PROP },
  ],
  matchOrder: ["WC", "Auto", "GL", "Property"],
  categories: ["Slip/Trip/Fall", "Burn/Scald", "Cut/Laceration", "Strain/Lifting", "Struck By/Caught", "Assault/Robbery", "Food Illness/Foreign Object", "Allergic Reaction", "Vehicle/Delivery", "Fire/Smoke", "Water Damage", "Equipment/Spoilage", "Theft/Vandalism", "Other"],
  rules: [
    ["Food Illness/Foreign Object", [/food ?borne/, /food poison/, /\billness\b/, /\bsick/, /nause|vomit/, /salmonella|norovirus|e\.? ?coli|listeria/, /foreign (object|body|matter|material)/, /\b(hair|bone|glass|plastic|metal|wire) (found )?in (the )?(food|dish|meal|burger|salad|soup|drink)/, /chok(e|ing)/, /(broken|chipped|cracked) tooth|dental/, /undercook|contaminat/, /\bin (his|her|their) (food|meal)/]],
    ["Allergic Reaction", [/allerg/, /anaphyla/, /peanut|tree nut|gluten|shellfish|sesame/, /epi-?pen/]],
    ["Assault/Robbery", [/assault/, /robber|robbed|\barmed\b|hold-? ?up/, /altercation|\bfight/, /attack/, /violen/, /threat/, /punch|\bshot\b|shooting|\bgun\b|stabb?/, /aggressive (customer|guest|patron)/]],
    ["Theft/Vandalism", [/theft|stolen|steal/, /burglar|break-? ?in|broke in/, /vandal|graffiti/, /smash(ed)? (window|door)/]],
    ["Vehicle/Delivery", [/vehicle/, /\bauto\b/, /\b(car|truck|van)\b/, /collision|crash/, /rear-? ?end/, /back(ed|ing)? into/, /deliver/, /\bdriv(e|er|ing)\b/, /\bmv[ac]\b/, /motor/, /drive-? ?thru|drive-? ?through/, /parked/]],
    ["Struck By/Caught", [/struck/, /\bstrike\b|\bhit\b/, /bump(ed)?/, /walk(ed)? into/, /caught (in|between|on)/, /pinch/, /falling object|flying object/, /(fell|dropped) on (his|her|their|the)? ?(foot|feet|hand|toe|head)/, /crush/, /\bdoor\b/, /collaps/]],
    ["Slip/Trip/Fall", [/slip/, /\btrip/, /\bfall\b|falling|\bfell\b/, /wet floor/, /spill(ed)? (on|near) (the )?floor/, /\bice\b|\bicy\b/, /\bstairs?\b|\bsteps?\b/, /ladder/, /uneven/, /\bmat\b/, /\bcurb\b/, /same level|different level/]],
    ["Burn/Scald", [/burn/, /scald/, /fryer|\bfry\b/, /grease|hot oil|oil splash/, /hot (water|liquid|plate|pan|surface|coffee|tea|soup|food|object|pot|grill)/, /steam/, /\boven\b/, /\bgrill\b|griddle|broiler/, /flame/, /boiling/, /heat or cold|contact with hot/]],
    ["Cut/Laceration", [/\bcut\b|\bcuts\b|\bcutting\b/, /lacerat/, /knife|knives/, /slicer|mandoline|meat saw|chopper/, /blade/, /puncture/, /(broken )?glass/, /\bsharp/, /box cutter|can opener/, /scrape/]],
    ["Strain/Lifting", [/strain/, /sprain/, /\blift/, /carry/, /\bpush/, /\bpull/, /overexert/, /repetitive|cumulative|carpal/, /twist/, /bend(ing)?\b/, /reach(ing)?\b/, /ergonom/, /heavy/]],
    ["Fire/Smoke", [/\bfire\b/, /smoke/, /hood (fire|suppression)/, /kitchen fire|grease fire|electrical fire/]],
    ["Water Damage", [/water/, /\bleak/, /flood/, /\bpipe/, /plumb/, /sewer|sewage/, /back-? ?up/, /\broof/, /sprinkler/, /\bdrain/]],
    ["Equipment/Spoilage", [/spoil/, /refriger/, /cooler/, /freezer/, /walk-? ?in/, /equipment (failure|breakdown|damage)/, /compressor/, /power (outage|failure|loss)/, /outage/, /breakdown/, /\bhvac\b/]],
  ],
  boost: { Property: ["Fire/Smoke", "Water Damage", "Equipment/Spoilage", "Theft/Vandalism"], Auto: ["Vehicle/Delivery"] },
  fallback: { Auto: "Vehicle/Delivery" },
  fields: {
    location: { label: "Location / store", header: "Location", extraSynonyms: ["store", "storename", "storenumber", "storeno", "unit", "unitname", "unitnumber", "restaurant", "restaurantname", "storeid"], example: "#101 Anaheim Hills" },
    bodyPart: { label: "Body part", header: "Body Part", help: "WC only. Feeds the body part chart.", example: "Hand" },
    jobTitle: { label: "Job title / department", header: "Job Title", help: "WC only. Shows which roles get hurt.", example: "Line Cook" },
  },
  details: [
    { field: "bodyPart", title: "Workers' comp: body part", subtitle: "Most frequent injuries", coverages: ["WC"], file: "wc-body-part" },
    { field: "jobTitle", title: "Workers' comp: job title", subtitle: "Who gets hurt", coverages: ["WC"], file: "wc-job-title" },
  ],
  dowNote: "Restaurants usually peak with weekend volume",
  exposure: "headcount or sales",
  benchmark: "multi-unit restaurant group",
  bls: { default: "7225", options: ["7225", "722511", "722513", "722515", "private"], mix: "7225" },
  sample: {
    seed: 12,
    company: "Sample Restaurant Group",
    sourceName: "Sample Restaurant Group loss run (synthetic)",
    annualPerUnit: 8.2,
    trend: 1.04,
    units: [
      { name: "#101 Anaheim Hills", region: "SoCal", state: "CA", mult: 1.0 },
      { name: "#102 Irvine Spectrum", region: "SoCal", state: "CA", mult: 1.05 },
      { name: "#103 Long Beach Shore", region: "SoCal", state: "CA", mult: 1.1 },
      { name: "#104 San Diego Gaslamp", region: "SoCal", state: "CA", mult: 1.3 },
      { name: "#105 Riverside Plaza", region: "SoCal", state: "CA", mult: 0.9 },
      { name: "#201 San Jose Downtown", region: "NorCal", state: "CA", mult: 1.0 },
      { name: "#202 Sacramento Midtown", region: "NorCal", state: "CA", mult: 0.95 },
      { name: "#203 Fresno River Park", region: "NorCal", state: "CA", mult: 0.7 },
      { name: "#301 Phoenix Camelback", region: "Arizona", state: "AZ", mult: 1.0 },
      { name: "#302 Tempe Mill Ave", region: "Arizona", state: "AZ", mult: 1.0 },
      { name: "#303 Tucson Foothills", region: "Arizona", state: "AZ", mult: 0.6, late: true },
      { name: "#401 Las Vegas Strip", region: "Nevada", state: "NV", mult: 1.6 },
      { name: "#402 Henderson", region: "Nevada", state: "NV", mult: 0.85, late: true },
      { name: "#501 Dallas Uptown", region: "Texas", state: "TX", mult: 1.05 },
      { name: "#502 Austin South Congress", region: "Texas", state: "TX", mult: 1.0 },
      { name: "#503 Houston Galleria", region: "Texas", state: "TX", mult: 1.15 },
    ],
    coverageMix: [["WC", 56], ["GL", 29], ["Auto", 7], ["Property", 8]],
    mix: {
      WC: WC_MIX.restaurant,
      GL: [["Slip/Trip/Fall", 50], ["Food Illness/Foreign Object", 24], ["Allergic Reaction", 6], ["Burn/Scald", 6], ["Struck By/Caught", 6], ["Assault/Robbery", 4], ["Other", 4]],
      Auto: [["Vehicle/Delivery", 100]],
      Property: [["Water Damage", 35], ["Fire/Smoke", 14], ["Equipment/Spoilage", 26], ["Theft/Vandalism", 20], ["Other", 5]],
    },
    covText: { WC: ["Workers' Comp", "WC", "Workers Compensation"], GL: ["General Liability", "GL"], Auto: ["Auto Liability", "Commercial Auto"], Property: ["Property"] },
    causeText: {
      "Slip/Trip/Fall": ["Slip, Trip, Fall - Same Level", "Slipped on wet floor", "Fall on same level - grease", "Trip over floor mat", "Slipped on ice near walk-in"],
      "Burn/Scald": ["Burn or Scald - Contact with Hot Objects", "Burn - fryer oil splash", "Scald - hot water", "Burned hand on grill", "Burn - oven door"],
      "Cut/Laceration": ["Cut, Puncture, Scrape - Hand Tool", "Laceration - knife", "Cut by slicer", "Cut on broken glass"],
      "Strain/Lifting": ["Strain - Lifting", "Strain - Pushing or Pulling", "Strain - Carrying", "Repetitive motion"],
      "Struck By/Caught": ["Struck By - Falling Object", "Struck Against - Door", "Caught In or Between"],
      "Assault/Robbery": ["Robbery - armed", "Assault - customer altercation", "Workplace violence"],
      "Food Illness/Foreign Object": ["Foreign object in food", "Foodborne illness claim", "Alleged food poisoning", "Broken tooth - foreign object", "Choking on bone"],
      "Allergic Reaction": ["Allergic reaction - undisclosed peanut", "Allergen exposure - shellfish"],
      "Vehicle/Delivery": ["Auto - rear-end collision during delivery", "Vehicle backed into customer car", "Delivery driver collision", "Drive-thru: customer vehicle damage"],
      "Water Damage": ["Water damage - pipe leak", "Sewer backup", "Roof leak"],
      "Fire/Smoke": ["Kitchen fire - fryer", "Hood fire", "Electrical fire"],
      "Equipment/Spoilage": ["Walk-in cooler failure - spoilage", "Freezer breakdown - food spoilage", "Power outage spoilage"],
      "Theft/Vandalism": ["Burglary - break-in", "Vandalism - graffiti", "Theft of equipment"],
      Other: ["Other", "Miscellaneous", "Other - see notes"],
    },
    causeTextByCov: {
      "GL|Slip/Trip/Fall": ["Customer slipped near entrance", "Guest slip and fall - restroom", "Guest tripped on parking lot curb", "Customer slipped on spilled drink"],
      "GL|Burn/Scald": ["Hot coffee burned guest", "Hot soup burned customer"],
      "GL|Struck By/Caught": ["Guest struck by door", "Chair collapsed under guest"],
      "GL|Assault/Robbery": ["Guest assaulted in parking lot", "Patron altercation - bar"],
      "GL|Other": ["Customer property damage", "Other - see notes"],
    },
    detail: {
      "Slip/Trip/Fall": ["Floor was wet near the dish station.", "Grease on floor by the fryer line.", "Mat edge was curled.", "Spilled ice by the bar well."],
      "Burn/Scald": ["Hot oil splashed while filtering the fryer.", "Touched the flat-top while reaching.", "Steam from the dish machine.", "Grabbed a sheet pan without a towel."],
      "Cut/Laceration": ["Knife slipped while dicing onions.", "Cleaning the slicer blade.", "Broken glass in the dish sink.", "Opening a case with a box cutter."],
      "Strain/Lifting": ["Lifting a 50 lb case of fries.", "Carrying a stock pot.", "Pulling a full trash bin.", "Stacking chairs at close."],
      "Struck By/Caught": ["Box fell from the top shelf.", "Swinging kitchen door.", "Hand caught in the walk-in door."],
      "Assault/Robbery": ["Customer became aggressive at the counter.", "Robbery at closing.", "Altercation in the parking lot."],
      "Food Illness/Foreign Object": ["Guest reported illness after dining.", "Guest found plastic in the salad.", "Guest chipped a tooth on a bone."],
      "Allergic Reaction": ["Order marked nut-free; guest reacted.", "Cross-contact at the prep station."],
      "Vehicle/Delivery": ["Rear-ended at a light during a delivery.", "Backed into a parked car in the lot.", "Drive-thru lane contact with a customer car."],
      "Water Damage": ["Pipe burst under the prep sink.", "Grease trap backup flooded the kitchen.", "Roof leak over the dining room."],
      "Fire/Smoke": ["Fryer flare-up spread to the hood.", "Electrical short behind the line.", "Hood fire during the dinner rush."],
      "Equipment/Spoilage": ["Walk-in compressor failed overnight.", "Power outage spoiled inventory.", "Freezer door left open."],
      "Theft/Vandalism": ["Back door forced overnight.", "Graffiti on the patio wall.", "Catering equipment stolen from the lot."],
      Other: ["See adjuster notes.", "Details pending."],
    },
    detailByCov: {
      "GL|Slip/Trip/Fall": ["Guest slipped on a wet floor near the restroom.", "Spilled drink by the bar.", "Guest tripped on a curled entry mat.", "Wet entry after rain; no caution sign out."],
      "GL|Burn/Scald": ["Server tipped a hot drink onto the guest.", "Sizzling plate touched the guest's arm."],
      "GL|Struck By/Caught": ["Swinging door hit a guest.", "Booth seat gave way."],
    },
    sev: {
      "WC|Slip/Trip/Fall": [4200, 1.3], "WC|Burn/Scald": [1700, 1.1], "WC|Cut/Laceration": [1100, 1.0], "WC|Strain/Lifting": [5200, 1.3], "WC|Struck By/Caught": [1900, 1.1], "WC|Assault/Robbery": [3000, 1.2], "WC|Vehicle/Delivery": [6500, 1.3],
      "GL|Slip/Trip/Fall": [9000, 1.35], "GL|Food Illness/Foreign Object": [2300, 1.1], "GL|Allergic Reaction": [6000, 1.3], "GL|Burn/Scald": [4200, 1.2], "GL|Struck By/Caught": [3400, 1.1], "GL|Assault/Robbery": [8000, 1.4], "GL|Other": [1800, 1.0],
      "Auto|Vehicle/Delivery": [5600, 1.1],
      "Property|Water Damage": [12000, 1.1], "Property|Fire/Smoke": [32000, 1.3], "Property|Equipment/Spoilage": [6000, 0.9], "Property|Theft/Vandalism": [4000, 1.0], "Property|Other": [3000, 1.0],
    },
    idPrefix: { WC: "WC", GL: "GL", Auto: "AU", Property: "PR" },
    litProb: (cov, cat) => (cov === "GL" && cat === "Slip/Trip/Fall" ? 0.12 : cov === "GL" ? 0.05 : cov === "WC" && (cat === "Strain/Lifting" || cat === "Slip/Trip/Fall") ? 0.08 : cov === "Auto" ? 0.08 : cov === "WC" ? 0.03 : 0),
    claimant: (cov) => (cov === "GL" ? "Guest" : cov === "Auto" ? "Third party" : cov === "Property" ? "Insured" : ""),
    bodyPart: {
      covs: ["WC"],
      byCat: { "Slip/Trip/Fall": ["Knee", "Lower Back", "Ankle", "Wrist", "Hip"], "Burn/Scald": ["Hand", "Wrist", "Forearm", "Fingers"], "Cut/Laceration": ["Fingers", "Hand", "Thumb"], "Strain/Lifting": ["Lower Back", "Shoulder", "Neck", "Wrist"], "Struck By/Caught": ["Head", "Foot", "Hand", "Shoulder"], "Assault/Robbery": ["Head", "Face", "Multiple"], "Vehicle/Delivery": ["Neck", "Back", "Multiple"] },
    },
    jobTitle: {
      covs: ["WC", "Auto"],
      byCat: {
        "Burn/Scald": [["Line Cook", 50], ["Prep Cook", 20], ["Dishwasher", 10], ["Server", 10], ["Kitchen Manager", 10]],
        "Cut/Laceration": [["Prep Cook", 40], ["Line Cook", 35], ["Dishwasher", 15], ["Bartender", 10]],
        "Slip/Trip/Fall": [["Server", 30], ["Dishwasher", 25], ["Line Cook", 20], ["Host", 10], ["Busser", 15]],
        "Strain/Lifting": [["Dishwasher", 25], ["Line Cook", 20], ["Prep Cook", 20], ["Server", 15], ["Kitchen Manager", 10], ["Delivery Driver", 10]],
        "Struck By/Caught": [["Dishwasher", 40], ["Line Cook", 35], ["Server", 25]],
        "Assault/Robbery": [["General Manager", 40], ["Server", 30], ["Host", 30]],
        "Vehicle/Delivery": [["Delivery Driver", 100]],
      },
    },
    nature: { covs: ["WC"], byCat: { "Slip/Trip/Fall": "Contusion", "Burn/Scald": "Burn", "Cut/Laceration": "Laceration", "Strain/Lifting": "Strain", "Struck By/Caught": "Contusion", "Assault/Robbery": "Contusion", "Vehicle/Delivery": "Strain" } },
    osha: {
      bodyByCat: {
        "Slip/Trip/Fall": ["Knee", "Back", "Ankle", "Wrist", "Trunk", "Head", "Leg", "Foot", "Shoulder", "Multiple"],
        "Burn/Scald": ["Hand", "Arm", "Wrist", "Head", "Eye", "Leg", "Foot", "Trunk", "Multiple"],
        "Cut/Laceration": ["Hand", "Arm", "Wrist", "Leg", "Foot", "Head"],
        "Strain/Lifting": ["Back", "Shoulder", "Wrist", "Neck", "Knee", "Arm", "Trunk", "Upper, other"],
        "Struck By/Caught": ["Head", "Hand", "Foot", "Shoulder", "Arm", "Knee", "Eye", "Leg"],
        "Assault/Robbery": ["Head", "Multiple", "Neck", "Hand", "Body systems"],
        "Vehicle/Delivery": ["Neck", "Back", "Multiple", "Head", "Shoulder"],
      },
      natureByCat: {
        "Slip/Trip/Fall": ["Sprain/Strain", "Fracture", "Contusion", "Multiple Injuries", "Soreness", "Abrasion"],
        "Burn/Scald": ["Burn", "Chemical Burn"],
        "Cut/Laceration": ["Laceration", "Amputation", "Abrasion"],
        "Strain/Lifting": ["Sprain/Strain", "Soreness", "Carpal Tunnel", "Tendonitis"],
        "Struck By/Caught": ["Contusion", "Fracture", "Laceration", "Multiple Injuries"],
        "Assault/Robbery": ["Contusion", "Multiple Injuries", "Laceration"],
        "Vehicle/Delivery": ["Sprain/Strain", "Contusion", "Fracture", "Multiple Injuries"],
      },
    },
    dow: DOW_WEEKEND,
    plants: [
      { unit: "#102", n: 5, cov: "WC", cat: "Burn/Scald" },
      { unit: "#501", n: 3, cov: "GL", cat: "Slip/Trip/Fall" },
      { unit: "#501", n: 2, cov: "WC", cat: "Slip/Trip/Fall" },
      { unit: "#302", n: 3, cov: ["WC", "WC", "GL"], cat: "Assault/Robbery" },
      { unit: "#202", n: 3, cov: "WC", cat: "Strain/Lifting", job: "Dishwasher" },
      { unit: "#401", n: 2, cov: "Auto", cat: "Vehicle/Delivery" },
    ],
    large: [
      { unit: "#501", date: [2026, 2, 14], cov: "GL", cat: "Slip/Trip/Fall", amount: 185000, lit: true, desc: "Guest slipped on wet floor near restrooms; fractured hip; attorney represented." },
      { unit: "#102", date: [2026, 5, 3], cov: "WC", cat: "Burn/Scald", amount: 78000, lit: false, job: "Line Cook", body: "Forearm", desc: "Hot oil splashed while filtering the fryer; second-degree burns to forearm and hand." },
      { unit: "#104", date: [2025, 8, 22], cov: "Property", cat: "Fire/Smoke", amount: 168000, lit: false, desc: "Fryer flare-up spread to the hood; kitchen closed 9 days." },
      { unit: "#401", date: [2025, 12, 6], cov: "Auto", cat: "Vehicle/Delivery", amount: 132000, lit: true, desc: "Delivery driver ran a red light; third party injured." },
    ],
  },
};

/* ======================================================================
   Construction
   ====================================================================== */
const TRADES_WC: W<string> = [["Laborer", 24], ["Carpenter", 18], ["Electrician", 10], ["Ironworker", 8], ["Plumber", 8], ["Concrete Finisher", 8], ["Drywall Installer", 8], ["Roofer", 8], ["Equipment Operator", 8]];
const construction: Industry = {
  id: "construction",
  name: "Construction",
  title: "Construction loss dashboard",
  deck: "Construction loss review",
  unit: { one: "project", many: "projects", One: "Project", Many: "Projects" },
  coverages: [
    { key: "WC", label: "Workers' comp", short: "WC", match: WC },
    { key: "GL", label: "General liability", short: "GL", match: /(general liab|gen\.? liab|\bgl\b|\bcgl\b|liabil|premises|products|completed op|umbrella|excess|wrap|ocip|ccip|\bocp\b|owner'?s? (and|&) contractor)/ },
    { key: "Auto", label: "Auto", short: "Auto", match: AUTO },
    { key: "BR", label: "Builder's risk / property", short: "BR", match: /(builder'?s'? ?risk|\bbr\b|course of construction|property|\bprop\b|installation)/ },
    { key: "Equip", label: "Contractor's equipment", short: "Equip", match: /(inland marine|contractor'?s? equip|equipment floater|\bim\b|tools? floater|equipment)/ },
  ],
  matchOrder: ["WC", "Equip", "BR", "Auto", "GL"],
  categories: ["Fall from Height", "Slip/Trip", "Struck By", "Caught In/Between", "Electrical", "Strain/Lifting", "Cut/Puncture", "Eye Injury", "Heat Illness", "Vehicle/Equipment", "3rd-Party Property Damage", "Third-Party Injury", "Construction Defect", "Theft/Vandalism", "Water/Fire/Weather", "Other"],
  rules: [
    ["3rd-Party Property Damage", [/utility (strike|line|damage)/, /\b811\b|underground (line|utility|gas|cable|electric)/, /gas line|water main|fiber (line|cable)|cable cut/, /(struck|hit|damaged|cut) (a |an |the )?(gas|water|sewer|fiber|electric|power|telecom|underground)/, /neighbor|adjacent (property|building|structure)|third[- ]party property/, /damage to (neighbor|adjacent|existing)/]],
    ["Third-Party Injury", [/third[- ]party (injury|bodily)/, /pedestrian|member of the public|passer-?by|motorist|bystander/, /visitor (injured|tripped|fell|struck)/]],
    ["Construction Defect", [/defect/, /workmanship/, /water intrusion|window leak|roof leak/, /crack(ed|ing|s)? (in |of )?(the )?(slab|foundation|wall|stucco)/, /settlement|foundation/, /warranty/]],
    ["Electrical", [/electric(al)? shock|electrocut/, /\bshock/, /arc flash/, /power line|energized|live (wire|circuit)/]],
    ["Fall from Height", [/fall from|fell from|fall off|fell off|fell through|fall through/, /ladder/, /scaffold/, /\broof\b|roofing|skylight/, /elevat(ed|ion)/, /(aerial|scissor|boom) lift/, /\bheight/, /lower level/, /floor opening|hole in (the )?(floor|deck)/]],
    ["Struck By", [/struck by|\bstruck\b/, /falling object|dropped (tool|object|material)/, /swinging|load (shifted|swung|fell)/, /\bhit by\b/, /flying (debris|object)/, /kickback/]],
    ["Caught In/Between", [/caught (in|between|under)/, /pinch/, /trench|excavation collapse|cave-? ?in/, /crush/, /rotating|machinery|conveyor|mixer/, /amputat/]],
    ["Slip/Trip", [/slip/, /\btrip/, /same level/, /uneven/, /tripped over|debris on/, /\bmud\b|\bice\b|\bwet\b/]],
    ["Strain/Lifting", [/strain/, /sprain/, /\blift/, /carry/, /overexert/, /\bpush|\bpull/, /repetitive|cumulative/, /twist|bend/, /awkward/]],
    ["Cut/Puncture", [/\bcut\b|lacerat/, /puncture/, /nail gun|nailer/, /\bsaw\b|blade|grinder/, /rebar/, /\bsharp/, /utility knife|box cutter/]],
    ["Eye Injury", [/\beye/, /foreign body/, /\bdust\b|particle|debris in/, /splash/]],
    ["Heat Illness", [/heat (illness|exhaustion|stroke|stress|cramp)/, /dehydrat/, /\bheat\b/]],
    ["Vehicle/Equipment", [/vehicle|\bauto\b|\btruck\b|pickup/, /collision|crash|rear-? ?end/, /forklift|crane|excavator|backhoe|loader|skid ?steer|dozer|telehandler|dump truck/, /roll ?over|tip-? ?over|tipped/, /backed (into|over)|backing/, /equipment (damage|accident)/]],
    ["Theft/Vandalism", [/theft|stolen|steal/, /vandal|graffiti/, /burglar|break-? ?in/]],
    ["Water/Fire/Weather", [/water damage|flood|pipe (burst|break)|\bleak/, /\bfire\b|smoke/, /storm|\bwind\b|hail|\brain\b|hurricane|tornado/]],
  ],
  boost: { GL: ["3rd-Party Property Damage", "Third-Party Injury", "Construction Defect"], BR: ["Water/Fire/Weather", "Theft/Vandalism"], Equip: ["Theft/Vandalism", "Vehicle/Equipment"], Auto: ["Vehicle/Equipment"] },
  fallback: { Auto: "Vehicle/Equipment" },
  fields: {
    location: { label: "Project / job site", header: "Project", extraSynonyms: ["project", "projectname", "projectnumber", "projectno", "projectid", "job", "jobname", "jobnumber", "jobno", "jobsite", "contract", "contractnumber"], example: "P-2401 Bayfront Office Tower" },
    bodyPart: { label: "Body part", header: "Body Part", help: "WC only. Feeds the body part chart.", example: "Lower Back" },
    jobTitle: { label: "Trade / subcontractor", header: "Trade", synonyms: ["trade", "craft", "subcontractor", "sub", "contractor", "contractorname", "subcontractorname", "employer", "occupation", "jobtitle", "classcode", "trade/sub"], help: "Trade of the injured worker, or the sub responsible for a GL claim.", example: "Ironworker" },
  },
  details: [
    { field: "bodyPart", title: "Workers' comp: body part", subtitle: "Most frequent injuries", coverages: ["WC"], file: "wc-body-part" },
    { field: "jobTitle", title: "Claims by trade or subcontractor", subtitle: "Which trades drive losses", coverages: ["WC", "GL"], file: "claims-by-trade" },
  ],
  dowNote: "Construction claims track the work week",
  exposure: "payroll or work hours",
  benchmark: "general contractor or wrap-up program",
  bls: { default: "23", options: ["23", "236", "238", "private"], mix: "23" },
  sample: {
    seed: 7,
    company: "Sample Builders Group",
    sourceName: "Sample Builders Group loss run (synthetic)",
    annualPerUnit: 11,
    trend: 1.03,
    units: [
      { name: "P-2103 Eastgate Retail Center", region: "West", state: "CA", mult: 1.1, to: 2023 },
      { name: "P-2106 Sierra Vista Hospital Expansion", region: "Mountain", state: "CO", mult: 1.2, to: 2024 },
      { name: "P-2201 Riverside Medical Center", region: "West", state: "CA", mult: 1.2, to: 2024 },
      { name: "P-2204 Harbor Logistics Park", region: "West", state: "CA", mult: 1.0, to: 2024 },
      { name: "P-2302 Mesa Vista Apartments", region: "Southwest", state: "AZ", mult: 0.9, from: 2023, to: 2025 },
      { name: "P-2305 Downtown Transit Station", region: "West", state: "CA", mult: 1.3, from: 2023 },
      { name: "P-2307 Canyon Hills School", region: "Southwest", state: "AZ", mult: 0.8, from: 2023, to: 2025 },
      { name: "P-2401 Bayfront Office Tower", region: "West", state: "CA", mult: 1.4, from: 2024 },
      { name: "P-2403 Desert Sun Solar Farm", region: "Southwest", state: "NV", mult: 0.9, from: 2024, late: true },
      { name: "P-2405 Lakeside Senior Living", region: "Mountain", state: "CO", mult: 1.0, from: 2024 },
      { name: "P-2410 Northpoint Data Center", region: "Southwest", state: "AZ", mult: 1.2, from: 2024 },
      { name: "P-2501 Coastal Highway Bridge", region: "West", state: "CA", mult: 1.1, from: 2025 },
      { name: "P-2503 Valley Water Treatment Plant", region: "Mountain", state: "CO", mult: 1.0, from: 2025 },
      { name: "Equipment Yard & Shop", region: "West", state: "CA", mult: 0.6 },
      { name: "Corporate Office", region: "West", state: "CA", mult: 0.25 },
    ],
    coverageMix: [["WC", 55], ["GL", 22], ["Auto", 10], ["BR", 8], ["Equip", 5]],
    mix: {
      WC: WC_MIX.construction,
      GL: [["3rd-Party Property Damage", 38], ["Third-Party Injury", 18], ["Construction Defect", 32], ["Vehicle/Equipment", 4], ["Other", 8]],
      Auto: [["Vehicle/Equipment", 100]],
      BR: [["Water/Fire/Weather", 70], ["Theft/Vandalism", 30]],
      Equip: [["Theft/Vandalism", 60], ["Vehicle/Equipment", 32], ["Water/Fire/Weather", 8]],
    },
    covText: { WC: ["Workers' Comp", "WC", "Workers Compensation"], GL: ["General Liability", "CGL"], Auto: ["Commercial Auto", "Auto Liability"], BR: ["Builder's Risk", "Builders Risk"], Equip: ["Inland Marine", "Contractor's Equipment"] },
    causeText: {
      "Fall from Height": ["Fall to lower level - ladder", "Fell from scaffold", "Fall through floor opening", "Fell off roof edge", "Fell from scissor lift"],
      "Slip/Trip": ["Slipped on mud", "Tripped over cords", "Slip, Trip, Fall - Same Level", "Tripped on debris on deck"],
      "Struck By": ["Struck by falling object", "Struck by swinging beam", "Hit by dropped tool", "Struck by flying debris"],
      "Caught In/Between": ["Caught in or between", "Hand caught in mixer", "Trench wall cave-in", "Pinched between materials"],
      Electrical: ["Electrical shock from energized panel", "Arc flash", "Contact with live wire"],
      "Strain/Lifting": ["Strain - lifting drywall", "Strain - carrying rebar", "Overexertion - pulling cable", "Strain - awkward position"],
      "Cut/Puncture": ["Laceration - utility knife", "Puncture - nail gun", "Cut by saw blade", "Cut hand on rebar"],
      "Eye Injury": ["Foreign body in eye", "Concrete splash in eye", "Dust in eye while grinding"],
      "Heat Illness": ["Heat exhaustion", "Heat illness - dehydration", "Heat cramps"],
      "Vehicle/Equipment": ["Pickup truck rear-end collision", "Forklift tip-over", "Excavator backed into material stack", "Skid steer rollover"],
      "3rd-Party Property Damage": ["Utility strike - underground gas line", "Excavator struck water main", "Damage to adjacent building", "Fiber cable cut during trenching"],
      "Third-Party Injury": ["Pedestrian struck by falling debris", "Motorist injured in work zone", "Member of the public tripped at site perimeter"],
      "Construction Defect": ["Construction defect - water intrusion", "Window leak - defect claim", "Cracks in slab - workmanship", "Foundation settlement claim"],
      "Theft/Vandalism": ["Tools stolen from job trailer", "Equipment theft from yard", "Vandalism to framing", "Copper wire theft"],
      "Water/Fire/Weather": ["Water damage - pipe burst on floor 3", "Fire during hot work", "Wind damage to framing", "Storm flooding of excavation"],
      Other: ["Other", "See adjuster notes"],
    },
    causeTextByCov: {
      "Equip|Vehicle/Equipment": ["Crane damaged during lift", "Excavator rollover on slope", "Loader tip-over"],
    },
    detail: {
      "Fall from Height": ["Worker lost footing on the ladder.", "Guardrail was removed for a delivery.", "Not tied off at the leading edge."],
      "Slip/Trip": ["Mud on the access ramp.", "Cords across the walkway.", "Debris left on the deck."],
      "Struck By": ["Load swung during the pick.", "Tool dropped from the floor above.", "Debris from cut-off saw."],
      "Caught In/Between": ["Trench was not shored.", "Glove caught in the mixer paddle.", "Pinch point at the material hoist."],
      Electrical: ["Circuit was not locked out.", "Temporary power without GFCI."],
      "Strain/Lifting": ["Carrying drywall sheets up stairs.", "Pulling wire through conduit.", "Lifting rebar bundles by hand."],
      "Cut/Puncture": ["Knife slipped cutting insulation.", "Nail gun double-fired.", "Hand slid on the saw guard."],
      "Eye Injury": ["Not wearing safety glasses while grinding.", "Concrete splashed during the pour."],
      "Heat Illness": ["Afternoon pour in 105 degree heat.", "New hire, first week on site."],
      "Vehicle/Equipment": ["Backing without a spotter.", "Uneven ground under the outrigger.", "Rear-ended on the freeway between sites."],
      "3rd-Party Property Damage": ["Line was mismarked; no potholing.", "Vibration damage to the neighbor's wall.", "Fiber line not on the drawings."],
      "Third-Party Injury": ["Debris fell outside the fenced area.", "Motorist hit cones in the lane closure.", "Visitor tripped at the gate."],
      "Construction Defect": ["Owner reports leaks at windows two years after completion.", "Cracking in the podium slab.", "Stucco cracking along the north face."],
      "Theft/Vandalism": ["Trailer lock cut over the weekend.", "Copper pulled from the electrical room.", "Graffiti on new framing."],
      "Water/Fire/Weather": ["Supply line failed before the building was dried in.", "Sparks from welding ignited insulation.", "High winds before sheathing was complete."],
      Other: ["See adjuster notes.", "Details pending."],
    },
    sev: {
      "WC|Fall from Height": [9000, 1.3], "WC|Slip/Trip": [3800, 1.2], "WC|Struck By": [4500, 1.2], "WC|Caught In/Between": [12000, 1.35], "WC|Electrical": [14000, 1.35], "WC|Strain/Lifting": [6000, 1.2], "WC|Cut/Puncture": [1500, 1.0], "WC|Eye Injury": [800, 0.9], "WC|Heat Illness": [2500, 1.0], "WC|Vehicle/Equipment": [8000, 1.25],
      "GL|3rd-Party Property Damage": [9000, 1.1], "GL|Third-Party Injury": [22000, 1.35], "GL|Construction Defect": [40000, 1.25], "GL|Vehicle/Equipment": [7000, 1.0], "GL|Other": [4000, 1.0],
      "Auto|Vehicle/Equipment": [8500, 1.2],
      "BR|Water/Fire/Weather": [28000, 1.2], "BR|Theft/Vandalism": [9000, 1.0],
      "Equip|Theft/Vandalism": [12000, 0.9], "Equip|Vehicle/Equipment": [18000, 1.1], "Equip|Water/Fire/Weather": [9000, 1.0],
    },
    idPrefix: { WC: "WC", GL: "GL", Auto: "AU", BR: "BR", Equip: "EQ" },
    litProb: (cov, cat) => (cov === "GL" && cat === "Construction Defect" ? 0.35 : cov === "GL" && cat === "Third-Party Injury" ? 0.25 : cov === "GL" ? 0.06 : cov === "WC" && (cat === "Fall from Height" || cat === "Strain/Lifting") ? 0.08 : cov === "WC" ? 0.04 : cov === "Auto" ? 0.08 : 0),
    claimant: (cov) => (cov === "GL" ? "Third party" : cov === "Auto" ? "Third party" : cov === "WC" ? "" : "Insured"),
    bodyPart: {
      covs: ["WC"],
      byCat: { "Fall from Height": ["Back", "Multiple", "Head", "Ankle", "Wrist"], "Slip/Trip": ["Knee", "Ankle", "Back"], "Struck By": ["Head", "Shoulder", "Foot", "Hand"], "Caught In/Between": ["Hand", "Fingers", "Arm", "Leg"], Electrical: ["Hand", "Multiple"], "Strain/Lifting": ["Lower Back", "Shoulder", "Knee"], "Cut/Puncture": ["Hand", "Fingers", "Forearm"], "Eye Injury": ["Eye"], "Heat Illness": ["Multiple"], "Vehicle/Equipment": ["Neck", "Back", "Multiple"] },
    },
    jobTitle: {
      covs: ["WC", "GL"],
      byCat: {
        "Fall from Height": [["Roofer", 30], ["Ironworker", 25], ["Carpenter", 25], ["Laborer", 20]],
        "Slip/Trip": [["Laborer", 40], ["Carpenter", 30], ["Electrician", 30]],
        "Struck By": [["Laborer", 40], ["Ironworker", 30], ["Carpenter", 30]],
        "Caught In/Between": [["Laborer", 40], ["Equipment Operator", 30], ["Plumber", 30]],
        Electrical: [["Electrician", 100]],
        "Strain/Lifting": TRADES_WC,
        "Cut/Puncture": [["Carpenter", 40], ["Drywall Installer", 30], ["Laborer", 30]],
        "Eye Injury": [["Laborer", 40], ["Carpenter", 30], ["Concrete Finisher", 30]],
        "Heat Illness": [["Laborer", 40], ["Roofer", 35], ["Concrete Finisher", 25]],
        "Vehicle/Equipment": [["Equipment Operator", 60], ["Laborer", 40]],
        "3rd-Party Property Damage": [["Excavation Sub", 60], ["Plumbing Sub", 20], ["Electrical Sub", 20]],
        "Third-Party Injury": [["General Contractor", 50], ["Excavation Sub", 25], ["Concrete Sub", 25]],
        "Construction Defect": [["Framing Sub", 25], ["Roofing Sub", 20], ["Waterproofing Sub", 25], ["Window Installer", 15], ["Concrete Sub", 15]],
        Other: [["General Contractor", 100]],
      },
    },
    nature: { covs: ["WC"], byCat: { "Fall from Height": "Fracture", "Slip/Trip": "Sprain", "Struck By": "Contusion", "Caught In/Between": "Crush", Electrical: "Electric Shock", "Strain/Lifting": "Strain", "Cut/Puncture": "Laceration", "Eye Injury": "Foreign Body", "Heat Illness": "Heat Exhaustion", "Vehicle/Equipment": "Strain" } },
    osha: {
      bodyByCat: {
        "Fall from Height": ["Back", "Multiple", "Head", "Ankle", "Wrist", "Leg", "Knee", "Shoulder", "Trunk"],
        "Slip/Trip": ["Knee", "Ankle", "Back", "Wrist", "Leg", "Foot", "Shoulder"],
        "Struck By": ["Head", "Shoulder", "Foot", "Hand", "Arm", "Leg", "Trunk"],
        "Caught In/Between": ["Hand", "Arm", "Leg", "Foot"],
        Electrical: ["Hand", "Multiple", "Arm", "Body systems"],
        "Strain/Lifting": ["Back", "Shoulder", "Knee", "Neck", "Wrist", "Arm", "Trunk", "Upper, other"],
        "Cut/Puncture": ["Hand", "Arm", "Leg", "Head", "Foot"],
        "Eye Injury": ["Eye"],
        "Heat Illness": ["Body systems"],
        "Vehicle/Equipment": ["Neck", "Back", "Multiple", "Head", "Shoulder"],
      },
      natureByCat: {
        "Fall from Height": ["Fracture", "Sprain/Strain", "Multiple Injuries", "Contusion"],
        "Slip/Trip": ["Sprain/Strain", "Fracture", "Contusion", "Soreness"],
        "Struck By": ["Contusion", "Fracture", "Laceration", "Multiple Injuries"],
        "Caught In/Between": ["Fracture", "Laceration", "Contusion", "Amputation"],
        Electrical: ["Electric Shock"],
        "Strain/Lifting": ["Sprain/Strain", "Soreness", "Tendonitis", "Carpal Tunnel"],
        "Cut/Puncture": ["Laceration", "Abrasion", "Amputation"],
        "Eye Injury": ["Foreign Body"],
        "Heat Illness": ["Heat Exhaustion"],
        "Vehicle/Equipment": ["Sprain/Strain", "Contusion", "Fracture", "Multiple Injuries"],
      },
    },
    dow: DOW_WEEKDAY,
    plants: [
      { unit: "P-2401", n: 5, cov: "WC", cat: "Fall from Height" },
      { unit: "P-2501", n: 4, cov: "WC", cat: "Struck By" },
      { unit: "P-2503", n: 3, cov: "WC", cat: "Caught In/Between" },
      { unit: "P-2410", n: 4, cov: "GL", cat: "3rd-Party Property Damage", job: "Excavation Sub" },
      { unit: "Equipment Yard", n: 3, cov: "Equip", cat: "Theft/Vandalism" },
    ],
    large: [
      { unit: "P-2401", date: [2026, 3, 18], cov: "WC", cat: "Fall from Height", amount: 310000, lit: false, job: "Ironworker", body: "Multiple", desc: "Ironworker fell 22 feet at the leading edge; was not tied off." },
      { unit: "P-2501", date: [2026, 6, 9], cov: "GL", cat: "Third-Party Injury", amount: 420000, lit: true, job: "General Contractor", desc: "Motorist injured when a load fell into the open lane; suit filed." },
      { unit: "P-2405", date: [2025, 11, 2], cov: "BR", cat: "Water/Fire/Weather", amount: 260000, lit: false, desc: "Sprinkler line failed before dry-in; three floors of drywall replaced." },
      { unit: "P-2201", date: [2024, 4, 20], cov: "GL", cat: "Construction Defect", amount: 380000, lit: true, job: "Waterproofing Sub", desc: "Owner claims water intrusion at curtain wall; tendered to waterproofing sub." },
    ],
  },
};

/* ======================================================================
   Fleet / auto
   ====================================================================== */
const fleet: Industry = {
  id: "fleet",
  name: "Fleet",
  title: "Fleet loss dashboard",
  deck: "Fleet loss review",
  unit: { one: "terminal", many: "terminals", One: "Terminal", Many: "Terminals" },
  coverages: [
    { key: "AL", label: "Auto liability", short: "AL", match: /(liab|\bal\b|\bbi\b|bodily|third party|auto|vehicle|motor|truck)/ },
    { key: "APD", label: "Physical damage", short: "APD", match: /(physical damage|\bapd\b|collision|comprehensive|own damage)/ },
    { key: "Cargo", label: "Cargo", short: "Cargo", match: /(cargo|\bmtc\b|freight|reefer)/ },
    { key: "WC", label: "Workers' comp", short: "WC", match: WC },
    { key: "GL", label: "General liability", short: "GL", match: /(general liab|gen\.? liab|\bgl\b|\bcgl\b|premises|products)/ },
  ],
  matchOrder: ["WC", "Cargo", "GL", "APD", "AL"],
  categories: ["Rear-End", "Backing", "Intersection", "Lane Change/Sideswipe", "Fixed Object", "Rollover/Jackknife", "Animal Strike", "Pedestrian/Cyclist", "Parked/Stationary", "Glass/Weather", "Theft/Vandalism", "Cargo Loss/Damage", "Driver Injury: In Crash", "Driver Injury: Slip/Fall", "Driver Injury: Strain/Loading", "Driver Injury: Struck/Caught", "Other"],
  rules: [
    ["Driver Injury: In Crash", [/driver injur|injured in (the |a )?(crash|collision|accident)|mva.*injur|whiplash/]],
    ["Driver Injury: Slip/Fall", [/(fall|fell) (from|off|out of) (the )?(cab|truck|trailer|dock|step|deck)/, /\bslip/, /\btrip/, /exiting (the )?(cab|truck)|climbing (in|out|down)/]],
    ["Driver Injury: Strain/Loading", [/strain|sprain/, /\blift|loading|unloading|\bcarry|\bpush|\bpull/, /tarp|chain|strap|binder|dolly|pallet jack|lift ?gate/]],
    ["Driver Injury: Struck/Caught", [/struck by (cargo|freight|(the )?load|a pallet|pallet|falling|(the )?(trailer|roll-?up) door|door)/, /caught (in|between)|pinch(ed)?|crush(ed)?/, /hit by (cargo|freight|a pallet|the door|falling)/, /(trailer|roll-?up) door (fell|came down|closed)/, /dock plate|fifth wheel/]],
    ["Rear-End", [/rear-? ?end/, /struck from behind|hit from behind|following too close/]],
    ["Backing", [/back(ed|ing)\b/, /revers(e|ing)/]],
    ["Fixed Object", [/fixed object|\bpole\b|guard ?rail|fence|\bwall\b|building|bridge|overpass|low clearance|overhead|canopy|\bdock\b|\bgate\b|bollard|mailbox/]],
    ["Intersection", [/intersection/, /red light|stop sign|ran (a|the) (light|signal)/, /fail(ure|ed)? to yield/, /left turn|right turn|turning/]],
    ["Lane Change/Sideswipe", [/lane change|changing lanes|merg(e|ing)/, /sideswipe/, /blind spot/]],
    ["Rollover/Jackknife", [/roll ?over|rolled/, /jackknif/, /loss of control|lost control|ran off (the )?road/]],
    ["Animal Strike", [/animal|\bdeer\b|\belk\b|\bcow\b|\bhorse\b/]],
    ["Pedestrian/Cyclist", [/pedestrian|cyclist|bicycl|\bbike\b|crosswalk/]],
    ["Parked/Stationary", [/\bparked\b|stationary|while stopped|unattended/]],
    ["Glass/Weather", [/glass|windshield/, /\bhail\b|\bstorm\b|flood|\bwind\b|fallen tree|tree fell/]],
    ["Theft/Vandalism", [/theft|stolen|steal/, /vandal/, /break-? ?in|broke into|burglar/, /catalytic/]],
    ["Cargo Loss/Damage", [/cargo|freight|load shift|shifted load|shortage|spoil|reefer|temperature|damaged (product|goods|shipment)/]],
  ],
  boost: { WC: ["Driver Injury: In Crash", "Driver Injury: Slip/Fall", "Driver Injury: Strain/Loading", "Driver Injury: Struck/Caught"], APD: ["Glass/Weather", "Fixed Object", "Animal Strike", "Backing"] },
  fallback: {},
  fields: {
    location: { label: "Terminal / branch", header: "Terminal", synonyms: ["terminal", "terminalname", "yard", "depot", "domicile", "hub", "branch", "branchname", "location", "locationname", "locationcode", "site", "facility", "homebase", "garage"], example: "Fontana, CA Terminal" },
    bodyPart: { label: "Vehicle / unit #", header: "Unit Number", synonyms: ["unit", "unitnumber", "unitno", "vehicle", "vehiclenumber", "vehicleid", "vehicleno", "truck", "trucknumber", "tractor", "tractornumber", "fleetnumber", "vin", "assetnumber", "equipmentnumber", "power unit", "powerunit"], help: "Truck or vehicle number. Shows which units keep getting hit.", example: "Truck 2187" },
    jobTitle: { label: "Driver", header: "Driver", synonyms: ["driver", "drivername", "driverid", "drivernumber", "operator", "operatorname", "employee", "employeename", "employeeid"], help: "Driver name or ID. Finds repeat drivers.", example: "D-1471" },
    claimant: { synonyms: ["claimant", "claimantname", "thirdparty", "injuredparty", "otherparty", "claimantdriver"] },
  },
  details: [
    { field: "jobTitle", title: "Drivers with repeat claims", subtitle: "2 or more claims in the last 12 months", repeat: true, file: "repeat-drivers" },
    { field: "bodyPart", title: "Units with the most claims", subtitle: "Vehicle or truck number", file: "claims-by-unit" },
  ],
  dowNote: "Most fleet claims happen on route days",
  exposure: "miles driven or power units",
  benchmark: "regional trucking or delivery fleet",
  repeat: { field: "jobTitle", noun: "driver", nouns: "drivers" },
  bls: { default: "484", options: ["484", "4841", "4842", "private"], mix: "484" },
  sample: {
    seed: 20,
    company: "Sample Freight Lines",
    sourceName: "Sample Freight Lines loss run (synthetic)",
    annualPerUnit: 21,
    trend: 1.04,
    units: [
      { name: "Ontario, CA Terminal", region: "West", state: "CA", mult: 1.3 },
      { name: "Fontana, CA Terminal", region: "West", state: "CA", mult: 1.1 },
      { name: "Stockton, CA Terminal", region: "West", state: "CA", mult: 0.9 },
      { name: "Phoenix, AZ Terminal", region: "Southwest", state: "AZ", mult: 1.0 },
      { name: "Las Vegas, NV Terminal", region: "Southwest", state: "NV", mult: 0.7, late: true },
      { name: "Salt Lake City, UT Terminal", region: "Mountain", state: "UT", mult: 0.8 },
      { name: "Denver, CO Terminal", region: "Mountain", state: "CO", mult: 0.85 },
      { name: "Dallas, TX Terminal", region: "Texas", state: "TX", mult: 1.15 },
      { name: "Houston, TX Terminal", region: "Texas", state: "TX", mult: 1.2 },
      { name: "Albuquerque, NM Terminal", region: "Southwest", state: "NM", mult: 0.6 },
    ],
    coverageMix: [["AL", 38], ["APD", 30], ["Cargo", 10], ["WC", 17], ["GL", 5]],
    mix: {
      AL: [["Rear-End", 25], ["Intersection", 17], ["Lane Change/Sideswipe", 20], ["Backing", 12], ["Parked/Stationary", 9], ["Pedestrian/Cyclist", 3], ["Rollover/Jackknife", 2], ["Fixed Object", 4], ["Other", 8]],
      APD: [["Fixed Object", 20], ["Backing", 15], ["Rear-End", 9], ["Lane Change/Sideswipe", 8], ["Animal Strike", 12], ["Glass/Weather", 16], ["Rollover/Jackknife", 4], ["Theft/Vandalism", 7], ["Parked/Stationary", 9]],
      Cargo: [["Cargo Loss/Damage", 82], ["Theft/Vandalism", 14], ["Rollover/Jackknife", 4]],
      WC: WC_MIX.fleet,
      GL: [["Fixed Object", 60], ["Other", 40]],
    },
    covText: { AL: ["Auto Liability", "AL - BI/PD"], APD: ["Physical Damage", "APD"], Cargo: ["Motor Truck Cargo", "Cargo"], WC: ["Workers' Comp", "WC"], GL: ["General Liability"] },
    causeText: {
      "Rear-End": ["Rear-end collision", "Insured vehicle rear-ended third party", "Following too close - rear-end"],
      Backing: ["Backing accident", "Backed into parked vehicle", "Reversing at customer dock"],
      Intersection: ["Intersection collision - failed to yield", "Ran red light", "Left turn collision", "Stop sign violation"],
      "Lane Change/Sideswipe": ["Sideswipe - lane change", "Merging collision", "Blind spot sideswipe"],
      "Fixed Object": ["Struck pole", "Low clearance - trailer roof damaged", "Hit customer building canopy", "Struck guardrail", "Dock damage"],
      "Rollover/Jackknife": ["Rollover on ramp", "Jackknife on icy road", "Lost control - ran off road"],
      "Animal Strike": ["Deer strike", "Animal collision - elk"],
      "Pedestrian/Cyclist": ["Pedestrian struck in crosswalk", "Cyclist collision"],
      "Parked/Stationary": ["Vehicle struck while parked", "Hit while stationary at truck stop", "Unattended unit damaged"],
      "Glass/Weather": ["Windshield chip", "Glass breakage", "Hail damage to trailers", "Tree fell on tractor in storm"],
      "Theft/Vandalism": ["Tractor stolen from yard", "Vandalism - windows broken", "Catalytic converter theft"],
      "Cargo Loss/Damage": ["Cargo damage - load shift", "Reefer temperature failure", "Freight shortage", "Damaged goods on delivery"],
      "Driver Injury: In Crash": ["Driver injured in collision", "MVA - driver injured", "Whiplash - rear-ended"],
      "Driver Injury: Slip/Fall": ["Fell from cab", "Slipped exiting truck", "Fell off trailer deck", "Tripped at dock"],
      "Driver Injury: Strain/Loading": ["Strain while unloading freight", "Strain - tarping load", "Pulling pallet jack", "Lift gate strain"],
      "Driver Injury: Struck/Caught": ["Struck by freight when opening trailer door", "Hand caught in roll-up door", "Struck by falling pallet at dock", "Fingers pinched at fifth wheel"],
      Other: ["Other", "See adjuster notes", "Unknown - investigation pending"],
    },
    causeTextByCov: {
      "Cargo|Theft/Vandalism": ["Cargo theft from yard", "Trailer burglarized - freight stolen"],
      "Cargo|Rollover/Jackknife": ["Rollover - cargo destroyed"],
      "GL|Fixed Object": ["Damage to customer gate", "Struck customer canopy while maneuvering"],
    },
    detail: {
      "Rear-End": ["Traffic stopped suddenly on the freeway.", "Driver looked at the tablet.", "Wet roads, following too close."],
      Backing: ["No spotter at the customer dock.", "Backing out of a fuel island.", "Camera view blocked by mud."],
      Intersection: ["Turned left across oncoming traffic.", "Stale yellow light.", "Stop sign hidden by trees."],
      "Lane Change/Sideswipe": ["Car in the right blind spot.", "Merging at a construction zone."],
      "Fixed Object": ["Overhead clearance not posted.", "Tight turn at a customer site.", "Swung wide into a pole."],
      "Rollover/Jackknife": ["Too fast on the off-ramp.", "Black ice on the pass.", "Load shifted in a curve."],
      "Animal Strike": ["Dusk on a rural highway.", "Deer crossing on I-80."],
      "Pedestrian/Cyclist": ["Right turn in a downtown crosswalk.", "Cyclist in the bike lane on a right turn."],
      "Parked/Stationary": ["Hit at a truck stop overnight.", "Parked on the shoulder."],
      "Glass/Weather": ["Rock from a gravel truck.", "Hailstorm at the yard."],
      "Theft/Vandalism": ["Gate left open overnight.", "Broken window, radio taken."],
      "Cargo Loss/Damage": ["Pallets not strapped.", "Reefer unit failed overnight.", "Count short at delivery."],
      "Driver Injury: In Crash": ["Driver taken to ER after the crash.", "Neck pain after being rear-ended."],
      "Driver Injury: Slip/Fall": ["Jumped from the cab instead of using steps.", "Icy deck plates.", "Dock edge in the dark."],
      "Driver Injury: Strain/Loading": ["Hand unload of heavy freight.", "Tarping in high wind.", "Pallet jack stuck on a ramp."],
      "Driver Injury: Struck/Caught": ["Load shifted in transit and fell when the doors opened.", "Roll-up door came down on a hand.", "Pallet slid off the forks at the dock."],
      Other: ["See adjuster notes.", "Details pending."],
    },
    sev: {
      "AL|Rear-End": [16000, 1.3], "AL|Intersection": [22000, 1.4], "AL|Lane Change/Sideswipe": [8000, 1.1], "AL|Backing": [3800, 0.9], "AL|Parked/Stationary": [3000, 0.9], "AL|Pedestrian/Cyclist": [55000, 1.35], "AL|Rollover/Jackknife": [70000, 1.3], "AL|Fixed Object": [6000, 1.0], "AL|Other": [5500, 1.1],
      "APD|Fixed Object": [8500, 1.0], "APD|Backing": [3300, 0.9], "APD|Rear-End": [11000, 1.0], "APD|Lane Change/Sideswipe": [5500, 1.0], "APD|Animal Strike": [5200, 0.8], "APD|Glass/Weather": [900, 0.7], "APD|Rollover/Jackknife": [55000, 1.0], "APD|Theft/Vandalism": [12000, 1.0], "APD|Parked/Stationary": [3000, 0.8],
      "Cargo|Cargo Loss/Damage": [9000, 1.2], "Cargo|Theft/Vandalism": [35000, 1.0], "Cargo|Rollover/Jackknife": [28000, 1.0],
      "WC|Driver Injury: Slip/Fall": [6000, 1.2], "WC|Driver Injury: Strain/Loading": [6500, 1.2], "WC|Driver Injury: In Crash": [14000, 1.3], "WC|Driver Injury: Struck/Caught": [5000, 1.2], "WC|Other": [3000, 1.0],
      "GL|Fixed Object": [4500, 1.0], "GL|Other": [3000, 1.0],
    },
    idPrefix: { AL: "AL", APD: "PD", Cargo: "CG", WC: "WC", GL: "GL" },
    litProb: (cov, cat) => (cov === "AL" && (cat === "Intersection" || cat === "Rear-End" || cat === "Pedestrian/Cyclist") ? 0.16 : cov === "AL" ? 0.06 : cov === "WC" ? 0.06 : 0),
    claimant: (cov) => (cov === "AL" ? "Third party" : cov === "WC" ? "" : cov === "GL" ? "Customer" : "Insured"),
    bodyPart: { covs: ["AL", "APD", "Cargo"], byCat: {}, pool: (u, r) => `Truck ${1000 + u * 200 + Math.floor(r() * 150)}` },
    jobTitle: { covs: ["AL", "APD", "Cargo", "WC"], byCat: {}, pool: (u, r) => `D-${1000 + u * 300 + Math.floor(r() * 250)}` },
    nature: { covs: ["WC"], byCat: { "Driver Injury: Slip/Fall": "Sprain", "Driver Injury: Strain/Loading": "Strain", "Driver Injury: In Crash": "Strain", "Driver Injury: Struck/Caught": "Contusion", Other: "Contusion" } },
    osha: {
      natureByCat: {
        "Driver Injury: Slip/Fall": ["Sprain/Strain", "Fracture", "Contusion", "Multiple Injuries"],
        "Driver Injury: Strain/Loading": ["Sprain/Strain", "Soreness", "Tendonitis"],
        "Driver Injury: In Crash": ["Sprain/Strain", "Contusion", "Fracture", "Multiple Injuries"],
        "Driver Injury: Struck/Caught": ["Contusion", "Fracture", "Laceration"],
        Other: ["Contusion", "Burn", "Chemical Burn", "Laceration"],
      },
    },
    dow: DOW_WEEKDAY.map((x, i) => (i === 0 || i === 6 ? x + 0.25 : x)),
    plants: [
      { unit: "Fontana", n: 6, cov: ["APD", "APD", "AL", "APD", "AL", "APD"], cat: "Backing" },
      { unit: "Dallas", n: 4, cov: "AL", cat: "Rear-End" },
      { unit: "Fontana", n: 3, cov: "AL", cat: "Lane Change/Sideswipe", job: "D-1412" },
      { unit: "Ontario", n: 3, cov: ["AL", "APD", "AL"], cat: "Intersection", job: "D-1042" },
      { unit: "Houston", n: 3, cov: ["APD", "AL", "APD"], cat: "Fixed Object", job: "D-3507" },
      { unit: "Phoenix", n: 3, cov: "WC", cat: "Driver Injury: Slip/Fall" },
    ],
    large: [
      { unit: "Houston", date: [2026, 4, 11], cov: "AL", cat: "Intersection", amount: 450000, lit: true, job: "D-3522", body: "Truck 2688", desc: "Tractor-trailer ran a stale yellow; two occupants of the other car hospitalized; suit filed." },
      { unit: "Ontario", date: [2026, 7, 28], cov: "Cargo", cat: "Theft/Vandalism", amount: 180000, lit: false, desc: "Loaded trailer of electronics stolen from an unsecured lot." },
      { unit: "Salt Lake City", date: [2025, 12, 19], cov: "APD", cat: "Rollover/Jackknife", amount: 215000, lit: false, job: "D-2533", body: "Truck 2041", desc: "Jackknife on icy I-80; tractor and trailer total loss." },
      { unit: "Dallas", date: [2025, 9, 3], cov: "AL", cat: "Rear-End", amount: 260000, lit: true, job: "D-3218", body: "Truck 2470", desc: "Rear-ended a stopped SUV in a construction zone; neck and back injuries." },
    ],
  },
};

/* ======================================================================
   Real estate / property management
   ====================================================================== */
const realestate: Industry = {
  id: "realestate",
  name: "Real estate",
  title: "Real estate loss dashboard",
  deck: "Real estate loss review",
  unit: { one: "property", many: "properties", One: "Property", Many: "Properties" },
  coverages: [
    { key: "Property", label: "Property", short: "Property", match: /(property|\bprop\b|building|contents|business income|rents|equipment breakdown|\beb\b|boiler|flood|\bfire\b|habitational|wind|quake)/ },
    { key: "GL", label: "General liability", short: "GL", match: GL },
    { key: "WC", label: "Workers' comp", short: "WC", match: WC },
    { key: "Auto", label: "Auto", short: "Auto", match: AUTO },
  ],
  matchOrder: ["WC", "Auto", "GL", "Property"],
  categories: ["Water Damage", "Fire/Smoke", "Wind/Hail/Storm", "Mold", "Theft/Vandalism", "Equipment Breakdown", "Slip/Trip/Fall", "Assault/Security", "Dog Bite/Animal", "Pool/Amenity", "Habitability/Pests", "Strain/Lifting", "Cut/Puncture", "Vehicle/Parking", "Other"],
  rules: [
    ["Mold", [/\bmold|mildew|fung(us|al)/]],
    ["Water Damage", [/water/, /\bleak/, /\bpipe|plumb|supply line|water heater|toilet|\bsink\b|dishwasher|washing machine|ice maker/, /burst|frozen|freeze/, /sewer|sewage|back-? ?up|overflow/, /sprinkler/]],
    ["Fire/Smoke", [/\bfire\b/, /smoke/, /cooking|stove|grease fire|kitchen fire/, /electrical fire|arson|dryer vent/]],
    ["Wind/Hail/Storm", [/\bwind\b|\bhail\b|\bstorm\b|hurricane|tornado|lightning/, /roof (damage|blown)|shingles/, /tree (fell|down|limb)|fallen tree/]],
    ["Assault/Security", [/assault/, /robber|mugg/, /shoot|\bshot\b|\bgun\b|stabb/, /negligent security|inadequate security|security/, /attack|\bfight|altercation/]],
    ["Dog Bite/Animal", [/\bdog\b|\bbite\b|bitten|animal/]],
    ["Pool/Amenity", [/\bpool\b|drown|\bspa\b|hot tub|\bgym\b|fitness|playground|amenity|clubhouse/]],
    ["Habitability/Pests", [/habitab/, /bed ?bug|pest|rodent|roach|infest/, /no heat|no hot water|repair (request|delay)/, /tenant (claim|complaint)|resident complaint/]],
    ["Theft/Vandalism", [/theft|stolen|steal/, /vandal|graffiti/, /burglar|break-? ?in/]],
    ["Slip/Trip/Fall", [/\bslip/, /\btrip/, /\bfall\b|\bfell\b|falling/, /\bice\b|\bicy\b|\bsnow\b/, /\bstairs?\b|\bsteps?\b|sidewalk|\bcurb\b|pothole|uneven/, /wet floor/]],
    ["Strain/Lifting", [/strain|sprain/, /\blift|\bcarry|\bpush|\bpull|overexert/, /repetitive/]],
    ["Cut/Puncture", [/\bcut\b|lacerat/, /puncture/, /\bsharp|blade|knife|broken glass/]],
    ["Vehicle/Parking", [/vehicle|\bauto\b|\bcar\b|\btruck\b/, /parking (lot|garage)/, /collision|crash|backed|rear-? ?end/, /gate (damage|struck|hit)|garage door/]],
    ["Equipment Breakdown", [/equipment|breakdown|\bhvac\b|boiler|chiller|elevator|compressor|transformer/, /power surge|electrical failure/]],
  ],
  boost: { Property: ["Water Damage", "Fire/Smoke", "Wind/Hail/Storm", "Mold", "Theft/Vandalism", "Equipment Breakdown"], GL: ["Slip/Trip/Fall", "Assault/Security", "Dog Bite/Animal", "Pool/Amenity", "Habitability/Pests"], WC: ["Strain/Lifting", "Cut/Puncture"], Auto: ["Vehicle/Parking"] },
  fallback: { Auto: "Vehicle/Parking" },
  fields: {
    location: { label: "Property", header: "Property", synonyms: ["property", "propertyname", "propertyid", "propertycode", "propertynumber", "building", "buildingname", "community", "communityname", "asset", "assetname", "location", "locationname", "site", "premises", "address"], example: "Canyon View Apartments" },
    region: { extraSynonyms: ["portfolio", "fund", "submarket"] },
    bodyPart: { label: "Area of property", header: "Incident Area", synonyms: ["incidentarea", "areaofproperty", "lossarea", "locationonpremises", "placeofincident", "incidentlocation", "wherehappened", "areaoccurred"], help: "Where on the property it happened. Shows trouble spots.", example: "Parking lot" },
    jobTitle: { label: "Claimant type", header: "Claimant Type", synonyms: ["claimanttype", "claimantcategory", "partytype", "injuredpartytype", "relationship", "claimantrelationship", "residentstatus", "claimantrole"], help: "Resident, guest, vendor or employee.", example: "Resident" },
  },
  details: [
    { field: "bodyPart", title: "Where on the property", subtitle: "Liability and staff injury claims by area", coverages: ["GL", "WC"], file: "incident-area" },
    { field: "jobTitle", title: "Who's making claims", subtitle: "Liability and staff injury claims by claimant type", coverages: ["GL", "WC"], file: "claimant-type" },
  ],
  dowNote: "Weekends and evenings bring more resident activity",
  exposure: "units or square footage",
  benchmark: "multifamily and commercial real estate portfolio",
  bls: { default: "531", options: ["531", "5311", "5313", "private"], mix: "531" },
  sample: {
    seed: 22,
    company: "Sample Property Group",
    sourceName: "Sample Property Group loss run (synthetic)",
    annualPerUnit: 9,
    trend: 1.04,
    units: [
      { name: "Harbor Point Residences", region: "SoCal", state: "CA", mult: 1.2 },
      { name: "Canyon View Apartments", region: "SoCal", state: "CA", mult: 1.1 },
      { name: "Maple Court Townhomes", region: "NorCal", state: "CA", mult: 0.7 },
      { name: "Parkside Lofts", region: "Texas", state: "TX", mult: 1.0 },
      { name: "Willow Creek Apartments", region: "Texas", state: "TX", mult: 1.15 },
      { name: "Sunset Plaza Retail", region: "SoCal", state: "CA", mult: 0.8 },
      { name: "Gateway Office Center", region: "Arizona", state: "AZ", mult: 0.6 },
      { name: "Riverwalk Medical Office", region: "Texas", state: "TX", mult: 0.6 },
      { name: "Oak Hollow Senior Living", region: "NorCal", state: "CA", mult: 0.9, late: true },
      { name: "Lakeview Apartments", region: "Nevada", state: "NV", mult: 1.0 },
      { name: "Desert Palms Apartments", region: "Arizona", state: "AZ", mult: 1.25 },
      { name: "Metro Tower Office", region: "NorCal", state: "CA", mult: 0.7 },
      { name: "Northgate Shopping Center", region: "Nevada", state: "NV", mult: 0.9 },
      { name: "Bayside Industrial Park", region: "NorCal", state: "CA", mult: 0.5 },
    ],
    coverageMix: [["Property", 42], ["GL", 40], ["WC", 14], ["Auto", 4]],
    mix: {
      Property: [["Water Damage", 46], ["Fire/Smoke", 13], ["Wind/Hail/Storm", 16], ["Theft/Vandalism", 12], ["Equipment Breakdown", 9], ["Mold", 4]],
      GL: [["Slip/Trip/Fall", 44], ["Assault/Security", 9], ["Dog Bite/Animal", 7], ["Pool/Amenity", 6], ["Habitability/Pests", 13], ["Vehicle/Parking", 8], ["Water Damage", 5], ["Other", 8]],
      WC: WC_MIX.realestate,
      Auto: [["Vehicle/Parking", 100]],
    },
    covText: { Property: ["Property", "Commercial Property"], GL: ["General Liability", "GL"], WC: ["Workers' Comp", "WC"], Auto: ["Commercial Auto"] },
    causeText: {
      "Water Damage": ["Water heater burst", "Supply line leak", "Frozen pipe burst", "Sewer backup into units", "Toilet overflow from unit above", "Washing machine hose failure"],
      "Fire/Smoke": ["Kitchen fire in unit - cooking", "Dryer vent fire", "Electrical fire", "Smoke damage from balcony grill"],
      "Wind/Hail/Storm": ["Hail damage to roof", "Wind damage - shingles", "Tree fell on building during storm", "Lightning strike"],
      Mold: ["Mold claim", "Mold remediation - bathroom"],
      "Theft/Vandalism": ["Burglary of leasing office", "Vandalism - graffiti", "Package room theft", "Garage break-in"],
      "Equipment Breakdown": ["HVAC failure - chiller breakdown", "Boiler failure", "Elevator breakdown", "Transformer power surge"],
      "Slip/Trip/Fall": ["Resident slipped on ice", "Tenant fell down stairs", "Tripped on uneven sidewalk", "Visitor slipped on wet floor in lobby"],
      "Assault/Security": ["Assault in parking garage - negligent security", "Robbery of resident", "Shooting on premises - inadequate security"],
      "Dog Bite/Animal": ["Dog bite in courtyard", "Resident bitten by neighbor's dog"],
      "Pool/Amenity": ["Child injured at pool", "Gym equipment injury", "Playground injury"],
      "Habitability/Pests": ["Bed bug infestation complaint", "Habitability claim - no heat", "Rodent infestation complaint", "Repair delay - tenant claim"],
      "Strain/Lifting": ["Maintenance tech strained back lifting appliance", "Strain - carrying water heater", "Pulling carpet - overexertion"],
      "Cut/Puncture": ["Cut hand on broken glass", "Laceration - utility knife during turnover", "Puncture from sharp debris"],
      "Vehicle/Parking": ["Company truck rear-ended", "Car struck parking garage gate", "Resident vehicle damaged by garage door"],
      Other: ["Other", "See adjuster notes", "General liability - other"],
    },
    causeTextByCov: {
      "WC|Slip/Trip/Fall": ["Maintenance tech fell from ladder", "Porter slipped on wet floor", "Tripped on stairs carrying tools"],
      "WC|Dog Bite/Animal": ["Leasing agent bitten by resident's dog on a unit tour", "Maintenance tech bitten entering a unit"],
      "WC|Vehicle/Parking": ["Maintenance truck rear-ended on a supply run", "Employee vehicle accident on a work errand"],
      "WC|Assault/Security": ["Leasing staff assaulted by a resident", "Courtesy officer hurt breaking up a fight"],
      "WC|Other": ["Splash from pool chemicals", "Struck by falling ceiling tile", "Exposure to cleaning chemicals"],
      "GL|Water Damage": ["Resident claims water damage to belongings", "Water leak damaged tenant property"],
    },
    detail: {
      "Water Damage": ["Unit above left the tub running.", "Water heater was 14 years old.", "Pipe froze in a vacant unit.", "Main line clogged with grease."],
      "Fire/Smoke": ["Unattended stovetop.", "Lint build-up in the dryer vent.", "Charcoal grill on a wood balcony."],
      "Wind/Hail/Storm": ["Spring hailstorm.", "60 mph gusts lifted shingles.", "Old oak dropped a limb on the roof."],
      Mold: ["Bathroom fan not working.", "Slow leak behind the wall."],
      "Theft/Vandalism": ["Door left propped open.", "Fob from a former resident still active."],
      "Equipment Breakdown": ["Compressor failed in the heat wave.", "Elevator out for 6 days."],
      "Slip/Trip/Fall": ["Sidewalk not salted.", "Stairwell light out.", "Raised concrete by the mailboxes.", "Lobby mopped without a sign."],
      "Assault/Security": ["Garage gate broken for weeks.", "Prior incidents at the same spot."],
      "Dog Bite/Animal": ["Dog off leash in the courtyard.", "Prior complaints about the same dog."],
      "Pool/Amenity": ["Gate latch broken.", "Treadmill belt slipped."],
      "Habitability/Pests": ["Resident reported bugs twice before treatment.", "Heater out for a week in January."],
      "Strain/Lifting": ["Moving a refrigerator alone.", "Carrying a water heater up stairs."],
      "Cut/Puncture": ["Broken window during turnover.", "Utility knife slipped cutting carpet."],
      "Vehicle/Parking": ["Gate closed on a car.", "Maintenance truck rear-ended on a supply run."],
      Other: ["See adjuster notes.", "Details pending."],
    },
    sev: {
      "Property|Water Damage": [14000, 1.1], "Property|Fire/Smoke": [55000, 1.3], "Property|Wind/Hail/Storm": [28000, 1.2], "Property|Theft/Vandalism": [5000, 1.0], "Property|Equipment Breakdown": [12000, 1.0], "Property|Mold": [18000, 1.1],
      "GL|Slip/Trip/Fall": [14000, 1.3], "GL|Assault/Security": [55000, 1.45], "GL|Dog Bite/Animal": [11000, 1.1], "GL|Pool/Amenity": [22000, 1.35], "GL|Habitability/Pests": [7500, 1.1], "GL|Vehicle/Parking": [4000, 1.0], "GL|Water Damage": [6000, 1.0], "GL|Other": [3000, 1.0],
      "WC|Strain/Lifting": [6000, 1.2], "WC|Slip/Trip/Fall": [5000, 1.2], "WC|Cut/Puncture": [1500, 1.0], "WC|Dog Bite/Animal": [2500, 1.0], "WC|Vehicle/Parking": [7000, 1.2], "WC|Assault/Security": [6000, 1.3], "WC|Other": [2500, 1.0],
      "Auto|Vehicle/Parking": [6000, 1.1],
    },
    idPrefix: { Property: "PR", GL: "GL", WC: "WC", Auto: "AU" },
    litProb: (cov, cat) => (cov === "GL" && cat === "Assault/Security" ? 0.45 : cov === "GL" && (cat === "Slip/Trip/Fall" || cat === "Pool/Amenity") ? 0.14 : cov === "GL" ? 0.07 : cov === "WC" ? 0.05 : 0),
    claimant: (cov) => (cov === "Property" ? "Insured" : cov === "Auto" ? "Third party" : ""),
    bodyPart: {
      covs: ["GL", "WC"],
      byCat: { "Slip/Trip/Fall": ["Stairwell", "Parking lot", "Sidewalk", "Lobby", "Pool deck", "Unit interior"], "Assault/Security": ["Parking garage", "Parking lot", "Common area"], "Dog Bite/Animal": ["Courtyard", "Common area", "Dog park"], "Pool/Amenity": ["Pool", "Fitness center", "Playground"], "Habitability/Pests": ["Unit interior"], "Vehicle/Parking": ["Parking lot", "Parking garage", "Gate"], "Water Damage": ["Unit interior"], "Strain/Lifting": ["Unit interior", "Maintenance shop", "Grounds"], "Cut/Puncture": ["Unit interior", "Maintenance shop"], Other: ["Common area", "Grounds"] },
    },
    jobTitle: {
      covs: ["GL", "WC"],
      wcValue: "Employee",
      byCat: {
        "Slip/Trip/Fall": [["Resident", 55], ["Guest/visitor", 30], ["Vendor", 8], ["Trespasser", 7]],
        "Assault/Security": [["Resident", 60], ["Guest/visitor", 40]],
        "Dog Bite/Animal": [["Resident", 70], ["Guest/visitor", 30]],
        "Pool/Amenity": [["Resident", 60], ["Guest/visitor", 40]],
        "Habitability/Pests": [["Resident", 100]],
        "Vehicle/Parking": [["Resident", 70], ["Guest/visitor", 30]],
        "Water Damage": [["Resident", 100]],
        Other: [["Resident", 50], ["Guest/visitor", 30], ["Vendor", 20]],
      },
    },
    nature: { covs: ["WC"], byCat: { "Strain/Lifting": "Strain", "Slip/Trip/Fall": "Sprain", "Cut/Puncture": "Laceration", "Dog Bite/Animal": "Puncture", "Vehicle/Parking": "Strain", "Assault/Security": "Contusion", Other: "Contusion" } },
    osha: {
      natureByCat: {
        "Slip/Trip/Fall": ["Sprain/Strain", "Fracture", "Contusion", "Multiple Injuries"],
        "Strain/Lifting": ["Sprain/Strain", "Soreness"],
        "Cut/Puncture": ["Laceration", "Abrasion"],
        "Dog Bite/Animal": ["Laceration", "Contusion"],
        "Vehicle/Parking": ["Sprain/Strain", "Contusion", "Multiple Injuries"],
        "Assault/Security": ["Contusion", "Multiple Injuries"],
        Other: ["Contusion", "Burn", "Chemical Burn", "Fracture"],
      },
    },
    dow: DOW_FLAT,
    plants: [
      { unit: "Canyon View", n: 6, cov: "Property", cat: "Water Damage" },
      { unit: "Desert Palms", n: 3, cov: "GL", cat: "Assault/Security" },
      { unit: "Parkside Lofts", n: 4, cov: "GL", cat: "Slip/Trip/Fall" },
      { unit: "Willow Creek", n: 3, cov: "GL", cat: "Habitability/Pests" },
    ],
    large: [
      { unit: "Desert Palms", date: [2026, 1, 24], cov: "GL", cat: "Assault/Security", amount: 480000, lit: true, body: "Parking garage", job: "Resident", desc: "Resident assaulted in the garage; gate had been broken for weeks; negligent security suit filed." },
      { unit: "Canyon View", date: [2026, 8, 5], cov: "Property", cat: "Water Damage", amount: 210000, lit: false, desc: "Supply line failure on the 4th floor; 11 units affected; residents relocated." },
      { unit: "Willow Creek", date: [2025, 10, 14], cov: "Property", cat: "Fire/Smoke", amount: 350000, lit: false, desc: "Unattended cooking fire spread to the attic; 6 units down." },
      { unit: "Harbor Point", date: [2025, 6, 30], cov: "GL", cat: "Pool/Amenity", amount: 165000, lit: true, body: "Pool", job: "Guest/visitor", desc: "Child injured at the pool; gate latch broken." },
    ],
  },
};


/* ======================================================================
   General (any other industry)
   ====================================================================== */
const general: Industry = {
  id: "general",
  name: "General",
  title: "Loss dashboard",
  deck: "Loss review",
  unit: { one: "location", many: "locations", One: "Location", Many: "Locations" },
  coverages: [
    { key: "WC", label: "Workers' comp", short: "WC", match: WC },
    { key: "GL", label: "General liability", short: "GL", match: GL },
    { key: "Auto", label: "Auto", short: "Auto", match: AUTO },
    { key: "Property", label: "Property", short: "Property", match: PROP },
  ],
  matchOrder: ["WC", "Auto", "GL", "Property"],
  categories: ["Slip/Trip/Fall", "Strain/Lifting", "Struck By/Caught", "Cut/Puncture", "Burn/Exposure", "Assault/Violence", "Vehicle", "Products/Completed Work", "Fire/Smoke", "Water Damage", "Theft/Vandalism", "Other"],
  rules: [
    ["Products/Completed Work", [/product/, /completed (work|op)/, /defect/, /recall/, /faulty/, /malfunction/, /workmanship/, /warranty/]],
    ["Assault/Violence", [/assault/, /robber|robbed|\barmed\b/, /altercation|\bfight/, /attack/, /violen/, /threat/, /punch|\bshot\b|shooting|\bgun\b|stabb?/, /bit(ten)? by|\bbite\b|dog/]],
    ["Theft/Vandalism", [/theft|stolen|steal/, /burglar|break-? ?in|broke in/, /vandal|graffiti/]],
    ["Vehicle", [/vehicle/, /\bauto\b/, /\b(car|truck|van|forklift)\b/, /collision|crash/, /rear-? ?end/, /back(ed|ing)? into/, /\bdriv(e|er|ing)\b/, /\bmv[ac]\b/, /motor/, /parked/, /boat|vessel/]],
    ["Struck By/Caught", [/struck/, /\bstrike\b|\bhit\b/, /bump(ed)?/, /caught (in|between|on)/, /pinch/, /falling object|flying object/, /(fell|dropped) on (his|her|their|the)? ?(foot|feet|hand|toe|head)/, /crush/, /machine|conveyor|press\b/, /collaps/]],
    ["Slip/Trip/Fall", [/slip/, /\btrip/, /\bfall\b|falling|\bfell\b/, /wet floor/, /\bice\b|\bicy\b/, /\bstairs?\b|\bsteps?\b/, /ladder/, /uneven/, /\bcurb\b/, /same level|different level|from height/]],
    ["Burn/Exposure", [/burn/, /scald/, /chemical/, /exposure|exposed/, /inhal/, /fume/, /\bheat\b|hot (water|liquid|surface)/, /electric|shock/, /noise|hearing/]],
    ["Cut/Puncture", [/\bcut\b|\bcuts\b|\bcutting\b/, /lacerat/, /knife|knives|blade/, /puncture/, /glass/, /\bsharp/, /box cutter/, /hook/]],
    ["Strain/Lifting", [/strain/, /sprain/, /\blift/, /carry/, /\bpush/, /\bpull/, /overexert/, /repetitive|cumulative|carpal/, /twist/, /bend(ing)?\b/, /reach(ing)?\b/, /ergonom/, /heavy/]],
    ["Fire/Smoke", [/\bfire\b/, /smoke/, /explosion/]],
    ["Water Damage", [/water/, /\bleak/, /flood/, /\bpipe/, /sewer|sewage/, /\broof/, /sprinkler/, /\bdrain/, /storm|hail|wind/]],
  ],
  boost: { Property: ["Fire/Smoke", "Water Damage", "Theft/Vandalism"], Auto: ["Vehicle"], GL: ["Products/Completed Work"] },
  fallback: { Auto: "Vehicle" },
  fields: {
    location: { label: "Location / site", header: "Location", extraSynonyms: ["site", "sitename", "branch", "facility", "plant", "office", "store", "unit", "division"], example: "Ontario Warehouse" },
    bodyPart: { label: "Body part", header: "Body Part", help: "WC only. Feeds the body part chart.", example: "Lower Back" },
    jobTitle: { label: "Job title / department", header: "Job Title", help: "WC only. Shows which roles get hurt.", example: "Warehouse Associate" },
  },
  details: [
    { field: "bodyPart", title: "Workers' comp: body part", subtitle: "Most frequent injuries", coverages: ["WC"], file: "wc-body-part" },
    { field: "jobTitle", title: "Workers' comp: job title", subtitle: "Who gets hurt", coverages: ["WC"], file: "wc-job-title" },
  ],
  dowNote: "Most workplaces peak midweek",
  exposure: "headcount, payroll or hours worked",
  benchmark: "company of your size",
  bls: { default: "private", options: ["private", "31-33", "42", "44-45", "48-49", "56", "62", "71"], mix: "private" },
  sample: {
    seed: 31,
    company: "Sample Company",
    sourceName: "Sample Company loss run (synthetic)",
    annualPerUnit: 7.5,
    trend: 1.03,
    units: [
      { name: "Anaheim Plant", region: "West", state: "CA", mult: 1.5 },
      { name: "Ontario Warehouse", region: "West", state: "CA", mult: 1.3 },
      { name: "Corporate Office", region: "West", state: "CA", mult: 0.3 },
      { name: "Sacramento Branch", region: "West", state: "CA", mult: 0.8 },
      { name: "Phoenix Branch", region: "Southwest", state: "AZ", mult: 0.9 },
      { name: "Las Vegas Branch", region: "Southwest", state: "NV", mult: 0.8, late: true },
      { name: "Reno Distribution Center", region: "Southwest", state: "NV", mult: 1.2 },
      { name: "Dallas Branch", region: "Texas", state: "TX", mult: 1.0 },
      { name: "Austin Branch", region: "Texas", state: "TX", mult: 0.7, from: 2023 },
      { name: "Denver Branch", region: "Mountain", state: "CO", mult: 0.8 },
    ],
    coverageMix: [["WC", 55], ["GL", 18], ["Auto", 17], ["Property", 10]],
    mix: {
      WC: WC_MIX.general,
      GL: [["Slip/Trip/Fall", 45], ["Products/Completed Work", 25], ["Struck By/Caught", 10], ["Assault/Violence", 5], ["Other", 15]],
      Auto: [["Vehicle", 100]],
      Property: [["Water Damage", 40], ["Fire/Smoke", 15], ["Theft/Vandalism", 30], ["Other", 15]],
    },
    covText: { WC: ["Workers' Comp", "WC", "Workers Compensation"], GL: ["General Liability", "GL"], Auto: ["Auto Liability", "Commercial Auto", "Auto Physical Damage"], Property: ["Property"] },
    causeText: {
      "Slip/Trip/Fall": ["Slip, Trip, Fall - Same Level", "Fall from ladder", "Tripped over pallet", "Slipped on wet floor"],
      "Strain/Lifting": ["Strain - Lifting", "Strain - Pushing or Pulling", "Repetitive motion", "Strain - Carrying"],
      "Struck By/Caught": ["Struck By - Falling Object", "Caught In or Between", "Struck by forklift load", "Hand caught in machine"],
      "Cut/Puncture": ["Cut, Puncture, Scrape - Hand Tool", "Laceration - box cutter", "Cut on sheet metal"],
      "Burn/Exposure": ["Chemical exposure", "Burn - hot surface", "Electrical shock"],
      "Assault/Violence": ["Assault - customer", "Workplace violence", "Dog bite on site visit"],
      Vehicle: ["Auto - rear-end collision", "Backed into fixed object", "Forklift collision", "Vehicle hit while parked"],
      "Products/Completed Work": ["Product defect - injury alleged", "Completed work - property damage", "Faulty installation"],
      "Fire/Smoke": ["Fire - electrical", "Smoke damage"],
      "Water Damage": ["Water damage - pipe leak", "Roof leak - storm", "Sprinkler discharge"],
      "Theft/Vandalism": ["Burglary - break-in", "Theft of tools", "Vandalism"],
      Other: ["Other", "Miscellaneous", "Other - see notes"],
    },
    causeTextByCov: {
      "GL|Slip/Trip/Fall": ["Customer slipped in lobby", "Visitor tripped in parking lot", "Vendor fell on loading dock"],
      "GL|Struck By/Caught": ["Visitor struck by door", "Customer struck by falling stock"],
      "GL|Other": ["Third-party property damage", "Other - see notes"],
    },
    detail: {
      "Slip/Trip/Fall": ["Wet floor near the dock door.", "Tripped over a pallet jack.", "Missed the last step of a ladder.", "Ice in the parking lot."],
      "Strain/Lifting": ["Lifting a 60 lb box from the floor.", "Pulling a loaded pallet jack.", "Stacking product overhead.", "Repetitive scanning at packing."],
      "Struck By/Caught": ["Box fell from the top rack.", "Glove caught in a conveyor.", "Load shifted off a forklift."],
      "Cut/Puncture": ["Box cutter slipped opening a case.", "Cut on a sharp metal edge.", "Broken glass while cleaning up."],
      "Burn/Exposure": ["Cleaner splashed in the eyes.", "Touched a hot press.", "Shock from a damaged cord."],
      "Assault/Violence": ["Customer became aggressive at the counter.", "Bitten by a dog during a site visit."],
      Vehicle: ["Rear-ended at a light.", "Backed into a pole in the yard.", "Forklift struck a racking upright."],
      "Products/Completed Work": ["Customer says the part failed in use.", "Leak after an install."],
      "Fire/Smoke": ["Electrical short in the break room.", "Small fire in the trash compactor."],
      "Water Damage": ["Pipe burst over the office.", "Roof leak during a storm."],
      "Theft/Vandalism": ["Tools stolen from a van overnight.", "Graffiti on the building."],
      Other: ["See adjuster notes.", "Details pending."],
    },
    sev: {
      "WC|Slip/Trip/Fall": [5200, 1.3], "WC|Strain/Lifting": [6000, 1.3], "WC|Struck By/Caught": [3500, 1.2], "WC|Cut/Puncture": [1400, 1.0], "WC|Burn/Exposure": [2500, 1.1], "WC|Assault/Violence": [3000, 1.2], "WC|Vehicle": [8000, 1.3],
      "GL|Slip/Trip/Fall": [9000, 1.35], "GL|Products/Completed Work": [12000, 1.4], "GL|Struck By/Caught": [4000, 1.2], "GL|Assault/Violence": [7000, 1.3], "GL|Other": [2500, 1.0],
      "Auto|Vehicle": [6500, 1.2],
      "Property|Water Damage": [14000, 1.1], "Property|Fire/Smoke": [30000, 1.3], "Property|Theft/Vandalism": [4500, 1.0], "Property|Other": [3000, 1.0],
    },
    idPrefix: { WC: "WC", GL: "GL", Auto: "AU", Property: "PR" },
    litProb: (cov, cat) => (cov === "GL" && (cat === "Slip/Trip/Fall" || cat === "Products/Completed Work") ? 0.12 : cov === "GL" ? 0.05 : cov === "WC" && (cat === "Strain/Lifting" || cat === "Slip/Trip/Fall") ? 0.08 : cov === "Auto" ? 0.08 : cov === "WC" ? 0.03 : 0),
    claimant: (cov) => (cov === "GL" ? "Customer" : cov === "Auto" ? "Third party" : cov === "Property" ? "Insured" : ""),
    bodyPart: {
      covs: ["WC"],
      byCat: { "Slip/Trip/Fall": ["Knee", "Lower Back", "Ankle", "Wrist"], "Strain/Lifting": ["Lower Back", "Shoulder", "Neck"], "Struck By/Caught": ["Hand", "Head", "Foot"], "Cut/Puncture": ["Hand", "Fingers"], "Burn/Exposure": ["Hand", "Eye"], "Assault/Violence": ["Head", "Multiple"], Vehicle: ["Neck", "Back", "Multiple"] },
    },
    jobTitle: {
      covs: ["WC", "Auto"],
      byCat: {
        "Slip/Trip/Fall": [["Warehouse Associate", 35], ["Maintenance Tech", 20], ["Machine Operator", 15], ["Driver", 15], ["Office Staff", 15]],
        "Strain/Lifting": [["Warehouse Associate", 45], ["Machine Operator", 20], ["Driver", 15], ["Maintenance Tech", 10], ["Supervisor", 10]],
        "Struck By/Caught": [["Machine Operator", 45], ["Warehouse Associate", 35], ["Maintenance Tech", 20]],
        "Cut/Puncture": [["Warehouse Associate", 45], ["Machine Operator", 35], ["Maintenance Tech", 20]],
        "Burn/Exposure": [["Maintenance Tech", 50], ["Machine Operator", 50]],
        "Assault/Violence": [["Sales Rep", 50], ["Driver", 30], ["Supervisor", 20]],
        Vehicle: [["Driver", 70], ["Sales Rep", 30]],
      },
    },
    nature: { covs: ["WC"], byCat: { "Slip/Trip/Fall": "Contusion", "Strain/Lifting": "Strain", "Struck By/Caught": "Contusion", "Cut/Puncture": "Laceration", "Burn/Exposure": "Burn", "Assault/Violence": "Contusion", Vehicle: "Strain" } },
    osha: {
      bodyByCat: {
        "Slip/Trip/Fall": ["Knee", "Back", "Ankle", "Wrist", "Trunk", "Head", "Leg", "Shoulder", "Multiple"],
        "Strain/Lifting": ["Back", "Shoulder", "Neck", "Knee", "Wrist", "Arm", "Trunk"],
        "Struck By/Caught": ["Hand", "Head", "Foot", "Shoulder", "Arm", "Leg", "Eye"],
        "Cut/Puncture": ["Hand", "Arm", "Wrist", "Leg"],
        "Burn/Exposure": ["Hand", "Eye", "Arm", "Body systems"],
        "Assault/Violence": ["Head", "Multiple", "Hand"],
        Vehicle: ["Neck", "Back", "Multiple", "Head", "Shoulder"],
      },
      natureByCat: {
        "Slip/Trip/Fall": ["Sprain/Strain", "Fracture", "Contusion", "Multiple Injuries", "Soreness"],
        "Strain/Lifting": ["Sprain/Strain", "Soreness", "Carpal Tunnel", "Tendonitis"],
        "Struck By/Caught": ["Contusion", "Fracture", "Laceration", "Amputation"],
        "Cut/Puncture": ["Laceration", "Abrasion"],
        "Burn/Exposure": ["Burn", "Chemical Burn"],
        "Assault/Violence": ["Contusion", "Laceration", "Multiple Injuries"],
        Vehicle: ["Sprain/Strain", "Contusion", "Fracture", "Multiple Injuries"],
      },
    },
    dow: DOW_WEEKDAY,
    plants: [
      { unit: "Ontario", n: 5, cov: "WC", cat: "Strain/Lifting", job: "Warehouse Associate", body: "Lower Back" },
      { unit: "Anaheim", n: 3, cov: "WC", cat: "Struck By/Caught", job: "Machine Operator", body: "Hand" },
      { unit: "Dallas", n: 3, cov: "Auto", cat: "Vehicle" },
      { unit: "Reno", n: 3, cov: ["WC", "GL", "WC"], cat: "Slip/Trip/Fall" },
    ],
    large: [
      { unit: "Anaheim", date: [2026, 3, 9], cov: "WC", cat: "Struck By/Caught", amount: 142000, lit: true, job: "Machine Operator", body: "Hand", desc: "Hand caught in an unguarded press; partial finger amputation; attorney represented." },
      { unit: "Dallas", date: [2025, 10, 17], cov: "Auto", cat: "Vehicle", amount: 118000, lit: true, desc: "Company truck rear-ended a stopped car on the freeway; third party injured." },
      { unit: "Reno", date: [2025, 6, 2], cov: "Property", cat: "Water Damage", amount: 96000, lit: false, desc: "Roof drain clogged in a storm; water damaged stock and racking." },
    ],
  },
};

/** Which template fits a NAICS code. Anything not listed uses the General template. */
export function profileForNaics(code: string | null | undefined): IndustryId {
  const c = String(code ?? "").replace(/\D/g, "");
  if (/^722/.test(c)) return "restaurant";
  if (/^23/.test(c)) return "construction";
  if (/^(484|485|4884|492|5621)/.test(c)) return "fleet";
  if (/^(531|721)/.test(c)) return "realestate";
  return "general";
}

export const INDUSTRIES: Industry[] = [restaurant, construction, fleet, realestate, general];
export const getIndustry = (id: string | null | undefined): Industry => INDUSTRIES.find((i) => i.id === id) ?? restaurant;
export const SAMPLE_COMPANIES = new Set(INDUSTRIES.map((i) => i.sample.company));

export function coverageLabel(ind: Industry, key: string) {
  return ind.coverages.find((c) => c.key === key)?.label ?? "Other";
}
export function coverageShort(ind: Industry, key: string) {
  return ind.coverages.find((c) => c.key === key)?.short ?? "Other";
}
