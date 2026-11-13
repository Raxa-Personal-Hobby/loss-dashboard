import type { FieldKey } from "./types";
import type { Industry } from "./industries";

export interface FieldDef {
  key: FieldKey;
  label: string;
  required?: boolean;
  money?: boolean; // several columns may be summed
  synonyms: string[]; // normalized (lowercase, letters and digits only)
  parts?: string[]; // money component columns that get summed when no total column exists
  help: string;
  example: string;
  header?: string; // column name used in the template and sample file
}

export const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

export const FIELDS: FieldDef[] = [
  {
    key: "claimNumber",
    label: "Claim number",
    synonyms: ["claimnumber", "claimno", "claim", "claimid", "claimnum", "filenumber", "fileno", "claimref", "claimreference", "occurrencenumber", "carrierclaimnumber", "tpaclaimnumber"],
    help: "Unique claim ID from the carrier or TPA.",
    example: "WC-25-00412",
  },
  {
    key: "location",
    label: "Location",
    required: true,
    synonyms: ["location", "locationname", "site", "sitename", "locationcode", "loc", "branch", "locationnumber", "facility", "premises", "locationid", "locationdescription"],
    help: "Every chart can be filtered by this.",
    example: "Main Street",
  },
  {
    key: "region",
    label: "Region / district",
    synonyms: ["region", "district", "market", "area", "division", "zone", "territory", "regionname", "districtname", "operatingregion"],
    help: "Optional grouping above store level.",
    example: "SoCal",
  },
  {
    key: "state",
    label: "State",
    synonyms: ["state", "st", "lossstate", "jurisdiction", "jurisdictionstate", "accidentstate", "benefitstate", "locationstate", "incidentstate"],
    help: "Two-letter state of the loss.",
    example: "CA",
  },
  {
    key: "coverage",
    label: "Line of coverage",
    synonyms: ["coverage", "line", "lob", "lineofbusiness", "lineofcoverage", "coveragetype", "policytype", "coveragecode", "coverageline", "coveragemajor", "majorcoverage", "linetype"],
    help: "WC, GL, Auto, Property. Free text works (\"Workers Compensation\", \"Gen Liab\").",
    example: "Workers' Comp",
  },
  {
    key: "lossDate",
    label: "Date of loss",
    required: true,
    synonyms: ["dateofloss", "lossdate", "dol", "incidentdate", "accidentdate", "dateofinjury", "doi", "injurydate", "occurrencedate", "dateofincident", "eventdate", "dateofaccident", "dateofoccurrence"],
    help: "When the incident happened. Drives every year-over-year view.",
    example: "03/14/2025",
  },
  {
    key: "reportDate",
    label: "Date reported",
    synonyms: ["datereported", "reportdate", "reporteddate", "noticedate", "datenotified", "receiveddate", "dateofnotice", "reportedtocarrier", "datereceived", "notificationdate", "dateentered", "entereddate", "reportedtoemployer", "employernoticedate", "opendate", "dateopened", "openeddate", "reportedtoinsurer", "datereportedtocarrier"],
    help: "When the claim was reported. Used for report lag.",
    example: "03/15/2025",
  },
  {
    key: "closeDate",
    label: "Date closed",
    synonyms: ["closedate", "dateclosed", "closeddate", "closingdate"],
    help: "Optional. Helps set status when no status column exists.",
    example: "08/01/2025",
  },
  {
    key: "status",
    label: "Claim status",
    synonyms: ["status", "claimstatus", "openclosed", "statuscode", "claimstat", "openclose", "currentstatus"],
    help: "Open, Closed, Reopened.",
    example: "Open",
  },
  {
    key: "cause",
    label: "Cause of loss",
    synonyms: ["cause", "causeofloss", "losscause", "causeofinjury", "injurycause", "accidenttype", "losstype", "causedescription", "causecode", "incidenttype", "typeofloss", "accidentcause", "mechanism", "causeofaccident", "mechanismofinjury", "losscausedescription", "accidentdescriptioncode"],
    help: "Carrier cause code or text. Grouped into restaurant loss categories automatically.",
    example: "Burn - fryer oil splash",
  },
  {
    key: "bodyPart",
    label: "Body part",
    synonyms: ["bodypart", "partofbody", "injuredbodypart", "bodypartdescription", "bodypartinjured"],
    help: "WC only. Feeds the body part chart.",
    example: "Hand",
  },
  {
    key: "injury",
    label: "Nature of injury",
    synonyms: ["natureofinjury", "injurytype", "nature", "injury", "injurydescription", "typeofinjury", "natureofinjurydescription"],
    help: "WC only.",
    example: "Burn",
  },
  {
    key: "jobTitle",
    label: "Job title / department",
    synonyms: ["occupation", "jobtitle", "position", "department", "jobclass", "job", "title", "role", "dept", "jobdescription", "employeeoccupation", "positiontitle"],
    help: "WC only. Shows which roles get hurt.",
    example: "Line Cook",
  },
  {
    key: "claimant",
    label: "Claimant",
    synonyms: ["claimant", "claimantname", "employee", "employeename", "injuredparty", "injuredworker", "name", "injuredname", "claimantfullname", "insuredname"],
    help: "Kept out of exports by default.",
    example: "C-10442",
  },
  {
    key: "paid",
    label: "Total paid",
    money: true,
    synonyms: ["totalpaid", "paid", "paidtodate", "paidtotal", "grosspaid", "netpaid", "paidamount", "totalpaidtodate", "amountpaid", "totalnetpaid", "totalgrosspaid"],
    parts: ["medicalpaid", "indemnitypaid", "expensepaid", "medpaid", "indpaid", "exppaid", "paidmedical", "paidindemnity", "paidexpense", "alaepaid", "legalpaid", "paidalae", "bipaid", "pdpaid", "paidbi", "paidpd", "losspaid", "paidloss"],
    help: "Paid to date. Several paid columns (medical, indemnity, expense) are added together.",
    example: "4,250.00",
  },
  {
    key: "reserve",
    label: "Outstanding reserve",
    money: true,
    synonyms: ["outstanding", "reserve", "reserves", "osreserve", "outstandingreserve", "totalreserve", "totaloutstanding", "openreserve", "currentreserve", "totalos", "os", "remainingreserve", "totalreserves", "outstandingreserves", "netoutstanding"],
    parts: ["medicalreserve", "indemnityreserve", "expensereserve", "medicaloutstanding", "indemnityoutstanding", "expenseoutstanding", "medreserve", "indreserve", "expreserve", "alaereserve", "reservemedical", "reserveindemnity", "reserveexpense", "outstandingmedical", "outstandingindemnity", "outstandingexpense"],
    help: "Open reserves. Several reserve columns are added together.",
    example: "12,000.00",
  },
  {
    key: "incurred",
    label: "Total incurred",
    money: true,
    synonyms: ["totalincurred", "incurred", "grossincurred", "netincurred", "totalcost", "incurredtotal", "totalincurredloss", "incurredamount", "totalnetincurred", "totalgrossincurred", "incurredtodate"],
    parts: ["medicalincurred", "indemnityincurred", "expenseincurred", "medincurred", "indincurred", "expincurred", "alaeincurred", "incurredmedical", "incurredindemnity", "incurredexpense", "lossincurred", "incurredloss"],
    help: "Paid plus reserve. If missing, the dashboard adds paid and reserve for you.",
    example: "16,250.00",
  },
  {
    key: "litigated",
    label: "Litigated",
    synonyms: ["litigated", "litigation", "suit", "insuit", "attorney", "attorneyinvolved", "attyrep", "represented", "attorneyrep", "litigationflag", "suitfiled", "attorneyrepresented", "litigationstatus"],
    help: "Y/N, Yes/No, or any non-blank attorney or suit value.",
    example: "N",
  },
  {
    key: "description",
    label: "Loss description",
    synonyms: ["description", "lossdescription", "accidentdescription", "narrative", "claimdescription", "incidentdescription", "descriptionofloss", "howinjuryoccurred", "comments", "notes", "details", "accidentnarrative", "descriptionofincident", "lossnarrative"],
    help: "Used to group claims when the cause column is blank.",
    example: "Hot oil splashed on forearm while filtering fryer",
  },
  {
    key: "recordable",
    label: "OSHA recordable",
    synonyms: ["osharecordable", "recordable", "oshareportable", "osha", "oshacase", "osharecord", "oshalog", "osha300", "isrecordable", "recordablecase", "recordableyn", "oshayn", "oshaflag", "reportabletoosha", "oshareportableyn", "osharecordableyn"],
    help: "Optional. Yes or No: does this case go on the OSHA 300 log? Unlocks TRIR.",
    example: "Yes",
  },
  {
    key: "caseType",
    label: "OSHA case type",
    synonyms: ["oshacasetype", "casetype", "oshaclassification", "caseclassification", "oshaclass", "osha300classification", "oshacategory", "recordabletype", "oshatype", "oshacaseclassification", "classifycase"],
    help: "Optional. Days away, Job transfer or restriction, Other recordable, or Not recordable. Unlocks the DART rate.",
    example: "Days away",
  },
  {
    key: "daysAway",
    label: "Days away from work",
    synonyms: ["daysaway", "daysawayfromwork", "lostdays", "lostworkdays", "dayslost", "losttimedays", "dafwdays", "daysawaycount", "totaldaysaway", "oshadaysaway", "daysawayfromworkdays", "numberofdaysaway", "awayfromworkdays"],
    help: "Optional. Number of days away (OSHA 300 column K). Counts toward the lost time rate.",
    example: "12",
  },
  {
    key: "daysRestricted",
    label: "Days of job transfer or restriction",
    synonyms: ["daysrestricted", "restricteddays", "daysofrestriction", "daysjobtransferorrestriction", "daysjobtransfer", "jobtransferdays", "transferdays", "restricteddutydays", "lightdutydays", "modifieddutydays", "djtrdays", "daysonrestriction", "daysrestrictedortransferred", "daysonjobtransferorrestriction", "numberofdaysrestricted"],
    help: "Optional. Number of days on restricted duty or job transfer (OSHA 300 column L).",
    example: "5",
  },
];

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<FieldKey, FieldDef>;

export function emptyMapping() {
  return Object.fromEntries(FIELDS.map((f) => [f.key, [] as number[]])) as Record<FieldKey, number[]>;
}

function scoreHeader(h: string, f: FieldDef): { score: number; part: boolean } {
  if (!h) return { score: 0, part: false };
  if (f.synonyms.includes(h)) return { score: 100, part: false };
  if (f.parts?.includes(h)) return { score: 88, part: true };
  let best = 0;
  let part = false;
  for (const s of f.synonyms) {
    if (s.length >= 4 && h.includes(s)) best = Math.max(best, 55 + Math.min(20, s.length));
    else if (h.length >= 4 && s.startsWith(h)) best = Math.max(best, 52);
  }
  for (const s of f.parts ?? []) {
    if (s.length >= 6 && h.includes(s) && 80 > best) {
      best = 80;
      part = true;
    }
  }
  return { score: best, part };
}

const HEADERS: Record<FieldKey, string> = {
  claimNumber: "Claim Number", location: "Location", region: "Region", state: "State", coverage: "Line of Coverage", lossDate: "Date of Loss", reportDate: "Date Reported",
  closeDate: "Date Closed", status: "Claim Status", cause: "Cause of Loss", bodyPart: "Body Part", injury: "Nature of Injury", jobTitle: "Job Title", claimant: "Claimant",
  paid: "Total Paid", reserve: "Outstanding Reserve", incurred: "Total Incurred", litigated: "Litigated", description: "Loss Description",
  recordable: "OSHA Recordable", caseType: "OSHA Case Type", daysAway: "Days Away From Work", daysRestricted: "Days Restricted or Transferred",
};

/** OSHA columns are optional extras; the template groups them after the claim columns. */
export const OSHA_KEYS: FieldKey[] = ["recordable", "caseType", "daysAway", "daysRestricted"];

/** The standard fields with one industry's labels and header names layered on top. */
export function fieldsFor(ind: Industry): FieldDef[] {
  return FIELDS.map((f) => {
    const o = ind.fields[f.key];
    const header = o?.header ?? HEADERS[f.key];
    if (!o) return { ...f, header };
    const synonyms = [...new Set([...(o.synonyms ?? f.synonyms), ...(o.extraSynonyms ?? []), norm(header)])];
    return { ...f, label: o.label ?? f.label, help: o.help ?? f.help, example: o.example ?? f.example, header, synonyms };
  });
}

/** How strongly a header row looks like loss-run headers. */
export function headerRowScore(row: unknown[], fields: FieldDef[] = FIELDS) {
  let n = 0;
  for (const cell of row) {
    const h = norm(cell);
    if (!h || h.length > 40) continue;
    if (fields.some((f) => scoreHeader(h, f).score >= 80)) n++;
  }
  return n;
}

export function autoMap(headers: unknown[], fields: FieldDef[] = FIELDS) {
  const byKey = Object.fromEntries(fields.map((f) => [f.key, f])) as Record<FieldKey, FieldDef>;
  const mapping = emptyMapping();
  const hs = headers.map(norm);
  const cands: { col: number; key: FieldKey; score: number; part: boolean }[] = [];
  hs.forEach((h, col) => {
    for (const f of fields) {
      const { score, part } = scoreHeader(h, f);
      if (score >= 52) cands.push({ col, key: f.key, score, part });
    }
  });
  cands.sort((a, b) => b.score - a.score || a.col - b.col);
  const used = new Set<number>();
  // Pass 1: whole fields (one column each)
  for (const c of cands) {
    if (c.part || used.has(c.col) || mapping[c.key].length) continue;
    mapping[c.key] = [c.col];
    used.add(c.col);
  }
  // Pass 2: money components get summed when no total column was found
  for (const c of cands) {
    if (!c.part || used.has(c.col)) continue;
    const f = byKey[c.key];
    if (!f.money) continue;
    const hasTotal = mapping[c.key].some((col) => f.synonyms.includes(hs[col]));
    if (hasTotal) continue;
    mapping[c.key] = [...mapping[c.key], c.col];
    used.add(c.col);
  }
  return mapping;
}
