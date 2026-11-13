# Loss Dashboard (plug-and-play loss run template)

Drop in a loss run (Excel, CSV or a Word table), check the auto-matched columns, brand it, filter it, and export to PowerPoint, PNG or Excel. Everything runs in the browser. Files are never uploaded.

One file covers every industry. The start screen asks what the company does: type a NAICS code or plain words ("commercial fishing", "roofing", "senior living") and it finds the closest NAICS industries, picks the template that fits, and sets the BLS safety benchmark. Templates: restaurant, construction, fleet, real estate, and a general one for everything else.

Optional safety rates: add OSHA columns and hours worked and the Safety section works out TRIR, DART, days-away rate and severity rate, then compares them with the BLS average for any NAICS code.

All sample data is synthetic and generated in the browser from fixed seeds. See `PROVENANCE.md`.

## Quick start

```
pnpm install
pnpm dev                    # local dev at http://localhost:5173
bash build-offline.sh       # one offline file in ./offline (no AI, no network)
bash bundle.sh              # one bundle.html for claude.ai (optional AI color lookup)
```

## Offline file

`build-offline.sh` writes one self-contained file: `offline/Loss Dashboard (offline).html`.

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

## Where things live

| Path | What it does |
|---|---|
| `src/lib/industries.ts` | Industry profiles: coverages, cause categories and rules, safety tips, field labels, detail charts, sample spec and seed |
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
| `src/components/Safety.tsx` | Safety section: benchmark box, rate tiles and charts, hours entry |
| `data/bls-soii-2024-table1-rates.csv` | The BLS table as a CSV, for spreadsheets or other tools |
| `src/lib/claude.ts` / `claude.offline.ts` | claude.ai capabilities (online) and the no-op offline swap |
| `src/components/ThresholdsDialog.tsx` | Risk levels window |

## Add an industry

1. Copy one profile in `src/lib/industries.ts` and change the coverages, categories, regex rules, tips, field labels, sample spec and `bls` codes (default NAICS, quick picks, and the code the sample follows).
2. Add it to `INDUSTRIES` and send its NAICS codes to it in `profileForNaics()`.
3. Run `bash build-offline.sh` and check the sample with the Findings section.

## Notes

- Parcel needs `"@parcel/resolver-default": {"packageExports": true}` in package.json (already set).
- SheetJS installs from its CDN tarball (0.20.3); see package.json.
- Third-party licenses: `THIRD_PARTY_NOTICES.md`.

## About

A portfolio project by Daniel Raxa, built to show risk management and loss analysis skills. It's free and open source. There's no paid version and nothing here is for sale.

## License

MIT. See `LICENSE`.
