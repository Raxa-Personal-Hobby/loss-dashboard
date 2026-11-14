# Developer notes

You don't need any of this to use the dashboard. Regular users can grab the file from the [download links in the README](README.md#download).

## Build it yourself

```
pnpm install
pnpm dev                    # local dev at http://localhost:5173
pnpm build:offline          # one offline file in ./offline with Vite (no AI, no network)
bash build-offline.sh       # the same offline file with Parcel
bash bundle.sh              # one bundle.html for claude.ai (optional AI color lookup)
pnpm test                   # tests, on synthetic data only
```

## Offline file

`pnpm build:offline` (Vite, `scripts/build-offline-vite.mjs`) and `bash build-offline.sh` (Parcel) both write one self-contained file: `offline/Loss Dashboard (offline).html`. v1.2.0 was released with the Vite script; use it if Parcel's native SWC binary won't load on your machine.

- It swaps in `src/lib/claude.offline.ts`, so no AI or platform code is bundled.
- It starts with a Content-Security-Policy tag that blocks every web request (`connect-src data: blob:`).
- It works with Wi-Fi off. Double-click to open in Chrome or Edge.

## Start screen and templates

| Step | What happens |
|---|---|
| Type a code or words | `findIndustries()` in `src/lib/naics-titles.ts` searches all 2,196 NAICS titles plus keywords from the Census descriptions, with light stemming and everyday synonyms (plumber → plumbing contractors) |
| Pick a result | `profileForNaics()` in `src/lib/industries.ts` picks the template: 722 → restaurant, 23 → construction, 484 / 485 / 4884 / 492 / 5621 → fleet, 531 / 721 → real estate, anything else → general |
| Benchmark | The same code goes to the Safety section. If BLS doesn't publish it, the closest parent is used and named |
| Saved | The choice is kept in the browser. "Change" next to the industry in the header reopens the screen |

Users can still change the template by hand in the Data window.

## Risk levels

Every cut point for Low, Guarded, Moderate, High and Severe is editable in the app (Risk levels button) and saved in the browser's local storage. Defaults live in `src/lib/thresholds.ts`:

- Report-lag defaults cite NCCI (2015), The Hartford and the Gallagher / PRIMA 3-day standard.
- Everything else is labeled "Template starting point" in the app, not a benchmark.

The PowerPoint notes slide lists the levels in use and their sources.

## Safety rates and NAICS benchmarks

Everything here is optional. Each piece of data you add turns on more charts.

| Add this | You get |
|---|---|
| OSHA Recordable column (Yes or No) | Recordable cases by year |
| OSHA Case Type column (Days away, Job transfer or restriction, Other recordable) | DART rate and the case mix |
| Days away and days restricted columns (OSHA 300 columns K and L) | Lost days and the severity rate |
| Hours worked by year, as a sheet in the file, a separate upload, or typed in | TRIR, DART and days-away rate next to the benchmark |

- Rate = cases x 200,000 / hours worked, the same formula OSHA and BLS use.
- Hours can be a company total (blank Location) or per location. Average employees count as 2,000 hours each when hours are missing.
- No OSHA columns but hours given: the app shows comp claims per 200,000 hours as a stand-in and says it isn't TRIR.

Benchmark: The Safety section has a "Compare against" box:

- Type any NAICS code (2 to 6 digits) or words like "roofing". If BLS doesn't publish that exact code, it walks up to the closest parent (722512 → 72251) and says which one it used.
- Pick private, state government or local government.
- Or switch to "My own numbers" and type a TRIR and DART target (a carrier goal, a company goal).
- A "NAICS Code" column in the hours sheet sets the benchmark when the file loads.
- The choice is saved in the browser, per industry.

Reuse it elsewhere: `src/lib/naics.ts` has no imports, so the file can be copied into another project as is. Add `src/lib/naics-titles.ts` too for the plain-words search. It exports `lookupNaics(code, ownership)`, `searchNaics(words)`, `getNaics(code)`, `allNaics()` and `ownershipTotal()`. The same table is in `data/bls-soii-2024-table1-rates.csv` (1,034 rows: NAICS code, ownership, industry, TRC, DART, DAFW, DJTR, other recordable).

Updating to a new BLS year: BLS plans to publish 2025 rates on Nov 18, 2026. Replace `SOII_YEAR`, `SOII_URL` and the `DATA` block in `src/lib/naics.ts` with the new Table 1, and regenerate the CSV.

## Combining a safety report with the loss run

Optional. In the Safety section, **Add a safety report** takes a second file (an OSHA 300 log export or your own safety sheet) and joins it to the loss run by location and year.

| Step | What happens |
|---|---|
| Columns | Auto-matched like the loss run columns: location, year or date of injury, OSHA recordable, case type, days away, days restricted, hours worked or average employees. Employee names are never read |
| Locations | `src/lib/locmatch.ts` compares the two reports' location names with string rules only (no AI, no network): case, punctuation, common abbreviations and filler words set aside, store or site numbers pulled out, word overlap plus Levenshtein similarity. Every pair shows why it was suggested |
| Confidence | High (pre-checked), Suggested (you accept or reject each one) or no match. Different numbers or directions (East vs West) are never suggested. Ties, one location matched to several names, and look-alike names inside one report are flagged, never guessed |
| Confirm | Nothing is combined until every pair has a decision. Locations in only one report are kept and shown as such |
| Merge | Recordables, case types, days and hours come from the safety report, so nothing is counted twice. Names are joined only through the pairs you confirmed |
| Findings | Four more findings compare the two reports for the same locations and years: far fewer recordables than paid comp claims, more recordables than comp claims, above the benchmark TRIR with top-quarter comp cost per hour, and many days away with low comp cost |

The match cut-offs (pre-check at 85, suggest at 60, a 10-point lead over the next best) are template starting points set on synthetic test reports, editable under Risk levels. The Excel export adds a "Location matches" sheet listing every decision.

Tests: `pnpm test` runs `tests/*.test.ts` with Node's built-in test runner (no extra packages). They use only the synthetic sample reports.

## Findings and guidance

Findings come from fixed rules and math on the loss run (`src/lib/metrics.ts`, `src/lib/safety.ts`). No AI writes them.

| Part of a finding card | Where it comes from |
|---|---|
| Whether it shows and its color | The cut points in Risk levels |
| Title and detail | The user's own data |
| Guidance text and source links | `data/loss-prevention-guidance.json`, matched by template and cause. Readable copy: `GUIDANCE.md` |

Guidance labels: "Public guidance" summarizes a government source; "Published research" summarizes a study; "Who can help" points to the carrier, TPA or counsel for claim-handling topics that have no safety standard; "Note" explains the numbers. Every card set ends with a disclaimer, and the PowerPoint findings slide carries it too.

To change the guidance, edit the JSON, run `node scripts/build-guidance-md.mjs`, then rebuild.

## Where things live

| Path | What it does |
|---|---|
| `src/lib/industries.ts` | Industry profiles: coverages, cause categories and rules, field labels, detail charts, sample spec and seed |
| `data/loss-prevention-guidance.json` | Guidance text and government sources for every cause and finding. `src/lib/guidance.ts` reads it |
| `GUIDANCE.md` | Readable list of all guidance and sources, built by `scripts/build-guidance-md.mjs` |
| `src/lib/thresholds.ts` | Risk level defaults, sources, and the Risk levels window layout |
| `src/lib/fields.ts` | Standard loss-run fields, header synonyms, auto-mapping |
| `src/lib/normalize.ts` | Dates, money, coverage and status parsing, cause categorizing |
| `src/lib/parse.ts` | xlsx, csv and docx readers, header-row detection, claim building |
| `src/lib/metrics.ts` | KPIs, same-period YoY, rolling 12, location scoring, findings |
| `src/lib/color.ts` | Brand palette builder with color-blind checks, logo color pull |
| `src/lib/exporters.ts` | PPTX (pptxgenjs), PNG (html-to-image), Excel template and filtered claims |
| `src/lib/sample.ts` | Synthetic sample generator (seeded), including OSHA columns and hours worked |
| `src/lib/naics.ts` | BLS 2024 injury rates for every published NAICS code, plus lookup and search. Self-contained |
| `src/lib/naics-titles.ts` | All 2017 NAICS titles with description keywords, and the plain-words search |
| `src/components/StartScreen.tsx` | The "What does your company do?" screen |
| `src/lib/bls.ts` | BLS case mixes used to build the sample, and the benchmark the user picked |
| `src/lib/safety.ts` | TRIR, DART, days-away and severity rates, rates by location, safety findings |
| `src/lib/locmatch.ts` | Location name matching between the loss run and a safety report (string rules only) |
| `src/components/Safety.tsx` | Safety section: benchmark box, rate tiles and charts, hours entry |
| `data/bls-soii-2024-table1-rates.csv` | The BLS table as a CSV, for spreadsheets or other tools |
| `src/lib/claude.ts` / `claude.offline.ts` | claude.ai capabilities (online) and the no-op offline swap |
| `src/components/ThresholdsDialog.tsx` | Risk levels window |

## Add an industry

1. Copy one profile in `src/lib/industries.ts` and change the coverages, categories, regex rules, field labels, sample spec and `bls` codes (default NAICS, quick picks, and the code the sample follows).
2. Add it to `INDUSTRIES` and send its NAICS codes to it in `profileForNaics()`. Add a block for it under `causes` in `data/loss-prevention-guidance.json` (one guide id per category) and rebuild `GUIDANCE.md`.
3. Run `bash build-offline.sh` and check the sample with the Findings section.

## Notes

- Parcel needs `"@parcel/resolver-default": {"packageExports": true}` in package.json (already set).
- SheetJS installs from its CDN tarball (0.20.3); see package.json.
- Third-party licenses: `THIRD_PARTY_NOTICES.md`.
