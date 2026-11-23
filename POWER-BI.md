# Using the dashboard with Power BI

The dashboard can save its numbers as one Excel file built for Power BI, Excel Power Query, Tableau or any tool that reads Excel. Nothing is uploaded: you save the file and point your tool at it.

## Make the file

**From the dashboard:** Export › **Power BI data model** › Download .xlsx. It uses the filters on screen, so clear them first to include every claim.

**From the command line** (for scheduled refreshes, no browser needed):

```
pnpm powerbi "Loss Run Oct 2026.xlsx" --out "C:\Reports\loss-data.xlsx" --naics 722511
```

| Option | What it does |
|---|---|
| `--out` | Where to save. Default: `<input name>-powerbi.xlsx` next to the input |
| `--naics` | Industry code. Picks the template and the BLS safety benchmark |
| `--industry` | Template by name: `restaurant`, `construction`, `fleet`, `realestate`, `general` |
| `--valuation` | Valuation date, e.g. `2026-10-31`. Default: the latest loss date |

The command line matches columns automatically, the same way the upload window first guesses them, and prints which columns it found. If a column is missed, rename the header in the file or use the dashboard, where you can fix the match by hand. It reads .xlsx, .xls and .csv. It doesn't combine a safety report, because that needs you to confirm location matches on screen.

## Load it in Power BI

1. Power BI Desktop › **Get data › Excel workbook** › pick the file.
2. Tick the tables you want (usually all seven) › **Load**.
3. Model view: drag **Claims[Location]** onto **Locations[Location]** (many to one). Do the same for **Safety by Location[Location]** if you use it.
4. On **Risk Level**, set **Sort by column** to **Risk Level Rank**, so levels sort Low to Severe instead of A to Z.

**Next month:** save the new file over the old one (same name, same folder) and press **Refresh**. Your visuals keep working because the table and column names never change.

## The tables

| Table | One row per | Use it for |
|---|---|---|
| Claims | Claim | Your own measures: counts, incurred, frequency by month, anything |
| Locations | Location | The risk score, risk level and why each location was flagged |
| Findings | Finding | The dashboard's flagged concerns with guidance and sources, ranked |
| Summary | Headline number | The six headline cards (claims, incurred, average cost, open, litigation, report lag) as shown |
| Safety by Year | Year | TRIR, DART, DAFW and severity rates next to the BLS benchmark |
| Safety by Location | Location | TRIR and DART by location (needs hours by location) |
| About | Setting | Valuation date, source file, filters used, schema version |

The two safety tables are always there. They're empty when the loss run has no OSHA columns or hours.

## Promises about the file

- Table names and column names stay the same in future versions. New columns may be added at the end of a table. The schema version is in the About table.
- Dates are real dates and money is plain numbers, so Power BI types them correctly.
- Yes/No columns (Litigated, Reopened, Large Loss, OSHA Recordable) are TRUE/FALSE.
- **Change vs Prior 12 Months** is a decimal: 0.25 means +25%. Format it as a percentage.
- Claimant names are left out. Where a description mentions the claimant by name, the name is replaced with `[claimant]`. Other free text in descriptions is kept as written, so review it before sharing widely.

## Column reference

| Table | Columns |
|---|---|
| Claims | Claim Number, Location, Region, State, Line, Line Name, Line As Reported, Loss Date, Loss Year, Loss Month, Report Date, Days to Report, Status, Reopened, Loss Category, Cause As Reported, Body Part, Injury, Job Title, Paid, Reserve, Incurred, Litigated, Large Loss, OSHA Recordable, OSHA Case Type, Days Away From Work, Days Restricted or Transferred, Description |
| Locations | Location, Region, Claims, Incurred, Average Cost, Open Claims, Litigated Claims, Claims Last 12 Months, Claims Prior 12 Months, Change vs Prior 12 Months, Top Cause Last 12 Months, Top Cause Claims Last 12 Months, Average Days to Report Last 12 Months, Large Losses Last 12 Months, Risk Score, Risk Level, Risk Level Rank, Why Flagged |
| Findings | Rank, Risk Level, Risk Level Rank, Finding, Detail, Guidance, Guidance Type, Sources, Related Locations, Related Categories, Related Lines |
| Summary | Measure Key, Measure, Value, Detail, Change, Risk Level, Risk Level Rank, Note |
| Safety by Year | Year, Partial Year, Recordable Cases, Days Away Cases, Job Transfer or Restriction Cases, Other Recordable Cases, Case Type Unknown, Days Away, Days Restricted, Hours Worked, Hours Estimated, TRIR, DART Rate, DAFW Rate, Severity Rate, Benchmark, Benchmark TRIR, Benchmark DART Rate |
| Safety by Location | Location, Recordable Cases, DART Cases, Hours Worked, TRIR, DART Rate, Risk Level, Risk Level Rank |
| About | Field, Value |

Risk Level Rank: 0 Low, 1 Guarded, 2 Moderate, 3 High, 4 Severe.

## For developers

- Columns are defined once in `POWERBI_COLUMNS` in `src/lib/powerbi.ts`. `tests/powerbi.test.ts` freezes them; never rename or remove one.
- `src/lib/headless.ts` runs the dashboard's calculations without the screen (used by the command line, `scripts/powerbi-export.ts`).
