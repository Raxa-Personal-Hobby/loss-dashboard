// Builds GUIDANCE.md from data/loss-prevention-guidance.json.
// Run from the repo root:  node scripts/build-guidance-md.mjs
import { readFileSync, writeFileSync } from "node:fs";

const D = JSON.parse(readFileSync("data/loss-prevention-guidance.json", "utf8"));

const TEMPLATES = [
  ["restaurant", "Restaurant"],
  ["construction", "Construction"],
  ["fleet", "Fleet"],
  ["realestate", "Real estate"],
  ["general", "General (any other industry)"],
];
const FINDINGS = [
  ["largeOpen", "Open large loss"],
  ["largeLitigated", "Open large loss in litigation"],
  ["largeMore", "More open large losses"],
  ["frequency", "Claim count up vs last year"],
  ["severity", "Average claim cost up vs last year"],
  ["lateReporting", "Late reporting"],
  ["litigation", "Litigation rate"],
  ["repeatPeople", "Drivers with 2 or more claims (fleet)"],
  ["aging", "Claims open more than a year"],
  ["dataQuality", "Claims with no clear cause"],
  ["dart", "DART rate above the benchmark"],
  ["rateRise", "TRIR up vs the prior year"],
  ["hotLocations", "Locations at 2x the benchmark TRIR"],
];

const cell = (t) => String(t).replace(/\|/g, "\\|").replace(/\n/g, " ");
const srcRefs = (g) => (g.sources.length ? g.sources.map((s) => `[${cell(D.sources[s].agency)}: ${cell(D.sources[s].title)}](${D.sources[s].url})`).join("; ") : "None (not a safety topic)");
const label = (g) => D.kinds[g.kind];
const checked = new Date(`${D.checked}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

const out = [];
out.push("# Loss prevention guidance");
out.push("");
out.push("Every finding in the dashboard shows a short piece of guidance and links to where it came from. This file lists all of it.");
out.push("");
out.push("| Question | Answer |");
out.push("|---|---|");
out.push("| Where the guidance comes from | Public U.S. government sources (OSHA, NIOSH, CDC, FDA, USDA, EPA, FMCSA, PHMSA, FHWA, CPSC, FEMA, DOL, DOJ), plus published research for late reporting |");
out.push("| Who wrote the text | It's our own short summary of what each source says. Nothing is copied from an employer, client, carrier or broker |");
out.push("| Is it advice | No. See the disclaimer below |");
out.push(`| Sources last checked | ${checked} |`);
out.push("| Where it lives | `data/loss-prevention-guidance.json` (the app reads this file). This page is built from it |");
out.push("");
out.push("## Disclaimer");
out.push("");
out.push(`> ${D.disclaimer}`);
out.push("");
out.push("The guidance describes what each source covers. It doesn't tell anyone what to do, and it isn't a complete list of what a source says or what the law requires. Federal OSHA rules don't apply in every case (for example, to some public employers or where a state runs its own OSHA plan), and state and local rules can be stricter.");
out.push("");
out.push("## Labels you'll see");
out.push("");
out.push("| Label | Meaning |");
out.push("|---|---|");
out.push(`| ${D.kinds.public} | Summary of a government source, with a link |`);
out.push(`| ${D.kinds.research} | Summary of published research, with a link |`);
out.push(`| ${D.kinds.review} | Not a safety topic. Points to the kind of professional who handles it (carrier, TPA, counsel) |`);
out.push(`| ${D.kinds.note} | A note about reading the numbers. No outside source needed |`);
out.push("");

for (const [id, name] of TEMPLATES) {
  out.push(`## ${name}: guidance by cause`);
  out.push("");
  out.push("| Cause | Label | Guidance | Sources |");
  out.push("|---|---|---|---|");
  for (const [cause, gid] of Object.entries(D.causes[id])) {
    const g = D.guides[gid];
    out.push(`| ${cell(cause)} | ${label(g)} | ${cell(g.text)} | ${srcRefs(g)} |`);
  }
  out.push("");
}

out.push("## Findings that aren't tied to one cause");
out.push("");
out.push("Safety-rate findings for TRIR use the guidance for the top recordable cause.");
out.push("");
out.push("| Finding | Label | Guidance | Sources |");
out.push("|---|---|---|---|");
for (const [key, name] of FINDINGS) {
  const v = D.findings[key];
  if (typeof v === "string") {
    const g = D.guides[v];
    out.push(`| ${name} | ${label(g)} | ${cell(g.text)} | ${srcRefs(g)} |`);
  } else {
    const seen = new Map();
    for (const [ind, gid] of Object.entries(v)) seen.set(gid, [...(seen.get(gid) ?? []), ind]);
    for (const [gid, inds] of seen) {
      const g = D.guides[gid];
      const who = inds.length === Object.keys(v).length ? "" : ` (${inds.map((i) => TEMPLATES.find((t) => t[0] === i)?.[1] ?? i).join(", ")})`;
      out.push(`| ${name}${who} | ${label(g)} | ${cell(g.text)} | ${srcRefs(g)} |`);
    }
  }
}
out.push("");

out.push("## All sources");
out.push("");
out.push("| Agency | Title | Link |");
out.push("|---|---|---|");
const sorted = Object.values(D.sources).sort((a, b) => a.agency.localeCompare(b.agency) || a.title.localeCompare(b.title));
for (const s of sorted) out.push(`| ${cell(s.agency)} | ${cell(s.title)} | ${s.url} |`);
out.push("");
out.push("Works of the U.S. federal government are in the public domain. The two research items are cited, not copied.");
out.push("");
out.push("## Changing the guidance");
out.push("");
out.push("1. Edit `data/loss-prevention-guidance.json`. Each cause points to a guide id; each guide has a label (kind), its text and source ids.");
out.push("2. Run `node scripts/build-guidance-md.mjs` to rebuild this page.");
out.push("3. Rebuild the app (`bash build-offline.sh`).");
out.push("");

writeFileSync("GUIDANCE.md", out.join("\n"));
console.log(`GUIDANCE.md written: ${Object.keys(D.guides).length} guides, ${Object.keys(D.sources).length} sources`);
