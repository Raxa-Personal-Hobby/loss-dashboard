// NAICS lookup for BLS injury and illness rates.
//
// Self-contained on purpose: no imports, so this one file can be copied into another
// project as is. The same numbers are in data/bls-soii-2024-table1-rates.csv for
// spreadsheets or other tools.
//
// Source: U.S. Bureau of Labor Statistics, Survey of Occupational Injuries and Illnesses
// (SOII), Table 1, "Incidence rates of nonfatal occupational injuries and illnesses by
// industry and case types, 2024". Public domain. Copied Nov 13, 2026.
// Rates are cases per 100 full-time workers, which is 200,000 hours worked.
// BLS uses 2017 NAICS codes in this table.
//
// To update for a new year: replace SOII_YEAR, SOII_URL and DATA. One line per industry:
//   code|TRC|DART|DAFW|DJTR|Other|Industry name   (blank = BLS didn't publish it)
// Plain codes are private industry. "S..." is state government, "L..." is local government.
// "all", "private", "S" and "L" are the totals.

export const SOII_YEAR = 2024;
export const SOII_URL = "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/table-1-injury-and-illness-rates-by-industry-2024-national.htm";
export const SOII_NEXT = "BLS plans to publish 2025 rates on Nov 18, 2026.";

export type Ownership = "private" | "state" | "local";

export interface NaicsRate {
  /** NAICS code as BLS prints it ("722511", "31-33"). Empty for the totals. */
  code: string;
  name: string;
  ownership: Ownership | "all";
  /** Total recordable cases rate (TRIR). */
  trc: number;
  /** Days away, restricted or transferred rate. */
  dart: number | null;
  /** Days away from work rate. */
  dafw: number | null;
  /** Job transfer or restriction rate. */
  djtr: number | null;
  /** Other recordable cases rate. */
  other: number | null;
}

export interface NaicsMatch {
  /** What the user typed, cleaned. */
  input: string;
  rate: NaicsRate;
  /** True when BLS publishes this exact code. */
  exact: boolean;
  /** Plain-English note on what was used and why. Empty when exact. */
  note: string;
}

const DATA = `all|2.6|1.5|0.9|0.5|1.1|All industries including private, state and local government
private|2.3|1.4|0.8|0.5|1.0|Private industry
11|3.9|2.5|1.4|1.1|1.4|Agriculture, forestry, fishing and hunting
111|4.1|2.5|1.4|1.1|1.7|Crop production
1111|1.8|0.3||||Oilseed and grain farming
1112|4.7|2.8|1.7|1.1|1.9|Vegetable and melon farming
1113|4.3|2.8|1.5|1.3|1.5|Fruit and tree nut farming
1114|3.6|2.2|1.1|1.1|1.5|Greenhouse, nursery, and floriculture production
1119|6.0|3.4|2.1|1.3|2.6|Other crop farming
112|4.0|2.8|1.7|1.1|1.1|Animal production and aquaculture
1121|3.7|2.7|1.8|0.9|1.0|Cattle ranching and farming
11211|5.3|3.8|2.1|1.7|1.6|Beef cattle ranching and farming, including feedlots
11212|3.2|2.4|1.7|0.7|0.9|Dairy cattle and milk production
1122|4.2|3.4|1.4|2.1|0.8|Hog and pig farming
1123|4.4|2.8|1.6|1.1|1.6|Poultry and egg production
1129|4.3|3.0|1.5|1.5|1.3|Other animal production
113|1.3|0.7|0.5|0.3|0.6|Forestry and logging
1133|1.2|0.5|0.5|0.0|0.6|Logging
115|4.1|2.5|1.4|1.1|1.5|Support activities for agriculture and forestry
1151|4.4|2.8|1.5|1.2|1.6|Support activities for crop production
11511|4.4|2.8|1.5|1.2|1.6|Support activities for crop production
115111|6.3|2.7|2.2||3.6|Cotton ginning
115112|2.2|1.1|0.6|0.5|1.1|Soil preparation, planting, and cultivating
115114|4.7|3.0|1.5|1.5|1.7|Postharvest crop activities (except cotton ginning)
115115|4.2|2.8|1.7|1.1|1.4|Farm labor contractors and crew leaders
115116|6.1|4.0|1.3|2.7|2.0|Farm management services
1152|3.5|1.6|1.3|0.3|1.9|Support activities for animal production
1153|0.9|0.5|0.4|0.1|0.3|Support activities for forestry
21|1.2|0.9|0.7|0.2|0.3|Mining, quarrying, and oil and gas extraction
21112|0.5|0.4|0.3|0.1|0.1|Crude petroleum extraction
212|2.0|1.4|1.0|0.4|0.6|Mining (except oil and gas)
2121|3.1|2.2|2.1|0.1|0.9|Coal mining
21211|3.1|2.2|2.1|0.1|0.9|Coal mining
212111|1.2|0.8|0.8||0.4|Bituminous coal and lignite surface mining
212112|4.3|3.0|2.9|0.2|1.2|Bituminous coal underground mining
212113|3.4|3.1|2.9|||Anthracite mining
2122|1.8|1.3|0.7|0.6|0.5|Metal ore mining
21221|1.4|0.8|0.5|0.3|0.6|Iron ore mining
21222|1.4|1.0|0.6|0.4|0.4|Gold ore and silver ore mining
212221|1.3|0.9|0.5|0.4|0.4|Gold ore mining
212222|2.7|1.9|1.7|||Silver ore mining
21223|2.2|1.7|0.8|0.9|0.5|Copper, nickel, lead, and zinc mining
21229|2.0|1.3|1.0|0.3|0.6|Other metal ore mining
212299|1.9|1.3|1.0|0.4|0.6|All other metal ore mining
2123|1.7|1.2|0.7|0.4|0.5|Nonmetallic mineral mining and quarrying
21231|1.8|1.3|0.8|0.5|0.6|Stone mining and quarrying
212311|1.8|1.4|0.8|0.6|0.4|Dimension stone mining and quarrying
212312|1.9|1.2|0.7|0.5|0.6|Crushed and broken limestone mining and quarrying
212313|1.4|1.1|0.7|0.5|0.3|Crushed and broken granite mining and quarrying
212319|1.8|1.3|0.9|0.4|0.5|Other crushed and broken stone mining and quarrying
21232|1.5|1.0|0.7|0.3|0.5|Sand, gravel, clay, and ceramic and refractory minerals mining and quarrying
212321|1.5|1.0|0.6|0.3|0.5|Construction sand and gravel mining
212324|1.3|0.9|0.5|0.4|0.4|Kaolin and ball clay mining
212325|2.2|1.4|1.1||0.8|Clay and ceramic and refractory minerals mining
21239|1.8|1.2|1.0|0.3|0.6|Other nonmetallic mineral mining and quarrying
212391|1.3|0.9|0.7||0.5|Potash, soda, and borate mineral mining
212392|1.8|1.3|1.1|||Phosphate rock mining
212393|2.4|1.6|1.2|0.4|0.9|Other chemical and fertilizer mineral mining
212399|1.5|1.1|0.9|||All other nonmetallic mineral mining
213|0.9|0.7|0.6|0.1|0.2|Support activities for mining
2131|0.9|0.7|0.6|0.1|0.2|Support activities for mining
21311|0.9|0.7|0.6|0.1|0.2|Support activities for mining
213111|1.3|1.0|0.7|0.3|0.3|Drilling oil and gas wells
213112|0.8|0.6|0.6|0.0|0.2|Support activities for oil and gas operations
23|2.2|1.3|0.9|0.4|0.9|Construction
236|2.2|1.3|0.9|0.4|0.9|Construction of buildings
2361|2.5|1.4|1.0|0.4|1.1|Residential building construction
2362|1.9|1.2|0.8|0.4|0.7|Nonresidential building construction
237|1.8|1.0|0.6|0.4|0.7|Heavy and civil engineering construction
2371|1.4|0.8|0.4|0.4|0.6|Utility system construction
23711|1.9|1.1|0.6|0.5|0.8|Water and sewer line and related structures construction
23712|0.5|0.2|0.1|0.1|0.2|Oil and gas pipeline and related structures construction
23713|1.5|0.9|0.4|0.4|0.7|Power and communication line and related structures construction
2372|1.8|0.9|0.8|0.2|0.8|Land subdivision
2373|2.5|1.5|0.8|0.6|1.0|Highway, street, and bridge construction
2379|1.2|0.7|0.4|0.3|0.5|Other heavy and civil engineering construction
238|2.3|1.4|1.0|0.5|0.9|Specialty trade contractors
2381|2.6|1.8|1.2|0.6|0.8|Foundation, structure, and building exterior contractors
23811|2.8|2.0|1.3|0.7|0.8|Poured concrete foundation and structure contractors
23812|2.8|1.3|0.8|0.4|1.5|Structural steel and precast concrete contractors
23813|4.6|3.4|2.1|1.3|1.3|Framing contractors
23814|1.9|1.5|1.2|0.4|0.4|Masonry contractors
23815|2.7|1.5|0.7|0.8|1.2|Glass and glazing contractors
23816|2.4|1.7|1.1|0.6|0.6|Roofing contractors
23817|3.2|2.5|2.2|0.3|0.7|Siding contractors
2382|2.4|1.4|0.9|0.4|1.0|Building equipment contractors
23821|1.8|1.1|0.7|0.3|0.8|Electrical contractors and other wiring installation contractors
23822|3.0|1.7|1.1|0.6|1.4|Plumbing, heating, and air-conditioning contractors
23829|1.4|1.0|0.8|0.2|0.4|Other building equipment contractors
2383|2.3|1.5|1.1|0.4|0.8|Building finishing contractors
23831|2.9|2.0|1.2|0.8|0.9|Drywall and insulation contractors
23832|1.6|1.1|1.0|0.2|0.5|Painting and wall covering contractors
23833|2.0|0.7|0.6|0.1|1.4|Flooring contractors
23834|2.4|1.6|1.2|0.4|0.8|Tile and terrazzo contractors
23835|1.8|1.3|1.0|0.3|0.5|Finish carpentry contractors
23839|3.1|2.0|1.4|0.6|1.1|Other building finishing contractors
2389|1.5|0.9|0.6|0.3|0.6|Other specialty trade contractors
23891|1.5|1.0|0.7|0.3|0.5|Site preparation contractors
23899|1.6|0.9|0.6|0.3|0.7|All other specialty trade contractors
31-33|2.7|1.7|0.8|0.8|1.0|Manufacturing
311|3.3|2.3|1.1|1.2|1.0|Food manufacturing
3111|2.9|2.1|1.1|1.0|0.8|Animal food manufacturing
31111|2.9|2.1|1.1|1.0|0.8|Animal food manufacturing
311111|2.3|1.5|0.9|0.7|0.7|Dog and cat food manufacturing
311119|3.5|2.7|1.4|1.3|0.8|Other animal food manufacturing
3112|2.9|1.9|1.1|0.9|1.0|Grain and oilseed milling
31121|2.8|1.8|1.1|0.8|1.0|Flour milling and malt manufacturing
311211|3.1|2.2|1.3|0.9|1.0|Flour milling
311213|3.6||||2.9|Malt manufacturing
31122|3.0|2.0|1.1|0.9|1.0|Starch and vegetable fats and oils manufacturing
311221|2.2|1.1|0.4|0.6|1.1|Wet corn milling
311224|4.0|2.7|1.5|1.3|1.2|Soybean and other oilseed processing
311225|3.0|2.4|1.6|0.8|0.6|Fats and oils refining and blending
31123|2.8|1.8|0.9|0.9|1.1|Breakfast cereal manufacturing
3113|3.2|2.2|1.1|1.1|1.0|Sugar and confectionery product manufacturing
31131|4.9|3.3|1.3|2.0|1.6|Sugar manufacturing
311313|6.8|4.6|2.2|2.4|2.2|Beet sugar manufacturing
31134|2.7|1.7|1.0|0.7|0.9|Nonchocolate confectionery manufacturing
31135|2.9|2.1|1.0|1.1|0.8|Chocolate and confectionery manufacturing
311352|2.9|2.1|1.1|1.0|0.7|Confectionery manufacturing from purchased chocolate
3114|3.3|2.3|1.3|1.0|1.0|Fruit and vegetable preserving and specialty food manufacturing
31141|3.4|2.3|1.3|1.1|1.0|Frozen food manufacturing
311411|4.5|3.2|2.0|1.2|1.3|Frozen fruit, juice, and vegetable manufacturing
311412|2.8|1.9|0.9|1.0|0.9|Frozen specialty food manufacturing
31142|3.3|2.3|1.4|0.9|1.0|Fruit and vegetable canning, pickling, and drying
311421|3.2|2.2|1.3|0.9|1.0|Fruit and vegetable canning
311422|2.8|1.7|0.9|0.8|1.1|Specialty canning
3115|4.2|3.0|1.6|1.4|1.2|Dairy product manufacturing
31151|4.2|3.0|1.6|1.4|1.2|Dairy product (except frozen) manufacturing
311511|4.7|3.4|1.9|1.6|1.2|Fluid milk manufacturing
311512|4.8|3.8|1.8|2.0|1.0|Creamery butter manufacturing
311513|4.3|3.0|1.5|1.5|1.3|Cheese manufacturing
311514|2.5|1.6|0.9|0.7|0.9|Dry, condensed, and evaporated dairy product manufacturing
31152|4.2|3.0|1.9|1.1|1.2|Ice cream and frozen dessert manufacturing
3116|3.2|2.2|0.7|1.4|1.1|Animal slaughtering and processing
31161|3.2|2.2|0.7|1.4|1.1|Animal slaughtering and processing
311611|4.0|2.8|0.8|2.0|1.1|Animal (except poultry) slaughtering
311612|3.7|2.7|1.1|1.6|1.1|Meat processed from carcasses
311613|3.8|2.5|1.3|1.2|1.3|Rendering and meat byproduct processing
311615|2.4|1.4|0.5|0.9|1.0|Poultry processing
3117|5.0|3.6|2.3|1.3|1.4|Seafood product preparation and packaging
3118|3.2|2.2|1.3|1.0|1.0|Bakeries and tortilla manufacturing
31181|3.2|2.1|1.2|0.9|1.1|Bread and bakery product manufacturing
311811|1.9|0.9|0.7|0.2|1.0|Retail bakeries
311812|3.7|2.5|1.4|1.1|1.1|Commercial bakeries
31182|3.1|2.3|1.2|1.1|0.8|Cookie, cracker, and pasta manufacturing
311821|2.6|1.8|0.9|0.9|0.8|Cookie and cracker manufacturing
31183|4.3|3.5|2.1|1.4|0.8|Tortilla manufacturing
3119|3.3|2.3|1.2|1.1|1.1|Other food manufacturing
31191|3.0|1.9|0.8|1.1|1.1|Snack food manufacturing
311911|3.0|1.3|0.7|0.6|1.7|Roasted nuts and peanut butter manufacturing
311919|3.1|2.1|0.8|1.3|0.9|Other snack food manufacturing
31192|4.6|2.4|1.9|0.5|2.2|Coffee and tea manufacturing
31193|1.0|0.7|0.3|0.4|0.3|Flavoring syrup and concentrate manufacturing
31194|2.9|2.2|1.1|1.1|0.7|Seasoning and dressing manufacturing
311941|2.3|1.4|0.7|0.7|0.8|Mayonnaise, dressing, and other prepared sauce manufacturing
311942|3.4|2.8|1.5|1.4|0.6|Spice and extract manufacturing
31199|3.6|2.6|1.3|1.2|1.0|All other food manufacturing
311991|4.1|2.9|1.4|1.5|1.2|Perishable prepared food manufacturing
311999|2.8|2.0|1.2|0.8|0.8|All other miscellaneous food manufacturing
312|3.7|2.6|1.2|1.4|1.1|Beverage and tobacco product manufacturing
3121|3.7|2.6|1.2|1.4|1.1|Beverage manufacturing
31211|5.0|4.0|1.6|2.4|0.9|Soft drink and ice manufacturing
312111|5.7|4.7|1.8|2.9|1.1|Soft drink manufacturing
312112|2.7|2.0|1.1|0.9|0.7|Bottled water manufacturing
312113|2.1|2.0|0.7|1.3||Ice manufacturing
31212|2.5|1.1|0.6|0.5|1.4|Breweries
31213|3.2|2.1|1.3|0.8|1.1|Wineries
31214|2.4|1.7|1.1|0.5|0.7|Distilleries
3122|2.8|1.6|1.1|0.5|1.1|Tobacco manufacturing
313|2.5|1.6|0.6|1.0|0.9|Textile mills
3131|3.0|2.0|0.6|1.4|1.0|Fiber, yarn, and thread mills
3132|2.4|1.6|0.7|0.9|0.8|Fabric mills
31321|2.9|2.0|0.9|1.2|0.8|Broadwoven fabric mills
31322|2.0|0.8||0.7|1.1|Narrow fabric mills and schiffli machine embroidery
31323|2.2|1.5|0.6|0.9|0.7|Nonwoven fabric mills
31324|1.8|0.9|0.4||0.9|Knit fabric mills
3133|2.0|1.1|0.5|0.6|0.9|Textile and fabric finishing and fabric coating mills
31331|1.9|1.1|0.4|0.7|0.8|Textile and fabric finishing mills
31332|2.2|1.3|0.9|0.3|0.9|Fabric coating mills
314|2.1|1.3|0.7|0.6|0.8|Textile product mills
3141|1.5|1.0|0.3|0.7|0.5|Textile furnishings mills
31411|1.5|1.0|0.1|0.9|0.5|Carpet and rug mills
31412|1.4|1.0|0.8|0.3|0.4|Curtain and linen mills
3149|2.5|1.5|1.0|0.5|1.0|Other textile product mills
31491|3.8|2.3|1.4|0.9|1.5|Textile bag and canvas mills
31499|1.6|0.9|0.7|0.2|0.7|All other textile product mills
314994|2.3|1.5|1.2|0.4|0.8|Rope, cordage, twine, tire cord, and tire fabric mills
314999|1.5|0.8|0.6|0.2|0.7|All other miscellaneous textile product mills
315|1.9|1.2|0.8|0.4|0.7|Apparel manufacturing
3151|2.3|1.0|0.5|0.6|1.3|Apparel knitting mills
31511|2.6|1.1||0.7|1.5|Hosiery and sock mills
31519|1.7|1.0||||Other apparel knitting mills
3152|2.0|1.3|1.0|0.3|0.6|Cut and sew apparel manufacturing
31521|1.5|1.3|1.0||0.2|Cut and sew apparel contractors
31522|2.6|1.4|1.1||1.1|Men's and boys' cut and sew apparel manufacturing
31528|0.9|0.5|0.4||0.4|Other cut and sew apparel manufacturing
3159|1.1|0.7||0.5||Apparel accessories and other apparel manufacturing
316|4.0|2.7|1.3|1.4|1.3|Leather and allied product manufacturing
3162|3.3|2.0|1.3|0.7|1.3|Footwear manufacturing
3169|4.8|3.6|1.3|2.3|1.2|Other leather and allied product manufacturing
31699|4.8|3.6|1.3|2.3|1.2|Other leather and allied product manufacturing
316998|4.9|3.7|1.3|2.4|1.2|All other leather good and allied product manufacturing
321|4.2|2.7|1.5|1.2|1.6|Wood product manufacturing
3211|4.2|2.7|1.8|1.0|1.4|Sawmills and wood preservation
32111|4.2|2.7|1.8|1.0|1.4|Sawmills and wood preservation
321113|4.2|2.8|1.8|1.0|1.4|Sawmills
321114|3.6|2.3|1.4|1.0|1.3|Wood preservation
3212|4.2|2.5|1.2|1.3|1.7|Veneer, plywood, and engineered wood product manufacturing
32121|4.2|2.5|1.2|1.3|1.7|Veneer, plywood, and engineered wood product manufacturing
321211|4.0|2.0|1.2|0.8|2.0|Hardwood veneer and plywood manufacturing
321212|4.5|2.7|1.4|1.3|1.8|Softwood veneer and plywood manufacturing
321213|2.5|1.9|1.0|0.9|0.7|Engineered wood member (except truss) manufacturing
321214|5.1|3.1|1.3|1.8|2.0|Truss manufacturing
321219|2.5|1.4|0.7|0.7|1.1|Reconstituted wood product manufacturing
3219|4.3|2.7|1.5|1.2|1.6|Other wood product manufacturing
32191|3.8|2.5|1.4|1.0|1.3|Millwork
321911|3.3|2.1|1.0|1.2|1.2|Wood window and door manufacturing
321912|5.4|3.6|2.3|1.3|1.8|Cut stock, resawing lumber, and planing
321918|4.0|2.5|1.8|0.7|1.4|Other millwork (including flooring)
32192|3.9|2.6|1.3|1.3|1.3|Wood container and pallet manufacturing
32199|5.4|3.2|1.7|1.4|2.2|All other wood product manufacturing
321991|5.6|2.9|1.0|1.9|2.7|Manufactured home (mobile home) manufacturing
321992|7.8|4.8|3.3|1.5|3.0|Prefabricated wood building manufacturing
321999|3.5|2.3|1.5|0.8|1.2|All other miscellaneous wood product manufacturing
322|2.4|1.6|0.9|0.7|0.8|Paper manufacturing
3221|2.5|1.7|0.9|0.7|0.8|Pulp, paper, and paperboard mills
32211|1.3|1.0|0.9|||Pulp mills
32212|3.0|2.0|1.0|1.0|1.0|Paper mills
322121|2.9|2.0|1.0|1.0|1.0|Paper (except newsprint) mills
322122|3.1|1.8|1.1|0.8|1.3|Newsprint mills
32213|1.9|1.3|0.7|0.5|0.7|Paperboard mills
3222|2.4|1.6|0.9|0.7|0.8|Converted paper product manufacturing
32221|2.4|1.6|0.9|0.7|0.8|Paperboard container manufacturing
322211|2.5|1.7|1.0|0.7|0.8|Corrugated and solid fiber box manufacturing
322212|2.2|1.4|0.8|0.6|0.8|Folding paperboard box manufacturing
322219|2.1|1.3|0.5|0.8|0.8|Other paperboard container manufacturing
32222|2.2|1.6|0.7|0.8|0.7|Paper bag and coated and treated paper manufacturing
32223|2.7|1.3|0.8|0.5|1.5|Stationery product manufacturing
32229|2.6|1.8|1.0|0.9|0.7|Other converted paper product manufacturing
322291|2.6|1.9|0.9|1.0|0.8|Sanitary paper product manufacturing
322299|2.5|1.8|1.1|0.7|0.7|All other converted paper product manufacturing
323|1.6|1.0|0.6|0.4|0.6|Printing and related support activities
3231|1.6|1.0|0.6|0.4|0.6|Printing and related support activities
32311|1.6|1.0|0.6|0.4|0.6|Printing
323111|1.7|1.0|0.7|0.4|0.7|Commercial printing (except screen and books)
323113|1.2|0.8|0.4|0.4|0.4|Commercial screen printing
323117|1.9|1.1|0.4|0.7|0.8|Books printing
32312|1.5|0.6|0.4|0.3|0.8|Support activities for printing
324|1.0|0.6|0.4|0.2|0.4|Petroleum and coal products manufacturing
3241|1.0|0.6|0.4|0.2|0.4|Petroleum and coal products manufacturing
32411|0.4|0.2|0.1|0.1|0.1|Petroleum refineries
32412|2.1|1.3|0.9|0.4|0.8|Asphalt paving, roofing, and saturated materials manufacturing
324121|2.2|1.2|1.0|0.2|1.0|Asphalt paving mixture and block manufacturing
324122|2.0|1.4|0.8|0.6|0.6|Asphalt shingle and coating materials manufacturing
32419|1.7|1.2|0.7|0.5|0.5|Other petroleum and coal products manufacturing
324191|1.4|1.2|0.7|0.5|0.2|Petroleum lubricating oil and grease manufacturing
324199|2.4|1.3|0.7|0.6|1.2|All other petroleum and coal products manufacturing
325|1.6|1.0|0.5|0.5|0.6|Chemical manufacturing
3251|1.2|0.7|0.3|0.4|0.5|Basic chemical manufacturing
32511|0.5|0.3||0.2|0.2|Petrochemical manufacturing
32512|0.2|0.1|||0.1|Industrial gas manufacturing
32513|1.8|1.6|0.4|1.2|0.2|Synthetic dye and pigment manufacturing
32518|1.2|0.7|0.5|0.3|0.4|Other basic inorganic chemical manufacturing
32519|1.8|1.0|0.5|0.6|0.8|Other basic organic chemical manufacturing
325193|3.9|2.1|0.3|1.8|1.8|Ethyl alcohol manufacturing
325194|0.8|0.7||0.5||Cyclic crude, intermediate, and gum and wood chemical manufacturing
325199|1.4|0.8|0.6|0.3|0.6|All other basic organic chemical manufacturing
3252|1.8|1.1|0.7|0.3|0.7|Resin, synthetic rubber, and artificial and synthetic fibers and filaments manufacturing
32521|1.9|1.1|0.8|0.3|0.8|Resin and synthetic rubber manufacturing
325211|1.9|1.1|0.8|0.3|0.9|Plastics material and resin manufacturing
325212|1.8|1.4|1.1|0.3|0.4|Synthetic rubber manufacturing
32522|1.5|1.0|0.5|0.5|0.5|Artificial and synthetic fibers and filaments manufacturing
3253|1.9|1.4|0.9|0.5|0.5|Pesticide, fertilizer, and other agricultural chemical manufacturing
32531|1.9|1.5|1.0|0.5|0.4|Fertilizer manufacturing
325311|2.3|2.1|1.5|0.6|0.2|Nitrogenous fertilizer manufacturing
325314|1.4|0.5|0.3|0.2||Fertilizer (mixing only) manufacturing
3254|1.4|0.9|0.5|0.5|0.4|Pharmaceutical and medicine manufacturing
32541|1.4|0.9|0.5|0.5|0.4|Pharmaceutical and medicine manufacturing
325411|1.4|1.0|0.7|0.3|0.4|Medicinal and botanical manufacturing
325412|1.4|0.9|0.4|0.5|0.4|Pharmaceutical preparation manufacturing
325413|1.2|0.9|0.5|0.4|0.3|In-vitro diagnostic substance manufacturing
325414|1.5|0.9|0.5|0.4|0.6|Biological product (except diagnostic) manufacturing
3255|2.4|1.5|0.7|0.8|0.9|Paint, coating, and adhesive manufacturing
32551|2.6|1.7|0.9|0.8|0.9|Paint and coating manufacturing
3256|1.9|1.3|0.5|0.8|0.6|Soap, cleaning compound, and toilet preparation manufacturing
32561|1.8|1.1|0.6|0.5|0.7|Soap and cleaning compound manufacturing
325611|1.5|0.9|0.6|0.3|0.6|Soap and other detergent manufacturing
325612|2.2|1.2|0.5|0.7|1.0|Polish and other sanitation good manufacturing
32562|1.9|1.5|0.4|1.1|0.4|Toilet preparation manufacturing
3259|2.0|1.2|0.6|0.6|0.8|Other chemical product and preparation manufacturing
32591|2.0|1.5|0.4|1.1|0.5|Printing ink manufacturing
32599|2.1|1.2|0.7|0.5|0.9|All other chemical product and preparation manufacturing
325991|4.0|2.2|1.4|0.8|1.8|Custom compounding of purchased resins
325992|0.9|0.8||0.4||Photographic film, paper, plate, and chemical manufacturing
325998|1.4|0.8|0.4|0.4|0.6|All other miscellaneous chemical product and preparation manufacturing
326|2.8|1.8|0.9|0.9|1.0|Plastics and rubber products manufacturing
3261|2.8|1.8|0.9|0.9|1.0|Plastics product manufacturing
32611|2.5|1.7|0.9|0.8|0.8|Plastics packaging materials and unlaminated film and sheet manufacturing
326111|2.9|2.1|1.2|0.9|0.8|Plastics bag and pouch manufacturing
326112|2.0|1.3|0.7|0.5|0.7|Plastics packaging film and sheet (including laminated) manufacturing
326113|2.4|1.5|0.8|0.8|0.9|Unlaminated plastics film and sheet (except packaging) manufacturing
32612|2.7|1.7|0.9|0.8|1.0|Plastics pipe, pipe fitting, and unlaminated profile shape manufacturing
326121|3.1|1.4|0.9|0.4|1.7|Unlaminated plastics profile shape manufacturing
326122|2.4|1.9|0.9|1.0|0.5|Plastics pipe and pipe fitting manufacturing
32613|3.5|1.9|0.9|1.0|1.6|Laminated plastics plate, sheet (except packaging), and shape manufacturing
32614|3.0|1.5|0.8|0.7|1.5|Polystyrene foam product manufacturing
32615|3.1|2.0|0.9|1.1|1.1|Urethane and other foam product (except polystyrene) manufacturing
32616|1.9|1.1|0.6|0.6|0.8|Plastics bottle manufacturing
32619|2.8|1.9|0.9|0.9|1.0|Other plastics product manufacturing
326191|3.5|2.2|0.7|1.5|1.3|Plastics plumbing fixture manufacturing
326199|2.8|1.8|0.9|0.9|1.0|All other plastics product manufacturing
3262|2.8|1.8|0.8|0.9|1.0|Rubber product manufacturing
32621|3.2|2.3|1.0|1.3|0.9|Tire manufacturing
326211|3.1|2.4|0.9|1.4|0.7|Tire manufacturing (except retreading)
326212|4.0|1.6|1.3|0.3|2.3|Tire retreading
32622|2.6|1.3|0.5|0.7|1.4|Rubber and plastics hoses and belting manufacturing
32629|2.4|1.5|0.8|0.6|1.0|Other rubber product manufacturing
326291|2.5|1.5|0.8|0.7|1.0|Rubber product manufacturing for mechanical use
326299|2.4|1.4|0.9|0.5|0.9|All other rubber product manufacturing
327|3.3|2.0|1.1|0.9|1.4|Nonmetallic mineral product manufacturing
3271|3.7|2.9|1.2|1.7|0.8|Clay product and refractory manufacturing
32711|2.9|2.3|0.8|1.5|0.6|Pottery, ceramics, and plumbing fixture manufacturing
32712|4.2|3.3|1.4|1.9|0.9|Clay building material and refractories manufacturing
3272|3.5|2.2|1.1|1.1|1.3|Glass and glass product manufacturing
32721|3.5|2.2|1.1|1.1|1.3|Glass and glass product manufacturing
327211|4.5|3.3|1.5|1.8|1.2|Flat glass manufacturing
327212|2.5|1.4|0.9|0.5|1.1|Other pressed and blown glass and glassware manufacturing
327213|4.1|2.8|1.0|1.8|1.3|Glass container manufacturing
327215|3.4|1.9|1.1|0.9|1.4|Glass product manufacturing made of purchased glass
3273|3.1|1.8|1.1|0.7|1.2|Cement and concrete product manufacturing
32732|2.5|1.6|1.1|0.5|0.9|Ready-mix concrete manufacturing
32733|2.3|1.5|0.7|0.7|0.9|Concrete pipe, brick, and block manufacturing
327332|2.2|1.3|0.6||0.9|Concrete pipe manufacturing
32739|4.9|2.8|1.6|1.2|2.1|Other concrete product manufacturing
3274|2.2|1.6|0.7|0.9|0.5|Lime and gypsum product manufacturing
32742|1.9|1.3|0.5|0.8|0.6|Gypsum product manufacturing
3279|4.0|1.9|0.9|1.0|2.1|Other nonmetallic mineral product manufacturing
32791|4.6|3.0|1.3|1.7|1.7|Abrasive product manufacturing
32799|3.9|1.7|0.8|0.9|2.1|All other nonmetallic mineral product manufacturing
327991|6.2|2.5|1.2|1.3|3.7|Cut stone and stone product manufacturing
327992|2.6|1.8||1.3|0.7|Ground or treated mineral and earth manufacturing
327993|1.4|0.9|0.5|0.4|0.5|Mineral wool manufacturing
327999|1.7|0.8|0.2|0.6|0.9|All other miscellaneous nonmetallic mineral product manufacturing
331|3.3|2.0|1.0|1.0|1.3|Primary metal manufacturing
3311|1.9|1.3|0.6|0.7|0.7|Iron and steel mills and ferroalloy manufacturing
3312|3.2|1.9|1.2|0.7|1.4|Steel product manufacturing from purchased steel
33121|2.8|1.6|0.8|0.8|1.2|Iron and steel pipe and tube manufacturing from purchased steel
33122|3.6|2.1|1.5|0.7|1.5|Rolling and drawing of purchased steel
331221|3.3|1.8|1.2|0.6|1.6|Rolled steel shape manufacturing
331222|4.3|2.9|2.1|0.8|1.4|Steel wire drawing
3313|2.6|1.7|0.8|0.9|0.9|Alumina and aluminum production and processing
33131|2.6|1.7|0.8|0.9|0.9|Alumina and aluminum production and processing
331313|2.1|1.3|0.6|0.7|0.8|Alumina refining and primary aluminum production
331314|2.9|2.0|1.0|0.9|0.9|Secondary smelting and alloying of aluminum
331315|1.5|0.8|0.4|0.4|0.6|Aluminum sheet, plate, and foil manufacturing
331318|3.4|2.4|1.1|1.2|1.0|Other aluminum rolling, drawing, and extruding
3314|2.9|1.9|1.0|0.9|0.9|Nonferrous metal (except aluminum) production and processing
33141|2.3|1.5|0.4|1.1|0.7|Nonferrous metal (except aluminum) smelting and refining
33142|2.8|2.0|1.1|1.0|0.8|Copper rolling, drawing, extruding, and alloying
33149|3.1|2.0|1.2|0.8|1.1|Nonferrous metal (except copper and aluminum) rolling, drawing, extruding, and alloying
331491|3.2|1.9|1.2|0.7|1.3|Nonferrous metal (except copper and aluminum) rolling, drawing, and extruding
331492|3.0|2.1|1.1|1.0|0.9|Secondary smelting, refining, and alloying of nonferrous metal (except copper and aluminum)
3315|5.1|2.9|1.4|1.5|2.2|Foundries
33151|5.6|3.0|1.4|1.6|2.6|Ferrous metal foundries
331511|5.5|3.0|1.5|1.5|2.4|Iron foundries
331512|4.0|2.4|1.1|1.3|1.5|Steel investment foundries
331513|7.7|3.6|1.2|2.3|4.1|Steel foundries (except investment)
33152|4.5|2.9|1.4|1.4|1.6|Nonferrous metal foundries
331523|3.5|2.1|1.0|1.0|1.5|Nonferrous metal die-casting foundries
331524|5.2|3.9|1.7|2.1|1.4|Aluminum foundries (except die-casting)
331529|5.2|3.0|1.8|1.2|2.2|Other nonferrous metal foundries (except die-casting)
332|3.2|1.8|0.9|0.9|1.4|Fabricated metal product manufacturing
3321|4.6|2.7|1.3|1.4|1.8|Forging and stamping
33211|4.6|2.7|1.3|1.4|1.8|Forging and stamping
332111|5.4|3.3|1.7|1.6|2.1|Iron and steel forging
332112|5.7|3.7|1.4|2.2|2.0|Nonferrous forging
332114|5.8|3.9|1.8|2.1|1.8|Custom roll forming
332117|2.7|1.1|0.9||1.7|Powder metallurgy part manufacturing
332119|4.2|2.5|1.2|1.3|1.7|Metal crown, closure, and other metal stamping (except automotive)
3322|2.5|1.4|0.5|0.9|1.1|Cutlery and handtool manufacturing
33221|2.5|1.4|0.5|0.9|1.1|Cutlery and handtool manufacturing
332215|3.6|2.2|0.5|1.7|1.4|Metal kitchen cookware, utensil, cutlery, and flatware (except precious) manufacturing
332216|2.0|1.1|0.5|0.6|0.9|Saw blade and handtool manufacturing
3323|3.5|1.9|1.0|0.9|1.6|Architectural and structural metals manufacturing
33231|3.5|1.9|0.9|0.9|1.7|Plate work and fabricated structural product manufacturing
332311|3.4|2.0|1.0|1.0|1.4|Prefabricated metal building and component manufacturing
332312|3.4|1.8|0.9|0.9|1.7|Fabricated structural metal manufacturing
332313|3.8|1.9|0.9|1.1|1.9|Plate work manufacturing
33232|3.5|2.0|1.1|0.9|1.5|Ornamental and architectural metal products manufacturing
332321|3.4|1.9|0.8|1.1|1.5|Metal window and door manufacturing
332322|3.3|1.9|1.2|0.7|1.4|Sheet metal work manufacturing
332323|4.0|2.3|1.4|0.9|1.7|Ornamental and architectural metal work manufacturing
3324|3.4|1.9|1.0|0.9|1.5|Boiler, tank, and shipping container manufacturing
33241|3.2|1.5|0.8|0.7|1.7|Power boiler and heat exchanger manufacturing
33242|3.9|2.5|1.3|1.2|1.4|Metal tank (heavy gauge) manufacturing
33243|3.1|1.6|0.8|0.7|1.5|Metal can, box, and other metal container (light gauge) manufacturing
332431|1.9|0.9|0.4|0.5|1.0|Metal can manufacturing
332439|5.0|2.6|1.5|1.1|2.3|Other metal container manufacturing
3325|2.9|1.5|0.9|0.6|1.3|Hardware manufacturing
3326|3.2|1.8|0.8|1.0|1.4|Spring and wire product manufacturing
33261|3.2|1.8|0.8|1.0|1.4|Spring and wire product manufacturing
332613|3.8|2.1|0.9|1.1|1.7|Spring manufacturing
3327|2.9|1.5|0.7|0.8|1.4|Machine shops; turned product; and screw, nut, and bolt manufacturing
33271|2.7|1.5|0.6|0.8|1.2|Machine shops
33272|3.4|1.4|0.8|0.6|2.0|Turned product and screw, nut, and bolt manufacturing
332721|3.6|1.6|1.0|0.6|2.1|Precision turned product manufacturing
332722|3.2|1.2|0.6|0.6|2.0|Bolt, nut, screw, rivet, and washer manufacturing
3328|4.0|2.7|1.5|1.3|1.3|Coating, engraving, heat treating, and allied activities
33281|4.0|2.7|1.5|1.3|1.3|Coating, engraving, heat treating, and allied activities
332811|3.3|2.6|1.8|0.9|0.7|Metal heat treating
332812|4.1|3.1|1.5|1.6|1.0|Metal coating, engraving (except jewelry and silverware), and allied services to manufacturers
332813|4.1|2.3|1.3|1.0|1.8|Electroplating, plating, polishing, anodizing, and coloring
3329|2.2|1.2|0.6|0.7|0.9|Other fabricated metal product manufacturing
33291|1.9|1.2|0.6|0.6|0.7|Metal valve manufacturing
332911|1.3|0.7|0.4|0.3|0.6|Industrial valve manufacturing
332912|1.6|1.0|0.5|0.5|0.7|Fluid power valve and hose fitting manufacturing
332913|1.9|1.3|0.7|0.6|0.6|Plumbing fixture fitting and trim manufacturing
332919|3.5|2.7|1.4|1.3|0.8|Other metal valve and pipe fitting manufacturing
33299|2.3|1.2|0.6|0.7|1.1|All other fabricated metal product manufacturing
332991|2.4|0.9|0.3|0.6|1.5|Ball and roller bearing manufacturing
332992|3.2|2.3|0.9|1.4|0.9|Small arms ammunition manufacturing
332994|1.9|1.1|0.6|0.6|0.7|Small arms, ordnance, and ordnance accessories manufacturing
332996|2.1|1.1|0.6|0.5|1.0|Fabricated pipe and pipe fitting manufacturing
332999|2.6|1.4|0.6|0.8|1.2|All other miscellaneous fabricated metal product manufacturing
333|2.3|1.3|0.7|0.6|1.1|Machinery manufacturing
3331|2.7|1.6|0.8|0.8|1.2|Agriculture, construction, and mining machinery manufacturing
33311|3.9|2.3|1.0|1.3|1.7|Agricultural implement manufacturing
333111|4.4|2.5|1.1|1.4|1.9|Farm machinery and equipment manufacturing
333112|1.8|1.2|0.7|0.5|0.6|Lawn and garden tractor and home lawn and garden equipment manufacturing
33312|2.8|1.6|0.8|0.8|1.2|Construction machinery manufacturing
33313|1.0|0.5|0.4|0.1|0.5|Mining and oil and gas field machinery manufacturing
333131|2.5|1.2|0.7|0.4|1.4|Mining machinery and equipment manufacturing
333132|0.7|0.4|0.3||0.3|Oil and gas field machinery and equipment manufacturing
3332|2.3|1.0|0.5|0.5|1.3|Industrial machinery manufacturing
33324|2.3|1.0|0.5|0.5|1.3|Industrial machinery manufacturing
333241|2.3|0.9|0.5|0.4|1.4|Food product machinery manufacturing
333243|3.2|1.3|0.7|0.6|1.9|Sawmill, woodworking, and paper machinery manufacturing
333249|2.4|1.1|0.5|0.6|1.3|Other industrial machinery manufacturing
3333|2.2|1.1|0.7|0.4|1.1|Commercial and service industry machinery manufacturing
33331|2.2|1.1|0.7|0.4|1.1|Commercial and service industry machinery manufacturing
333314|1.4|0.5|0.3|0.1|1.0|Optical instrument and lens manufacturing
333316|1.4|0.9||0.6||Photographic and photocopying equipment manufacturing
333318|2.5|1.3|0.8|0.5|1.2|Other commercial and service industry machinery manufacturing
3334|2.4|1.3|0.6|0.7|1.1|Ventilation, heating, air-conditioning, and commercial refrigeration equipment manufacturing
33341|2.4|1.3|0.6|0.7|1.1|Ventilation, heating, air-conditioning, and commercial refrigeration equipment manufacturing
333413|2.9|1.8|0.7|1.1|1.1|Industrial and commercial fan and blower and air purification equipment manufacturing
333414|3.2|1.2|0.5|0.8|1.9|Heating equipment (except warm air furnaces) manufacturing
333415|2.1|1.1|0.6|0.6|1.0|Air-conditioning and warm air heating equipment and commercial and industrial refrigeration equipment manufacturing
3335|2.5|1.3|0.9|0.4|1.2|Metalworking machinery manufacturing
33351|2.5|1.3|0.9|0.4|1.2|Metalworking machinery manufacturing
333511|3.1|1.6|0.8|0.8|1.5|Industrial mold manufacturing
333514|2.8|1.4|1.2|0.3|1.4|Special die and tool, die set, jig, and fixture manufacturing
333515|1.2|0.5|0.4|0.2|0.6|Cutting tool and machine tool accessory manufacturing
333517|2.3|1.2|0.9|0.3|1.0|Machine tool manufacturing
333519|2.6|1.6|1.4||1.0|Rolling mill and other metalworking machinery manufacturing
3336|1.9|1.0|0.5|0.5|0.9|Engine, turbine, and power transmission equipment manufacturing
33361|1.9|1.0|0.5|0.5|0.9|Engine, turbine, and power transmission equipment manufacturing
333612|1.4|0.7|0.4|0.3|0.7|Speed changer, industrial high-speed drive, and gear manufacturing
333613|4.0|2.6|1.6|1.0|1.4|Mechanical power transmission equipment manufacturing
333618|1.9|0.8|0.3|0.5|1.1|Other engine equipment manufacturing
3339|2.2|1.3|0.7|0.7|0.9|Other general purpose machinery manufacturing
33391|1.6|0.8|0.5|0.3|0.8|Pump and compressor manufacturing
333912|1.5|0.7|0.6|0.1||Air and gas compressor manufacturing
333914|1.6|0.8|0.4|0.4|0.8|Measuring, dispensing, and other pumping equipment manufacturing
33392|3.1|2.0|0.9|1.0|1.2|Material handling equipment manufacturing
333921|1.1|0.8|0.5|0.3|0.3|Elevator and moving stairway manufacturing
333922|2.4|1.4|0.8|0.5|1.1|Conveyor and conveying equipment manufacturing
333923|4.3|3.0|1.0|2.0|1.2|Overhead traveling crane, hoist, and monorail system manufacturing
333924|4.3|2.7|1.2|1.5|1.6|Industrial truck, tractor, trailer, and stacker machinery manufacturing
33399|1.7|1.1|0.5|0.5|0.7|All other general purpose machinery manufacturing
333991|1.3|0.9|0.4|0.5|0.4|Power-driven handtool manufacturing
333992|1.1|0.8|0.2|0.6|0.4|Welding and soldering equipment manufacturing
333993|1.0|0.5|0.2|0.4|0.5|Packaging machinery manufacturing
333994|2.6|1.2|0.6|0.6|1.4|Industrial process furnace and oven manufacturing
333995|2.2|1.4|0.8|0.6|0.9|Fluid power cylinder and actuator manufacturing
333996|1.8|1.1|0.5|0.6|0.7|Fluid power pump and motor manufacturing
333999|2.0|1.3|0.7|0.6|0.7|All other miscellaneous general purpose machinery manufacturing
334|0.9|0.5|0.3|0.2|0.3|Computer and electronic product manufacturing
3341|0.6|0.4|0.3|0.1|0.2|Computer and peripheral equipment manufacturing
33411|0.6|0.4|0.3|0.1|0.2|Computer and peripheral equipment manufacturing
334111|0.5|0.3|0.2|0.1|0.1|Electronic computer manufacturing
334112|1.0|0.8|0.6|0.2|0.2|Computer storage device manufacturing
334118|0.6|0.4|0.3|0.1|0.2|Computer terminal and other computer peripheral equipment manufacturing
3342|0.7|0.4|0.3|0.1|0.3|Communications equipment manufacturing
33422|0.4|0.2|0.1|0.1|0.1|Radio and television broadcasting and wireless communications equipment manufacturing
33429|1.6|1.0|0.9||0.5|Other communications equipment manufacturing
3344|0.9|0.6|0.3|0.2|0.4|Semiconductor and other electronic component manufacturing
33441|0.9|0.6|0.3|0.2|0.4|Semiconductor and other electronic component manufacturing
334413|0.8|0.4|0.3|0.1|0.3|Semiconductor and related device manufacturing
334416|0.9|0.5|0.4||0.4|Capacitor, resistor, coil, transformer, and other inductor manufacturing
334418|0.9|0.6|0.4|0.2|0.4|Printed circuit assembly (electronic assembly) manufacturing
334419|1.2|0.8|0.3|0.5|0.4|Other electronic component manufacturing
3345|0.9|0.5|0.3|0.2|0.3|Navigational, measuring, electromedical, and control instruments manufacturing
33451|0.9|0.5|0.3|0.2|0.3|Navigational, measuring, electromedical, and control instruments manufacturing
334510|0.8|0.4|0.2|0.2|0.4|Electromedical and electrotherapeutic apparatus manufacturing
334511|0.5|0.4|0.2|0.2|0.2|Search, detection, navigation, guidance, aeronautical, and nautical system and instrument manufacturing
334512|0.6|0.4||0.3|0.2|Automatic environmental control manufacturing for residential, commercial, and appliance use
334514|0.9|0.6||0.3|0.3|Totalizing fluid meter and counting device manufacturing
334515|0.9|0.7|0.5|0.2|0.2|Instrument manufacturing for measuring and testing electricity and electrical signals
334516|1.2|0.5|0.3|0.2|0.6|Analytical laboratory instrument manufacturing
334517|1.3|1.2|0.8|0.4|0.2|Irradiation apparatus manufacturing
334519|1.2|0.9|0.7|0.2|0.2|Other measuring and controlling device manufacturing
3346|0.6|0.6|0.2|0.4||Manufacturing and reproducing magnetic and optical media
33461|0.6|0.6|0.2|0.4||Manufacturing and reproducing magnetic and optical media
335|2.0|1.2|0.6|0.6|0.8|Electrical equipment, appliance, and component manufacturing
3351|2.1|1.2|0.5|0.7|0.9|Electric lighting equipment manufacturing
33512|2.3|1.3|0.5|0.8|1.0|Lighting fixture manufacturing
335121|3.1|1.5||1.2||Residential electric lighting fixture manufacturing
335122|2.3|1.5|0.7|0.8|0.8|Commercial, industrial, and institutional electric lighting fixture manufacturing
335129|1.5|0.6|0.3|0.4|0.8|Other lighting equipment manufacturing
3352|2.1|1.3|0.5|0.8|0.8|Household appliance manufacturing
33521|1.3|0.8|0.3|0.5|0.5|Small electrical appliance manufacturing
33522|2.3|1.4|0.6|0.9|0.8|Major household appliance manufacturing
3353|1.8|1.1|0.6|0.5|0.7|Electrical equipment manufacturing
33531|1.8|1.1|0.6|0.5|0.7|Electrical equipment manufacturing
335311|3.0|2.4|1.2|1.1|0.6|Power, distribution, and specialty transformer manufacturing
335312|1.8|1.0|0.4|0.6|0.8|Motor and generator manufacturing
335313|1.7|0.7|0.4|0.3|0.9|Switchgear and switchboard apparatus manufacturing
335314|0.9|0.5|0.3|0.2|0.4|Relay and industrial control manufacturing
3359|2.0|1.2|0.7|0.6|0.8|Other electrical equipment and component manufacturing
33591|2.7|1.7|1.0|0.7|0.9|Battery manufacturing
335911|2.8|1.8|1.1|0.7|1.0|Storage battery manufacturing
33592|1.2|0.9|0.5|0.4|0.3|Communication and energy wire and cable manufacturing
335921|1.5|1.3|0.9|0.4|0.3|Fiber optic cable manufacturing
335929|0.8|0.5||0.4||Other communication and energy wire manufacturing
33593|2.2|1.2|0.6|0.5|1.1|Wiring device manufacturing
335931|2.5|1.3|0.7|0.6|1.2|Current-carrying wiring device manufacturing
335932|1.7|1.0|0.6|0.4|0.7|Noncurrent-carrying wiring device manufacturing
33599|1.5|0.8|0.3|0.5|0.7|All other electrical equipment and component manufacturing
335991|1.8|1.2|0.5|0.7|0.7|Carbon and graphite product manufacturing
335999|1.4|0.7||0.4|0.7|All other miscellaneous electrical equipment and component manufacturing
336|3.2|2.1|0.9|1.2|1.2|Transportation equipment manufacturing
3361|5.6|4.0|1.5|2.5|1.6|Motor vehicle manufacturing
33611|5.8|4.2|1.5|2.7|1.6|Automobile and light duty motor vehicle manufacturing
336111|5.6|4.2|1.9|2.3|1.3|Automobile manufacturing
336112|6.3|4.1|0.8|3.4|2.1|Light truck and utility vehicle manufacturing
33612|4.1|2.5|1.1|1.3|1.7|Heavy duty truck manufacturing
3362|5.1|2.7|1.3|1.4|2.4|Motor vehicle body and trailer manufacturing
33621|5.1|2.7|1.3|1.4|2.4|Motor vehicle body and trailer manufacturing
336211|4.9|2.8|1.4|1.5|2.1|Motor vehicle body manufacturing
336212|4.9|2.8|1.3|1.5|2.1|Truck trailer manufacturing
336214|6.0|2.7|1.3|1.5|3.3|Travel trailer and camper manufacturing
3363|2.9|1.8|0.8|1.0|1.1|Motor vehicle parts manufacturing
33631|2.7|1.6|0.7|0.9|1.1|Motor vehicle gasoline engine and engine parts manufacturing
33632|2.5|1.8|0.7|1.1|0.7|Motor vehicle electrical and electronic equipment manufacturing
33633|2.5|1.3|0.7|0.6|1.2|Motor vehicle steering and suspension components (except spring) manufacturing
33634|3.1|2.5|1.7|0.8|0.6|Motor vehicle brake system manufacturing
33635|2.4|1.6|0.7|0.9|0.8|Motor vehicle transmission and power train parts manufacturing
33636|3.3|2.0|0.7|1.3|1.2|Motor vehicle seating and interior trim manufacturing
33637|3.5|2.1|0.8|1.3|1.5|Motor vehicle metal stamping
33639|3.0|1.9|0.9|1.0|1.1|Other motor vehicle parts manufacturing
3364|1.6|1.0|0.5|0.6|0.6|Aerospace product and parts manufacturing
33641|1.6|1.0|0.5|0.6|0.6|Aerospace product and parts manufacturing
336411|2.0|1.4|0.6|0.8|0.6|Aircraft manufacturing
336412|1.2|0.6|0.3|0.3|0.6|Aircraft engine and engine parts manufacturing
336413|2.1|1.3|0.7|0.6|0.8|Other aircraft parts and auxiliary equipment manufacturing
336414|0.6|0.4|0.2|0.2|0.3|Guided missile and space vehicle manufacturing
336415|1.3|0.9|0.6|0.3|0.4|Guided missile and space vehicle propulsion unit and propulsion unit parts manufacturing
336419|1.3|0.8||0.4|0.5|Other guided missile and space vehicle parts and auxiliary equipment manufacturing
3365|2.4|1.7|0.9|0.8|0.7|Railroad rolling stock manufacturing
3366|4.2|2.7|1.7|1.0|1.6|Ship and boat building
33661|4.2|2.7|1.7|1.0|1.6|Ship and boat building
336611|4.8|3.2|2.0|1.2|1.6|Ship building and repairing
336612|2.9|1.4|0.7|0.6|1.5|Boat building
3369|2.4|1.4|0.7|0.8|0.9|Other transportation equipment manufacturing
33699|2.4|1.4|0.7|0.8|0.9|Other transportation equipment manufacturing
336991|2.0|0.8|0.2|0.7|1.2|Motorcycle, bicycle, and parts manufacturing
336992|2.9|1.8|0.9|0.9|1.1|Military armored vehicle, tank, and tank component manufacturing
336999|2.3|1.5|0.8|0.7|0.8|All other transportation equipment manufacturing
337|3.5|2.1|1.1|1.0|1.4|Furniture and related product manufacturing
3371|3.7|2.3|1.3|1.0|1.4|Household and institutional furniture and kitchen cabinet manufacturing
33711|3.5|2.2|1.4|0.8|1.3|Wood kitchen cabinet and countertop manufacturing
33712|3.9|2.3|1.1|1.2|1.5|Household and institutional furniture manufacturing
337121|3.8|2.5|1.2|1.4|1.3|Upholstered household furniture manufacturing
337122|3.2|2.0|1.0|1.0|1.2|Nonupholstered wood household furniture manufacturing
337125|3.3|1.6|0.7|0.9|1.6|Household furniture (except wood and metal) manufacturing
337127|5.0|2.6|1.2|1.4|2.4|Institutional furniture manufacturing
3372|3.5|1.9|0.9|1.0|1.6|Office furniture (including fixtures) manufacturing
33721|3.5|1.9|0.9|1.0|1.6|Office furniture (including fixtures) manufacturing
337211|2.2|1.4|0.4|1.0|0.7|Wood office furniture manufacturing
337212|2.9|1.5|1.1|0.3|1.4|Custom architectural woodwork and millwork manufacturing
337214|2.8|1.6|0.3|1.3|1.2|Office furniture (except wood) manufacturing
337215|4.7|2.5|1.2|1.3|2.2|Showcase, partition, shelving, and locker manufacturing
3379|2.1|1.6|0.8|0.7|0.5|Other furniture related product manufacturing
33791|1.4|0.9|0.4|0.6|0.5|Mattress manufacturing
33792|3.7|3.1|1.9|1.2||Blind and shade manufacturing
339|1.7|0.9|0.4|0.5|0.8|Miscellaneous manufacturing
3391|1.5|0.8|0.3|0.5|0.7|Medical equipment and supplies manufacturing
33911|1.5|0.8|0.3|0.5|0.7|Medical equipment and supplies manufacturing
339112|1.5|0.7|0.3|0.5|0.8|Surgical and medical instrument manufacturing
339113|1.9|0.9|0.4|0.5|0.9|Surgical appliance and supplies manufacturing
339116|0.8|0.5|0.2|0.3|0.3|Dental laboratories
3399|2.0|1.1|0.6|0.6|0.9|Other miscellaneous manufacturing
33992|2.8|1.4|0.9|0.5|1.3|Sporting and athletic goods manufacturing
33993|0.7|0.4|0.2||0.3|Doll, toy, and game manufacturing
33994|1.7|0.8|0.7||0.9|Office supplies (except paper) manufacturing
33995|1.8|0.8|0.4|0.4|1.1|Sign manufacturing
33999|2.3|1.5|0.7|0.8|0.8|All other miscellaneous manufacturing
339991|1.8|1.2|0.6|0.6|0.6|Gasket, packing, and sealing device manufacturing
339992|2.4|2.0|1.2|0.9|0.3|Musical instrument manufacturing
339994|2.8|2.0|0.7|1.3||Broom, brush, and mop manufacturing
339999|2.4|1.5|0.6|0.8|0.9|All other miscellaneous manufacturing
42|2.2|1.6|0.9|0.6|0.6|Wholesale trade
423|1.8|1.2|0.7|0.5|0.6|Merchant wholesalers, durable goods
4231|2.9|2.2|1.3|0.9|0.7|Motor vehicle and motor vehicle parts and supplies merchant wholesalers
4232|1.8|1.1|0.7|0.4|0.7|Furniture and home furnishing merchant wholesalers
4233|3.0|2.3|1.4|1.0|0.7|Lumber and other construction materials merchant wholesalers
4234|1.0|0.8|0.4|0.4|0.2|Professional and commercial equipment and supplies merchant wholesalers
4235|3.3|2.5|1.2|1.3|0.8|Metal and mineral (except petroleum) merchant wholesalers
4236|1.2|0.6|0.3|0.3|0.5|Household appliances and electrical and electronic goods merchant wholesalers
4237|1.6|1.1|0.7|0.4|0.5|Hardware, and plumbing and heating equipment and supplies merchant wholesalers
4238|1.5|0.9|0.5|0.4|0.6|Machinery, equipment, and supplies merchant wholesalers
4239|2.2|1.3|0.8|0.5|0.8|Miscellaneous durable goods merchant wholesalers
42391|1.8|1.3|1.0|0.3|0.5|Sporting and recreational goods and supplies merchant wholesalers
42392|1.5|1.2|1.0|0.2||Toy and hobby goods and supplies merchant wholesalers
42393|3.7|2.1|1.3|0.7|1.6|Recyclable material merchant wholesalers
42399|1.3|0.9|0.2|0.7|0.4|Other miscellaneous durable goods merchant wholesalers
424|3.1|2.4|1.4|1.0|0.8|Merchant wholesalers, nondurable goods
4241|1.7|1.3|0.9|0.4|0.4|Paper and paper product merchant wholesalers
4242|1.3|1.0|0.3|0.7|0.3|Drugs and druggists' sundries merchant wholesalers
4243|1.6|0.9|0.4|0.5|0.7|Apparel, piece goods, and notions merchant wholesalers
4244|4.2|3.4|2.1|1.3|0.8|Grocery and related product merchant wholesalers
4245|3.8|1.5|0.9|0.6|2.4|Farm product raw material merchant wholesalers
4246|2.1|1.2|0.7|0.5|0.9|Chemical and allied products merchant wholesalers
4247|2.0|0.9|0.6|0.3|1.1|Petroleum and petroleum products merchant wholesalers
4248|5.4|4.4|2.5|1.9|1.0|Beer, wine, and distilled alcoholic beverage merchant wholesalers
4249|2.2|1.5|1.1|0.4|0.7|Miscellaneous nondurable goods merchant wholesalers
425|0.5|0.4|0.3|0.1|0.2|Wholesale electronic markets and agents and brokers
44-45|3.0|1.8|1.0|0.8|1.2|Retail trade
441|2.8|1.6|0.9|0.7|1.2|Motor vehicle and parts dealers
4411|2.5|1.2|0.8|0.4|1.3|Automobile dealers
44111|2.7|1.2|0.8|0.4|1.4|New car dealers
44112|1.2|0.8|0.6|0.2|0.4|Used car dealers
4412|2.9|1.5|1.1|0.4|1.4|Other motor vehicle dealers
44121|3.8|2.0|1.2|0.8|1.8|Recreational vehicle dealers
44122|2.5|1.3|1.0|0.2|1.3|Motorcycle, boat, and other motor vehicle dealers
4413|3.5|2.6|1.1|1.5|0.9|Automotive parts, accessories, and tire stores
44131|2.6|2.0|0.8|1.2|0.6|Automotive parts and accessories stores
44132|5.1|3.8|1.6|2.1|1.3|Tire dealers
442|2.5|1.5|0.8|0.7|1.0|Furniture and home furnishings stores
4421|2.2|1.6|0.9|0.7|0.5|Furniture stores
4422|2.9|1.3|0.7|0.6|1.6|Home furnishings stores
44221|0.6|0.5|0.4|0.1||Floor covering stores
44229|4.7|2.0|1.0|1.0|2.8|Other home furnishings stores
443|1.4|0.9|0.7|0.1|0.6|Electronics and appliance stores
4431|1.4|0.9|0.7|0.1|0.6|Electronics and appliance stores
44314|1.4|0.9|0.7|0.1|0.6|Electronics and appliance stores
443141|2.5|1.6|1.4|0.2|0.9|Household appliance stores
443142|1.3|0.8|0.7|0.1|0.5|Electronics stores
444|3.3|2.3|1.2|1.1|1.0|Building material and garden equipment and supplies dealers
4441|3.2|2.2|1.1|1.1|1.0|Building material and supplies dealers
44411|3.6|2.6|1.4|1.3|1.0|Home centers
44412|2.4|2.4|0.5|1.9||Paint and wallpaper stores
44413|2.2|1.0|0.5|0.6|1.1|Hardware stores
44419|3.1|2.0|1.0|1.0|1.1|Other building material dealers
4442|3.6|2.5|1.8|0.7|1.1|Lawn and garden equipment and supplies stores
44421|3.1|2.7|2.1|0.5||Outdoor power equipment stores
44422|3.8|2.5|1.7|0.8|1.3|Nursery, garden center, and farm supply stores
445|3.7|2.4|1.3|1.1|1.3|Food and beverage stores
4451|4.0|2.6|1.4|1.2|1.4|Grocery stores
44511|4.1|2.7|1.5|1.3|1.4|Supermarkets and other grocery (except convenience) stores
44512|2.8|0.9|0.6||1.8|Convenience stores
4452|1.4|1.0|0.7|0.3|0.4|Specialty food stores
44521|2.0|1.5|1.0|0.5||Meat markets
44523|1.5|0.8||0.4||Fruit and vegetable markets
44529|1.1|0.8|0.6|0.1||Other specialty food stores
4453|0.5|0.3|0.2|0.1|0.2|Beer, wine, and liquor stores
446|1.8|1.0|0.6|0.4|0.8|Health and personal care stores
4461|1.8|1.0|0.6|0.4|0.8|Health and personal care stores
44611|1.8|1.0|0.5|0.5|0.8|Pharmacies and drug stores
44612|2.3|1.3|1.0|0.3|1.0|Cosmetics, beauty supplies, and perfume stores
44619|1.7|1.1|1.0||0.6|Other health and personal care stores
447|1.9|1.0|0.6|0.3|0.9|Gasoline stations
4471|1.9|1.0|0.6|0.3|0.9|Gasoline stations
44711|1.7|0.9|0.6|0.3|0.9|Gasoline stations with convenience stores
44719|3.3|1.8|1.2|0.6|1.5|Other gasoline stations
448|1.5|0.6|0.5|0.2|0.9|Clothing and clothing accessories stores
4481|1.8|0.8|0.6|0.2|1.0|Clothing stores
44811|1.5|1.5|1.3|||Men's clothing stores
44812|1.1|0.5|0.4|0.2|0.6|Women's clothing stores
44813|4.0|4.0|4.0|||Children's and infants' clothing stores
44814|2.1|0.9|0.6|0.2|1.2|Family clothing stores
44819|0.7|0.5|0.3|0.2||Other clothing stores
4482|0.9|0.4|||0.5|Shoe stores
451|1.8|1.0|0.6|0.5|0.8|Sporting goods, hobby, musical instrument, and book stores
4511|1.9|1.1|0.6|0.6|0.8|Sporting goods, hobby, and musical instrument stores
45111|1.6|0.9|0.5|0.4|0.7|Sporting goods stores
45112|3.5|2.0|0.9|1.1|1.4|Hobby, toy, and game stores
4512|1.2|0.5|0.5||0.8|Book stores and news dealers
45121|1.2|0.5|0.5||0.8|Book stores and news dealers
452|4.4|2.5|1.2|1.3|1.8|General merchandise stores
4522|3.3|1.9|1.0|0.9|1.4|Department stores
4523|4.7|2.8|1.3|1.4|1.9|General merchandise stores, including warehouse clubs and supercenters
45231|4.7|2.8|1.3|1.4|1.9|General merchandise stores, including warehouse clubs and supercenters
452311|5.0|2.9|1.4|1.6|2.1|Warehouse clubs and supercenters
452319|3.1|1.9|1.1|0.8|1.1|All other general merchandise stores
453|2.6|1.7|0.9|0.7|1.0|Miscellaneous store retailers
4531|0.9|0.5||0.4||Florists
4532|1.4|0.5|0.4|0.2|0.8|Office supplies, stationery, and gift stores
45321|1.4|0.7|0.5|0.3|0.6|Office supplies and stationery stores
45322|1.4|0.4|0.3|0.1|0.9|Gift, novelty, and souvenir stores
4533|4.3|3.1|1.4|1.7|1.3|Used merchandise stores
4539|2.6|1.7|1.1|0.6|1.0|Other miscellaneous store retailers
45391|6.3|3.5|1.9|1.6|2.8|Pet and pet supplies stores
45392|0.8|0.2|0.2||0.6|Art dealers
45399|1.4|1.1|0.9|0.2|0.3|All other miscellaneous store retailers
454|2.4|1.5|1.0|0.4|1.0|Nonstore retailers
4541|1.2|0.8|0.5|0.3|0.4|Electronic shopping and mail-order houses
4542|3.7|3.0|1.7|1.3|0.7|Vending machine operators
4543|4.6|2.3|1.9|0.4|2.3|Direct selling establishments
45431|5.2|2.8|2.3|0.5|2.4|Fuel dealers
48-49|4.4|3.5|2.1|1.5|0.8|Transportation and warehousing
481|6.5|5.6|4.0|1.6|0.9|Air transportation
4811|7.3|6.3|4.5|1.8|1.0|Scheduled air transportation
48111|7.3|6.3|4.5|1.8|1.0|Scheduled air transportation
481111|7.4|6.4|4.5|1.8|1.0|Scheduled passenger air transportation
4812|1.0|0.7|0.4|0.3|0.2|Nonscheduled air transportation
482|3.4|2.8|2.8|0.1|0.6|Rail transportation
483|3.1|2.0|1.2|0.9|1.0|Water transportation
4831|4.3|2.8|1.5|1.4|1.4|Deep sea, coastal, and great lakes water transportation
48311|4.3|2.8|1.5|1.4|1.4|Deep sea, coastal, and great lakes water transportation
483111|1.6|1.2|1.0|0.2|0.5|Deep sea freight transportation
483112|5.1|2.7|2.7||2.4|Deep sea passenger transportation
483113|7.0|5.3|0.7|4.5|1.7|Coastal and great lakes freight transportation
483114|1.7|1.3|1.2|||Coastal and great lakes passenger transportation
4832|1.6|1.0|0.8|0.3|0.6|Inland water transportation
48321|1.6|1.0|0.8|0.3|0.6|Inland water transportation
483211|1.6|1.0|0.8|0.3|0.6|Inland water freight transportation
483212|1.6|0.9|0.7|||Inland water passenger transportation
484|2.9|2.2|1.6|0.7|0.7|Truck transportation
4841|3.1|2.4|1.6|0.7|0.7|General freight trucking
48411|3.2|2.5|1.7|0.7|0.7|General freight trucking, local
48412|3.0|2.3|1.6|0.7|0.7|General freight trucking, long-distance
4842|2.7|2.0|1.5|0.5|0.7|Specialized freight trucking
48421|4.3|3.4|2.4|1.1|0.8|Used household and office goods moving
48422|2.1|1.6|1.3|0.3|0.5|Specialized freight (except used goods) trucking, local
48423|2.7|1.8|1.3|0.4|0.9|Specialized freight (except used goods) trucking, long-distance
485|3.4|2.2|1.6|0.6|1.2|Transit and ground passenger transportation
4851|6.1|4.7|3.2|1.5|1.3|Urban transit systems
48532|1.1|0.9|0.9|||Limousine service
4854|3.3|1.9|1.3|0.6|1.4|School and employee bus transportation
4855|1.7|0.7|0.5||1.0|Charter bus industry
4859|3.7|2.5|2.1|0.4|1.2|Other transit and ground passenger transportation
4869|1.3|1.3||1.2||Other pipeline transportation
48691|1.3|1.3||1.3||Pipeline transportation of refined petroleum products
487|3.5|2.1|1.4|0.8|1.3|Scenic and sightseeing transportation
4871|2.2|1.7|1.4|0.3|0.5|Scenic and sightseeing transportation, land
4872|4.1|2.3|1.3|1.0|1.8|Scenic and sightseeing transportation, water
4879|4.0|2.6|2.0|||Scenic and sightseeing transportation, other
488|2.4|1.7|1.1|0.6|0.7|Support activities for transportation
4881|4.1|2.7|1.7|1.0|1.4|Support activities for air transportation
4882|2.5|2.0|1.5|0.5|0.6|Support activities for rail transportation
4883|2.2|1.6|1.2|0.4|0.6|Support activities for water transportation
48832|2.4|1.8|1.5|0.3|0.7|Marine cargo handling
48833|1.2|1.0|0.8|0.2|0.2|Navigational services to shipping
4884|1.9|1.4|0.7|0.7|0.5|Support activities for road transportation
48841|2.3|1.5|0.7|0.9|0.7|Motor vehicle towing
4885|1.2|0.8|0.6|0.2|0.3|Freight transportation arrangement
4889|2.3|1.5|0.5|1.0|0.8|Other support activities for transportation
492|8.0|6.6|4.2|2.4|1.4|Couriers and messengers
4921|7.9|6.5|4.1|2.5|1.4|Couriers and express delivery services
4922|8.5|6.9|4.9|2.0|1.7|Local messengers and local delivery
493|4.8|4.1|1.5|2.6|0.6|Warehousing and storage
4931|4.8|4.1|1.5|2.6|0.6|Warehousing and storage
49311|4.9|4.3|1.6|2.7|0.7|General warehousing and storage
49312|3.4|2.9|1.6|1.3|0.4|Refrigerated warehousing and storage
49319|2.9|2.5|1.2|1.2|0.4|Other warehousing and storage
22|1.9|1.2|0.8|0.4|0.8|Utilities
221|1.9|1.2|0.8|0.4|0.8|Utilities
2211|1.9|1.2|0.8|0.3|0.8|Electric power generation, transmission and distribution
22111|1.7|1.1|0.9|0.2|0.6|Electric power generation
221112|2.3|1.4|1.1|0.3|0.9|Fossil fuel electric power generation
221113|0.2|0.1|0.1||0.1|Nuclear electric power generation
221117|4.1|1.5|1.5||2.7|Biomass electric power generation
221118|7.0|6.5|6.5||0.5|Other electric power generation
22112|2.1|1.2|0.8|0.4|0.8|Electric power transmission, control, and distribution
2212|1.9|1.2|0.8|0.3|0.8|Natural gas distribution
2213|2.2|1.4|0.9|0.5|0.8|Water, sewage and other systems
22131|2.3|1.5|0.9|0.5|0.8|Water supply and irrigation systems
22132|1.7|1.3|1.1|||Sewage treatment facilities
51|0.7|0.4|0.3|0.1|0.3|Information
511|0.2|0.1|0.1|0.0|0.1|Publishing industries (except internet)
5111|0.4|0.3|0.2|0.1|0.1|Newspaper, periodical, book, and directory publishers
51111|0.8|0.6|0.5|0.1|0.2|Newspaper publishers
51119|0.3|||||Other publishers
5112|0.1|0.0|0.0|0.0|0.1|Software publishers
512|1.5|0.4|0.3|0.1|1.0|Motion picture and sound recording industries
5121|1.6|0.5|0.3|0.1|1.1|Motion picture and video industries
51211|1.1|0.3|0.2|0.1|0.8|Motion picture and video production
51213|3.4|1.0|0.6|0.4|2.4|Motion picture and video exhibition
515|0.8|0.4|0.3|0.1|0.4|Broadcasting (except internet)
5151|0.6|0.3|0.2|0.1|0.4|Radio and television broadcasting
51511|0.5|0.2|0.1|0.1|0.3|Radio broadcasting
51512|0.7|0.3|0.2|0.1|0.4|Television broadcasting
517|1.6|1.2|0.9|0.3|0.4|Telecommunications
5173|1.6|1.2|1.0|0.3|0.4|Wired and wireless telecommunications carriers
51731|1.6|1.2|1.0|0.3|0.4|Wired and wireless telecommunications carriers
517311|1.8|1.3|1.1|0.3|0.5|Wired telecommunications carriers
5179|1.4|1.3|0.5|0.8||Other telecommunications
518|0.3|0.1|0.1||0.2|Data processing, hosting, and related services
519|0.2|0.1|0.0|0.0|0.2|Other information services
5191|0.2|0.1|0.0|0.0|0.2|Other information services
51912|2.5|0.5|0.4||1.9|Libraries and archives
52|0.3|0.1||0.0|0.2|Finance and insurance
522|0.5|0.2|0.1|0.1|0.3|Credit intermediation and related activities
5221|0.5|0.2|0.2|0.0|0.3|Depository credit intermediation
52211|0.4|0.2|0.1|0.0|0.2|Commercial banking
52212|0.4|0.0|||0.4|Savings institutions
52213|0.9|0.4|0.3|0.2|0.5|Credit unions
5222|0.5|0.3|0.1|0.2|0.2|Nondepository credit intermediation
52221|0.2|0.0|0.0||0.2|Credit card issuing
52229|0.5|0.3|0.2|0.2|0.2|Other nondepository credit intermediation
5223|0.2|0.1|0.0||0.1|Activities related to credit intermediation
5239|0.1|0.0|0.0||0.1|Other financial investment activities
52392|0.0|0.0|0.0||0.0|Portfolio management
52393|0.2|0.0|0.0||0.1|Investment advice
5241|0.2|0.1|0.1|0.0|0.2|Insurance carriers
52411|0.2|0.1|0.1|0.0|0.1|Direct life, health, and medical insurance carriers
52412|0.3|0.1|0.1|0.0|0.2|Direct insurance (except life, health, and medical) carriers
53|1.6|1.0|0.6|0.3|0.6|Real estate and rental and leasing
531|1.4|0.8|0.5|0.3|0.6|Real estate
5311|2.0|1.1|0.7|0.4|0.8|Lessors of real estate
53111|2.4|1.4|0.9|0.5||Lessors of residential buildings and dwellings
53112|1.4|0.8|0.4|0.4|0.6|Lessors of nonresidential buildings (except miniwarehouses)
53119|2.0|1.4|1.2|0.2||Lessors of other real estate property
5312|0.3|0.2|0.1|0.1|0.1|Offices of real estate agents and brokers
5313|1.5|0.8|0.5|0.3|0.7|Activities related to real estate
53131|1.8|1.0|0.6|0.4|0.8|Real estate property managers
532|2.3|1.5|1.1|0.4|0.7|Rental and leasing services
5321|2.8|1.8|1.2|0.5|1.0|Automotive equipment rental and leasing
53211|2.4|2.0|1.7|0.3|0.4|Passenger car rental and leasing
53212|3.3|1.5|0.7|0.8|1.8|Truck, utility trailer, and RV (recreational vehicle) rental and leasing
5322|2.7|1.7|1.1|0.6|1.0|Consumer goods rental
53228|2.8|1.8|1.2|0.6|1.0|Other consumer goods rental
532281|1.8|1.6|0.8|||Formal wear and costume rental
532283|1.4|0.8|0.5|0.4|0.6|Home health equipment rental
532289|4.4|2.9|1.9|1.0|1.5|All other consumer goods rental
5324|1.1|0.8|0.4|0.3|0.3|Commercial and industrial machinery and equipment rental and leasing
53241|0.9|0.5|0.4||0.4|Construction, transportation, mining, and forestry machinery and equipment rental and leasing
53249|1.3|1.2|0.5|0.7||Other commercial and industrial machinery and equipment rental and leasing
533|0.1||||0.1|Lessors of nonfinancial intangible assets (except copyrighted works)
54|0.7|0.2|0.2|0.1|0.5|Professional, scientific, and technical services
541|0.7|0.2|0.2|0.1|0.5|Professional, scientific, and technical services
5411|0.1|0.1|0.1||0.1|Legal services
5412|0.2|0.1|0.1|0.0|0.1|Accounting, tax preparation, bookkeeping, and payroll services
54121|0.2|0.1|0.1|0.0|0.1|Accounting, tax preparation, bookkeeping, and payroll services
541211|0.1|0.1|0.1||0.0|Offices of certified public accountants
541219|0.3|0.0|0.0||0.2|Other accounting services
5413|0.6|0.3|0.2|0.1|0.3|Architectural, engineering, and related services
54131|0.3|0.2|0.2||0.1|Architectural services
54133|0.5|0.2|0.2|0.1|0.3|Engineering services
54135|1.1|0.8|0.7|0.1||Building inspection services
54138|0.9|0.6|0.4|0.2|0.4|Testing laboratories
5414|0.2|0.0|0.0|||Specialized design services
5415|0.2|0.1|0.1|0.0||Computer systems design and related services
54151|0.2|0.1|0.1|0.0||Computer systems design and related services
541511|0.2|0.1|0.1|0.0|0.1|Custom computer programming services
5416|0.3|0.2|0.1|0.0|0.1|Management, scientific, and technical consulting services
54161|0.2|0.1|0.1|0.0|0.1|Management consulting services
54169|0.6|0.3|||0.3|Other scientific and technical consulting services
5417|0.6|0.3|0.1|0.1|0.4|Scientific research and development services
5418|0.6|0.4|0.3|0.1|0.2|Advertising, public relations, and related services
5419|5.6|1.2|0.7|0.4|4.4|Other professional, scientific, and technical services
54192|0.6|0.3|0.3|0.1|0.3|Photographic services
54194|11.1|2.1|1.2|0.9|9.0|Veterinary services
54199|0.4|0.3|0.3||0.1|All other professional, scientific, and technical services
55|0.5|0.3|0.2|0.1|0.3|Management of companies and enterprises
56|1.8|1.2|0.8|0.4|0.6|Administrative and support and waste management and remediation services
561|1.6|1.0|0.7|0.3|0.6|Administrative and support services
5611|0.6|0.2|0.1|0.1|0.3|Office administrative services
5612|2.1|1.2|0.7|0.5|1.0|Facilities support services
5613|0.6|0.2|0.2|0.1|0.3|Employment services
56131|0.3|0.1|0.1|0.1|0.2|Employment placement agencies and executive search services
56132|0.7|0.3|0.2|0.1|0.4|Temporary help services
56133|0.5|0.2|0.1||0.2|Professional employer organizations
5614|0.5|0.3|0.2|0.1|0.2|Business support services
56141|0.3|0.2|0.2||0.1|Document preparation services
56142|0.4|0.2|0.1|0.1|0.2|Telephone call centers
56144|0.3|0.2|0.1||0.1|Collection agencies
56149|1.1|0.9|0.5|0.4|0.2|Other business support services
5615|0.7|0.3|0.3|0.0|0.4|Travel arrangement and reservation services
56159|1.4|0.6|0.5|0.1|0.8|Other travel arrangement and reservation services
5616|1.5|1.0|0.7|0.3|0.5|Investigation and security services
56161|1.5|1.0|0.7|0.3|0.5|Investigation, guard, and armored car services
561611|1.0|0.9|0.9||0.1|Investigation services
561612|1.4|0.9|0.7|0.2|0.5|Security guards and patrol services
561613|4.4|3.1|1.2|1.9|1.3|Armored car services
56162|1.4|0.9|0.4|0.4|0.5|Security systems services
5617|2.6|1.8|1.3|0.5|0.8|Services to buildings and dwellings
56171|2.2|1.5|1.1|0.5|0.6|Exterminating and pest control services
56172|2.5|1.7|1.2|0.5|0.7|Janitorial services
56173|3.0|2.0|1.4|0.6|1.0|Landscaping services
56174|5.6|4.8|3.9|0.9|0.9|Carpet and upholstery cleaning services
56179|1.0|0.8|0.7||0.2|Other services to buildings and dwellings
5619|2.1|1.1|0.8|0.4|0.9|Other support services
562|3.5|2.7|1.6|1.0|0.9|Waste management and remediation services
5621|4.7|3.7|2.2|1.5|1.1|Waste collection
56211|4.7|3.7|2.2|1.5|1.1|Waste collection
562111|5.0|4.0|2.4|1.6|1.0|Solid waste collection
5622|2.5|1.7|0.9|0.9|0.7|Waste treatment and disposal
56221|2.5|1.7|0.9|0.9|0.7|Waste treatment and disposal
562211|1.9|1.3|0.7|0.5|0.7|Hazardous waste treatment and disposal
562212|2.9|2.1|0.8|1.3|0.8|Solid waste landfill
5629|2.7|2.0|1.5|0.6|0.7|Remediation and other waste management services
56291|2.4|1.6|0.9|0.7|0.8|Remediation services
56292|5.9|4.8|4.0|0.8|1.1|Materials recovery facilities
56299|1.8|1.5|1.2|0.3|0.3|All other waste management services
61|1.7|0.8|0.6|0.2|0.8|Educational services
611|1.7|0.8|0.6|0.2|0.8|Educational services
6111|2.4|1.2|0.8|0.4|1.2|Elementary and secondary schools
6112|1.1|0.4|0.3||0.8|Junior colleges
6113|1.3|0.6|0.4|0.2|0.8|Colleges, universities, and professional schools
6115|0.6|0.3|0.2|0.1|0.3|Technical and trade schools
61161|0.5|0.3|0.3|||Fine arts schools
61169|1.2|0.5|0.5||0.7|All other schools and instruction
6117|0.8|0.5|0.2|0.2|0.4|Educational support services
62|3.4|1.7|1.1|0.5|1.8|Health care and social assistance
621|2.0|0.7|0.5|0.2|1.3|Ambulatory health care services
6211|1.8|0.4|0.3|0.1|1.3|Offices of physicians
62111|1.8|0.4|0.3|0.1|1.3|Offices of physicians
621111|1.8|0.4|0.3|0.1|1.3|Offices of physicians (except mental health specialists)
621112|1.8|0.7|||1.1|Offices of physicians, mental health specialists
6212|1.4|0.2|0.2|0.0|1.2|Offices of dentists
6213|1.3|0.7|0.5|0.2|0.6|Offices of other health practitioners
6214|3.5|1.1|0.8|0.3|2.4|Outpatient care centers
6215|2.6|1.1|0.8|0.4|1.5|Medical and diagnostic laboratories
6216|1.6|1.0|0.8|0.2|0.6|Home health care services
6219|4.2|2.4|1.7|0.7|1.8|Other ambulatory health care services
62191|5.9|3.7|2.8|1.0|2.2|Ambulance services
62199|2.7|1.3|0.7|0.5|1.4|All other ambulatory health care services
622|5.1|2.1|1.3|0.8|3.0|Hospitals
6221|5.1|2.1|1.3|0.8|3.0|General medical and surgical hospitals
6222|6.9|3.8|2.6|1.2|3.1|Psychiatric and substance abuse hospitals
6223|4.1|2.2|1.4|0.7|1.9|Specialty (except psychiatric and substance abuse) hospitals
623|5.5|3.6|2.4|1.2|1.9|Nursing and residential care facilities
6231|6.3|4.5|3.1|1.4|1.8|Nursing care facilities (skilled nursing facilities)
6232|4.2|2.3|1.6|0.7|1.8|Residential intellectual and developmental disability, mental health, and substance abuse facilities
6233|5.5|3.4|2.0|1.4|2.1|Continuing care retirement communities and assisted living facilities for the elderly
6239|4.8|2.9|2.1|0.9|1.8|Other residential care facilities
624|2.3|1.4|1.0|0.4|0.9|Social assistance
6241|2.2|1.3|1.0|0.3|0.9|Individual and family services
62411|2.5|1.4|0.8|0.5|1.1|Child and youth services
62412|2.1|1.3|1.0|0.3|0.8|Services for the elderly and persons with disabilities
62419|2.2|1.2|0.9|0.3|1.0|Other individual and family services
6242|3.4|1.8|1.4|0.4|1.6|Community food and housing, and emergency and other relief services
62421|4.4|2.2|1.6|0.6|2.2|Community food services
62422|3.1|1.6|1.2|0.3|1.5|Community housing services
62423|3.3|2.0|1.5|0.5|1.3|Emergency and other relief services
6243|4.0|2.4|1.5|0.9|1.5|Vocational rehabilitation services
6244|1.9|1.2|0.8|0.4|0.7|Child day care services
71|3.9|2.2|1.2|1.1|1.7|Arts, entertainment, and recreation
711|5.9|3.3|1.6|1.8|2.5|Performing arts, spectator sports, and related industries
7112|12.0|7.9|3.0|4.9|4.1|Spectator sports
71121|12.0|7.9|3.0|4.9|4.1|Spectator sports
711211|16.5|11.0|3.8|7.2||Sports teams and clubs
711212|2.8|1.6|1.4|0.2|1.2|Racetracks
711219|2.2|1.1|1.0|0.1|1.1|Other spectator sports
7113|4.1|2.1|1.6|0.4|2.0|Promoters of performing arts, sports, and similar events
7115|0.4|0.1||||Independent artists, writers, and performers
712|4.0|2.2|1.0|1.1|1.9|Museums, historical sites, and similar institutions
713|3.3|1.9|1.1|0.8|1.4|Amusement, gambling, and recreation industries
7131|5.7|4.3|1.4|2.9|1.4|Amusement parks and arcades
71311|6.4|4.8|1.5|3.3|1.6|Amusement and theme parks
71312|1.3|0.5||0.4|0.8|Amusement arcades
7132|2.4|1.4|0.9|0.5|1.0|Gambling industries
7139|3.1|1.6|1.0|0.5|1.5|Other amusement and recreation industries
71391|3.3|1.5|1.1|0.4|1.8|Golf courses and country clubs
71392|10.0|7.3|3.4|3.9|2.7|Skiing facilities
71393|4.1|2.9|2.3|0.7|1.2|Marinas
71394|1.8|0.9|0.5|0.4|1.0|Fitness and recreational sports centers
71395|2.5|0.8|0.7|0.1|1.8|Bowling centers
71399|3.7|2.0|1.5|0.5|1.7|All other amusement and recreation industries
72|2.6|1.2|0.8|0.4|1.4|Accommodation and food services
721|3.8|2.3|1.2|1.0|1.5|Accommodation
7211|3.8|2.3|1.2|1.1|1.5|Traveler accommodation
72111|3.9|2.3|1.3|1.0|1.6|Hotels (except casino hotels) and motels
72112|3.5|2.4|1.1|1.3|1.1|Casino hotels
72119|2.2|1.1|0.9|0.2|1.1|Other traveler accommodation
7212|4.3|1.8|1.3|0.4|2.6|RV (recreational vehicle) parks and recreational camps
72121|4.3|1.8|1.3|0.4|2.6|RV (recreational vehicle) parks and recreational camps
721214|7.0|3.1|2.3|0.8|3.9|Recreational and vacation camps (except campgrounds)
7213|0.6|0.3|||0.3|Rooming and boarding houses, dormitories, and workers' camps
722|2.4|1.0|0.7|0.3|1.4|Food services and drinking places
7223|3.1|2.0|1.2|0.8|1.1|Special food services
7224|1.3|0.6|0.6||0.7|Drinking places (alcoholic beverages)
7225|2.4|1.0|0.7|0.2|1.4|Restaurants and other eating places
72251|2.4|1.0|0.7|0.2|1.4|Restaurants and other eating places
722511|2.2|0.8|0.7|0.2|1.3|Full-service restaurants
722513|2.6|1.0|0.8|0.3|1.6|Limited-service restaurants
722514|1.4|0.5|0.4|0.1|0.9|Cafeterias, grill buffets, and buffets
722515|2.7|1.3|0.8|0.5|1.3|Snack and nonalcoholic beverage bars
81|1.9|1.1|0.7|0.4|0.8|Other services (except public administration)
811|2.0|1.3|0.9|0.4|0.7|Repair and maintenance
8111|1.9|1.1|0.9|0.3|0.8|Automotive repair and maintenance
8112|1.7|1.3|1.1||0.3|Electronic and precision equipment repair and maintenance
8113|2.4|1.8|1.0|0.8|0.7|Commercial and industrial machinery and equipment (except automotive and electronic) repair and maintenance
8114|1.8|1.2|1.1||0.6|Personal and household goods repair and maintenance
812|1.8|0.9|0.6|0.3|0.9|Personal and laundry services
8121|0.4|0.1|0.1||0.2|Personal care services
8122|1.4|0.7|0.5|0.2|0.7|Death care services
8123|2.5|1.6|0.8|0.8|1.0|Drycleaning and laundry services
81232|1.3|0.6|0.4|0.2|0.7|Drycleaning and laundry services (except coin-operated)
81233|3.6|2.3|1.1|1.2|1.2|Linen and uniform supply
812331|4.2|3.2|1.5|1.6|1.1|Linen supply
812332|2.9|1.5|0.6|0.9|1.4|Industrial launderers
8129|3.9|1.8|1.3|0.4|2.1|Other personal services
81291|5.8|2.0|1.5|0.5|3.8|Pet care (except veterinary) services
81293|3.1|1.7|1.0|0.7|1.4|Parking lots and garages
81299|1.9|1.6|1.5|||All other personal services
813|1.7|0.9|0.5|0.4|0.8|Religious, grantmaking, civic, professional, and similar organizations
S|3.0|1.7|1.3|0.4|1.3|State government
S61|1.5|0.7|0.4|0.3|0.8|Educational services
S611|1.5|0.7|0.4|0.3|0.8|Educational services
S6113|1.5|0.6|0.4|0.3|0.8|Colleges, universities, and professional schools
S62|6.0|3.5|2.9|0.6|2.5|Health care and social assistance
S622|6.9|3.8|3.0|0.8|3.1|Hospitals
S623|8.3|6.1|5.5|0.7|2.2|Nursing and residential care facilities
S92|3.2|1.9|1.6|0.3|1.3|Public administration
S922|5.1|2.9|2.5|0.4|2.2|Justice, public order, and safety activities
S9221|5.1|2.9|2.5|0.4|2.2|Justice, public order, and safety activities
S92212|4.8|2.7|2.1|0.6|2.1|Police protection
S92214|7.5|4.3|3.8|0.5|3.2|Correctional institutions
L|4.8|2.3|1.5|0.7|2.6|Local government
L22|4.3|2.8|1.7|1.1|1.5|Utilities
L221|4.3|2.8|1.7|1.1|1.5|Utilities
L2213|4.9|3.2|1.9|1.3|1.7|Water, sewage and other systems
L61|3.9|1.7|1.1|0.6|2.2|Educational services
L611|3.9|1.7|1.1|0.6|2.2|Educational services
L6111|4.0|1.7|1.1|0.6|2.3|Elementary and secondary schools
L62|4.4|1.7|1.2|0.5|2.6|Health care and social assistance
L622|4.9|1.7|1.2|0.5|3.2|Hospitals
L623|4.6|3.0|2.0|1.0|1.7|Nursing and residential care facilities
L92|6.4|3.1|2.2|0.9|3.3|Public administration`;

const PREFIX: Record<Ownership, string> = { private: "", state: "S", local: "L" };
const TOTAL: Record<Ownership, string> = { private: "private", state: "S", local: "L" };
// BLS prints these sectors as ranges.
const SECTOR: Record<string, string> = { "31": "31-33", "32": "31-33", "33": "31-33", "44": "44-45", "45": "44-45", "48": "48-49", "49": "48-49" };
// 2022 NAICS retail codes BLS still reports under their 2017 codes.
const NAICS_2022: [string, string, string][] = [
  ["4551", "4522", "Department stores"],
  ["4552", "4523", "Warehouse clubs, supercenters and other general merchandise"],
  ["455", "452", "General merchandise"],
  ["456", "446", "Health and personal care"],
  ["457", "447", "Gasoline stations"],
  ["458", "448", "Clothing and accessories"],
];

const num = (s: string) => (s === "" || s == null ? null : Number(s));
const TABLE = new Map<string, NaicsRate>();
for (const line of DATA.split("\n")) {
  const [key, trc, dart, dafw, djtr, other, ...rest] = line.split("|");
  if (!key) continue;
  const ownership: NaicsRate["ownership"] = key === "all" ? "all" : key === "S" || /^S\d/.test(key) ? "state" : key === "L" || /^L\d/.test(key) ? "local" : "private";
  const code = key === "all" || key === "private" || key === "S" || key === "L" ? "" : key.replace(/^[SL]/, "");
  TABLE.set(key, { code, name: rest.join("|"), ownership, trc: Number(trc), dart: num(dart), dafw: num(dafw), djtr: num(djtr), other: num(other) });
}

/** Every published row for one ownership, in BLS order. */
export function allNaics(ownership: Ownership = "private"): NaicsRate[] {
  return [...TABLE.values()].filter((r) => r.ownership === ownership && r.code);
}

/** The total row: all private industry, all state government, or all local government. */
export function ownershipTotal(ownership: Ownership = "private"): NaicsRate {
  return TABLE.get(TOTAL[ownership])!;
}

/** The exact row for a code, or undefined. */
export function getNaics(code: string, ownership: Ownership = "private"): NaicsRate | undefined {
  return TABLE.get(PREFIX[ownership] + code);
}

/** Pull a NAICS code out of whatever the user typed ("722511", "NAICS 23-8", "31-33"). */
export function cleanNaics(input: unknown): string {
  const s = String(input ?? "").trim();
  const range = s.match(/\b(31-33|44-45|48-49)\b/);
  if (range) return range[1];
  return s.replace(/\D/g, "").slice(0, 6);
}

/**
 * Find the BLS rate for a NAICS code. If BLS doesn't publish that exact code it walks up
 * one digit at a time (722511 → 72251 → 7225 ...) and says which group it used. If
 * nothing matches it falls back to the ownership total. Returns null for blank input.
 */
export function lookupNaics(input: unknown, ownership: Ownership = "private"): NaicsMatch | null {
  let code = cleanNaics(input);
  if (code.length < 2) return null;
  const typed = code;
  let mapped = "";
  if (/^\d+$/.test(code)) {
    const cw = NAICS_2022.find(([from]) => code.startsWith(from));
    if (cw && !getNaics(code, ownership)) {
      code = cw[1];
      mapped = `${typed} is a 2022 NAICS code. BLS still reports it as ${cw[1]} (${cw[2]}).`;
    }
  }
  const p = PREFIX[ownership];
  for (let c = code; c.length >= 2; c = c.slice(0, -1)) {
    for (const k of [c, SECTOR[c]]) {
      if (!k) continue;
      const rate = TABLE.get(p + k);
      if (!rate) continue;
      // A 6-digit code ending in 0 is the same industry as its 5-digit parent (238160 = 23816).
      const exact = k === typed || (typed.length === 6 && typed.endsWith("0") && k === typed.slice(0, 5));
      const note = exact ? "" : mapped && k === code ? mapped : `BLS doesn't publish ${typed}${ownership === "private" ? "" : ` for ${ownership} government`}. Using ${k}, ${rate.name}, the closest group above it.`;
      return { input: typed, rate, exact, note };
    }
    if (c.includes("-")) break;
  }
  const rate = ownershipTotal(ownership);
  const gov = typed.startsWith("92") && ownership === "private" ? " Codes starting with 92 are public administration, so pick state or local government." : "";
  return { input: typed, rate, exact: false, note: `No BLS rate for ${typed}. Using the average for all ${rate.name.toLowerCase()}.${gov}` };
}

/** Search by code prefix ("2381") or by words in the industry name ("roofing"). */
export function searchNaics(query: string, ownership: Ownership = "private", limit = 8): NaicsRate[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const rows = allNaics(ownership);
  if (/^\d/.test(q)) {
    const c = cleanNaics(q);
    return rows.filter((r) => r.code.startsWith(c) || r.code.replace("-", "").startsWith(c)).sort((a, b) => a.code.length - b.code.length || a.code.localeCompare(b.code)).slice(0, limit);
  }
  const words = q.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  return rows
    .filter((r) => words.every((w) => r.name.toLowerCase().includes(w)))
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(words[0])) - Number(!b.name.toLowerCase().startsWith(words[0])) || a.code.length - b.code.length || a.code.localeCompare(b.code))
    .filter((r) => (seen.has(r.name) ? false : (seen.add(r.name), true)))
    .slice(0, limit);
}

/** "Full-service restaurants (NAICS 722511)" */
export const naicsLabel = (r: NaicsRate) => (r.code ? `${r.name} (NAICS ${r.code})` : r.name);
