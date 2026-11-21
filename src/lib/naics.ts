// NAICS lookup for BLS injury and illness rates.
//
// Self-contained on purpose: no imports, so this one file can be copied into another
// project as is. The same numbers are in data/bls-soii-2025-table1-rates.csv for
// spreadsheets or other tools.
//
// Source: U.S. Bureau of Labor Statistics, Survey of Occupational Injuries and Illnesses
// (SOII), Table 1, "Incidence rates of nonfatal occupational injuries and illnesses by
// industry and case types, 2025". Public domain. Copied Nov 20, 2026.
// Rates are cases per 100 full-time workers, which is 200,000 hours worked.
// BLS uses 2022 NAICS codes in this table. The 2025 table switched from 2017 to 2022
// NAICS, so industry codes are not directly comparable to the 2024 table.
//
// To update for a new year: replace SOII_YEAR, SOII_URL and DATA. One line per industry:
//   code|TRC|DART|DAFW|DJTR|Other|Industry name   (blank = BLS didn't publish it)
// Plain codes are private industry. "S..." is state government, "L..." is local government.
// "all", "private", "S" and "L" are the totals.

export const SOII_YEAR = 2025;
export const SOII_URL = "https://www.bls.gov/iif/nonfatal-injuries-and-illnesses-tables/table-1-injury-and-illness-rates-by-industry-2025-national.xlsx";
export const SOII_NEXT = "BLS plans to publish 2026 rates in November 2027.";

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

const DATA = `all|2.5|1.4|0.9|0.5|1.1|All industries including private, state and local government
private|2.3|1.3|0.8|0.5|0.9|Private industry
11|3.9|2.6|1.6|1.1|1.3|Agriculture, forestry, fishing and hunting
111|4.0|2.6|1.5|1.1||Crop production
1111|2.3|1.6|1.5||0.7|Oilseed and grain farming
1112|3.4|2.5|1.2|1.3|0.9|Vegetable and melon farming
1113|3.8|2.5|1.3|1.2|1.3|Fruit and tree nut farming
112|4.4|3.1|2.1|1.1|1.3|Animal production and aquaculture
1121|4.1|2.9|2.1|0.8|1.2|Cattle ranching and farming
11211|4.4|2.9|2.1|0.8|1.5|Beef cattle ranching and farming, including feedlots
11212|4.1|2.9|2.1|0.8|1.2|Dairy cattle and milk production
1122|7.5|5.3|3.1|2.2|2.2|Hog and pig farming
1123|3.3|2.1|1.2|0.8|1.2|Poultry and egg production
1129|7.9|7.0|2.8|4.2|0.9|Other animal production
113|3.2|1.3|1.2|0.1|1.9|Forestry and logging
1133|3.5|1.4|1.4|0.1|2.0|Logging
114|0.6|0.4|0.4|||Fishing, hunting and trapping
1141|1.0|0.7|0.6|||Fishing
115|3.6|2.5|1.4|1.1|1.2|Support activities for agriculture and forestry
1151|3.8|2.6|1.4|1.2|1.1|Support activities for crop production
11511|3.8|2.6|1.4|1.2|1.1|Support activities for crop production
115111|8.7|4.2|4.2||4.5|Cotton ginning
115112|3.8|2.9|1.4|1.4|0.9|Soil preparation, planting, and cultivating
115114|3.7|2.7|1.4|1.4|1.0|Postharvest crop activities (except cotton ginning)
115115|3.7|2.5|1.3|1.2|1.2|Farm labor contractors and crew leaders
115116|2.9|2.4|1.3|1.0|0.5|Farm management services
1153|3.2|2.0|1.5|0.5|1.2|Support activities for forestry
21|1.1|0.8|0.6|0.2|0.3|Mining, quarrying, and oil and gas extraction
211|0.5|0.3|0.2|0.1|0.1|Oil and gas extraction
2111|0.5|0.3|0.2|0.1|0.1|Oil and gas extraction
21112|0.5|0.4|0.3|0.1|0.1|Crude petroleum extraction
21113|0.4|0.3|0.2||0.2|Natural gas extraction
212|2.0|1.4|1.0|0.4|0.6|Mining (except oil and gas)
2121|3.1|2.3|2.2|0.1|0.9|Coal mining
21211|3.1|2.3|2.2|0.1|0.9|Coal mining
212114|1.3|0.9|0.9||0.4|Surface coal mining
212115|4.4|3.1|3.0|0.1|1.2|Underground coal mining
2122|1.7|1.3|0.6|0.6|0.5|Metal ore mining
21221|1.4|0.9|0.5|0.4|0.5|Iron ore mining
21222|1.5|1.1|0.6|0.5|0.4|Gold ore and silver ore mining
21223|1.9|1.4|0.7|0.7|0.5|Copper, nickel, lead, and zinc mining
21229|2.1|1.5|0.8|0.8|0.5|Other metal ore mining
2123|1.6|1.1|0.7|0.4|0.5|Nonmetallic mineral mining and quarrying
21231|1.7|1.1|0.7|0.5|0.5|Stone mining and quarrying
212311|1.4|1.1|0.8|0.3|0.3|Dimension stone mining and quarrying
212312|1.7|1.1|0.7|0.5|0.6|Crushed and broken limestone mining and quarrying
212313|1.2|0.8|0.4|0.3|0.4|Crushed and broken granite mining and quarrying
212319|1.9|1.4|0.9|0.5|0.5|Other crushed and broken stone mining and quarrying
21232|1.4|1.0|0.7|0.3|0.4|Sand, gravel, clay, and ceramic and refractory minerals mining and quarrying
212321|1.5|1.0|0.7|0.3|0.4|Construction sand and gravel mining
21239|1.8|1.4|1.0|0.4|0.4|Other nonmetallic mineral mining and quarrying
213|0.7|0.5|0.4|0.1|0.2|Support activities for mining
2131|0.7|0.5|0.4|0.1|0.2|Support activities for mining
21311|0.7|0.5|0.4|0.1|0.2|Support activities for mining
213111|1.2|0.8|0.3|0.5|0.4|Drilling oil and gas wells
213112|0.6|0.4|0.4|0.0|0.1|Support activities for oil and gas operations
23|2.0|1.2|0.8|0.4|0.8|Construction
236|1.5|0.9|0.7|0.3|0.6|Construction of buildings
2361|1.9|1.2|1.0|0.2|0.7|Residential building construction
2362|1.1|0.6|0.4|0.3|0.5|Nonresidential building construction
237|1.8|1.1|0.6|0.5|0.7|Heavy and civil engineering construction
2371|1.6|1.0|0.5|0.5|0.6|Utility system construction
23711|2.5|1.6|0.6|1.0|0.8|Water and sewer line and related structures construction
23712|0.8|0.4|0.3|0.1|0.4|Oil and gas pipeline and related structures construction
23713|1.2|0.7|0.5|0.3|0.5|Power and communication line and related structures construction
2373|2.2|1.3|0.8|0.5|0.9|Highway, street, and bridge construction
2379|1.9|1.1|0.5|0.6|0.8|Other heavy and civil engineering construction
238|2.2|1.4|0.9|0.5|0.8|Specialty trade contractors
2381|2.8|1.8|1.2|0.6|1.0|Foundation, structure, and building exterior contractors
23811|2.1|0.9|0.6|0.3|1.2|Poured concrete foundation and structure contractors
23812|4.1|2.7|2.1|0.6|1.4|Structural steel and precast concrete contractors
23813|4.5|2.7|1.7|1.0|1.8|Framing contractors
23814|2.2|1.8|1.3|0.4|0.5|Masonry contractors
23815|2.5|1.4|0.4|1.0|1.1|Glass and glazing contractors
23816|3.1|2.3|1.6|0.7|0.8|Roofing contractors
23817|3.5|2.0|1.6|0.4|1.5|Siding contractors
2382|2.2|1.3|0.9|0.5|0.9|Building equipment contractors
23821|1.6|1.0|0.6|0.3|0.6|Electrical contractors and other wiring installation contractors
23822|2.9|1.7|1.1|0.6|1.2|Plumbing, heating, and air-conditioning contractors
23829|1.5|0.8|0.5|0.4|0.7|Other building equipment contractors
2383|2.1|1.4|0.8|0.5|0.8|Building finishing contractors
23831|2.1|1.4|0.9|0.5|0.7|Drywall and insulation contractors
23832|2.2|1.4|0.9|0.5|0.8|Painting and wall covering contractors
23833|1.0|0.7|0.5|0.2||Flooring contractors
23834|1.6|1.4|0.7|0.8||Tile and terrazzo contractors
23839|2.7|1.8|1.1|0.7|0.9|Other building finishing contractors
2389|1.7|1.2|1.0|0.2|0.5|Other specialty trade contractors
23891|1.3|1.0|0.8||0.3|Site preparation contractors
23899|2.1|1.4|1.1|0.3|0.7|All other specialty trade contractors
31-33|2.5|1.6|0.8|0.8|0.9|Manufacturing
311|3.1|2.2|1.1|1.0|1.0|Food manufacturing
3111|2.5|1.4|0.9|0.5|1.1|Animal food manufacturing
31111|2.5|1.4|0.9|0.5|1.1|Animal food manufacturing
311111|1.7|1.0|0.5|0.5|0.7|Dog and cat food manufacturing
311119|3.3|1.8|1.3|0.5|1.5|Other animal food manufacturing
3112|2.6|1.6|0.8|0.8|1.0|Grain and oilseed milling
31121|3.1|2.1|1.2|0.9|1.0|Flour milling and malt manufacturing
311211|3.1|2.4|1.4|1.0|0.7|Flour milling
311212|3.6|1.6|0.8|0.8|2.0|Rice milling
311213|1.7|||||Malt manufacturing
31122|2.3|1.2|0.6|0.6|1.2|Starch and vegetable fats and oils manufacturing
311224|3.8|1.5|0.7|0.8|2.3|Soybean and other oilseed processing
311225|1.8|1.3|0.6|0.7|0.4|Fats and oils refining and blending
31123|2.3|1.7|0.8|0.9|0.6|Breakfast cereal manufacturing
3113|2.6|1.8|1.0|0.8|0.7|Sugar and confectionery product manufacturing
31134|2.4|1.8|1.1|0.8|0.6|Nonchocolate confectionery manufacturing
31135|2.2|1.6|0.9|0.7|0.7|Chocolate and confectionery manufacturing
311351|2.9|1.9|1.1|0.8|1.0|Chocolate and confectionery manufacturing from cacao beans
311352|2.0|1.5|0.8|0.7|0.5|Confectionery manufacturing from purchased chocolate
3114|3.5|2.4|1.4|1.0|1.2|Fruit and vegetable preserving and specialty food manufacturing
31141|3.2|2.2|1.2|0.9|1.0|Frozen food manufacturing
311411|4.2|3.2|1.9|1.3|0.9|Frozen fruit, juice, and vegetable manufacturing
311412|2.8|1.7|0.9|0.8|1.1|Frozen specialty food manufacturing
31142|3.9|2.6|1.5|1.1|1.3|Fruit and vegetable canning, pickling, and drying
311421|4.5|3.1|1.8|1.3|1.5|Fruit and vegetable canning
311422|1.9|1.3|0.8|0.6|0.6|Specialty canning
311423|3.6|2.2|1.2|1.1|1.3|Dried and dehydrated food manufacturing
3115|3.7|2.8|1.6|1.2|0.9|Dairy product manufacturing
31151|3.7|2.8|1.6|1.3|0.9|Dairy product (except frozen) manufacturing
311511|4.4|3.6|2.1|1.5|0.8|Fluid milk manufacturing
311512|4.5|3.8|1.7|2.1|0.7|Creamery butter manufacturing
311513|3.4|2.5|1.3|1.2|1.0|Cheese manufacturing
311514|2.6|1.7|0.9|0.8|0.9|Dry, condensed, and evaporated dairy product manufacturing
31152|3.5|2.4|1.7|0.7|1.1|Ice cream and frozen dessert manufacturing
3116|3.0|1.9|0.7|1.2|1.1|Animal slaughtering and processing
31161|3.0|1.9|0.7|1.2|1.1|Animal slaughtering and processing
311611|3.4|2.3|0.7|1.6|1.1|Animal (except poultry) slaughtering
311612|3.6|2.6|1.1|1.4|1.1|Meat processed from carcasses
311613|4.8|2.5|0.9|1.5|2.3|Rendering and meat byproduct processing
311615|2.3|1.3|0.5|0.8|1.0|Poultry processing
3117|4.3|3.3|2.4|0.9|1.1|Seafood product preparation and packaging
3118|3.2|2.3|1.4|1.0|0.8|Bakeries and tortilla manufacturing
31181|3.1|2.4|1.4|1.0|0.7|Bread and bakery product manufacturing
311811|1.8|1.2|0.9|0.3|0.6|Retail bakeries
311812|3.8|3.0|1.7|1.3|0.8|Commercial bakeries
311813|3.0|2.2|1.2|1.0|0.9|Frozen cakes, pies, and other pastries manufacturing
311821|2.9|2.2|1.3|0.9|0.7|Cookie and cracker manufacturing
31183|4.5|2.6|1.0|1.6|1.8|Tortilla manufacturing
3119|3.1|2.2|1.2|1.0|0.9|Other food manufacturing
31191|2.6|1.8|0.7|1.1|0.8|Snack food manufacturing
311911|3.3|2.5|1.3|1.2|0.8|Roasted nuts and peanut butter manufacturing
311919|2.4|1.6|0.5|1.1|0.8|Other snack food manufacturing
31192|1.9|1.5|0.9|0.6|0.4|Coffee and tea manufacturing
31193|2.6|1.5|0.7|0.7|1.2|Flavoring syrup and concentrate manufacturing
31194|3.3|2.4|1.2|1.2|0.9|Seasoning and dressing manufacturing
311941|3.7|3.0|1.2|1.8|0.8|Mayonnaise, dressing, and other prepared sauce manufacturing
31199|3.5|2.5|1.5|0.9|1.0|All other food manufacturing
311991|3.3|2.4|1.6|0.9|0.9|Perishable prepared food manufacturing
311999|3.8|2.5|1.5|1.0|1.3|All other miscellaneous food manufacturing
312|3.1|2.2|1.2|1.0|0.9|Beverage and tobacco product manufacturing
3121|3.2|2.2|1.2|1.1|0.9|Beverage manufacturing
31211|4.2|3.4|1.5|1.9|0.9|Soft drink and ice manufacturing
312111|4.8|3.9|1.7|2.2|1.0|Soft drink manufacturing
312112|2.6|1.9|0.6|1.3|0.7|Bottled water manufacturing
31212|2.2|1.1|0.7|0.4|1.1|Breweries
31213|2.7|1.6|1.3|0.3|1.0|Wineries
31214|2.2|1.5|0.9|0.6|0.7|Distilleries
3122|1.8|1.3|0.7||0.6|Tobacco manufacturing
313|2.3|1.7|0.8|0.9|0.6|Textile mills
3132|2.7|1.8|1.0|0.9|0.9|Fabric mills
31321|2.6|1.7|0.7|1.0|0.8|Broadwoven fabric mills
31322|3.1|2.3|1.3|1.0|0.8|Narrow fabric mills and schiffli machine embroidery
31323|2.6|1.8|1.0|0.8|0.8|Nonwoven fabric mills
31324|3.5|1.9|1.5|0.5|1.5|Knit fabric mills
3133|1.6|1.2|0.5|0.7|0.4|Textile and fabric finishing and fabric coating mills
31331|1.4|1.1|0.5|0.7|0.3|Textile and fabric finishing mills
31412|1.1|0.9|0.3|0.6|0.2|Curtain and linen mills
3149|2.2|1.4|0.7|0.6|0.8|Other textile product mills
31491|2.7|1.6|0.9|0.7|1.1|Textile bag and canvas mills
31499|1.8|1.1|0.6|0.5|0.7|All other textile product mills
314994|2.1|1.6|0.8|0.8|0.5|Rope, cordage, twine, tire cord, and tire fabric mills
314999|1.7|1.0|0.6|0.5|0.7|All other miscellaneous textile product mills
315|1.2|0.7|0.3|0.3|0.6|Apparel manufacturing
3151|1.4|0.9|0.4|0.6|0.5|Apparel knitting mills
3152|1.1|0.5|0.3|0.2|0.6|Cut and sew apparel manufacturing
31521|0.9|0.4||0.2|0.4|Cut and sew apparel contractors
31525|1.2|0.6|0.4|0.2|0.6|Cut and sew apparel manufacturing (except contractors)
3159|1.5|1.1|0.4|0.7|0.4|Apparel accessories and other apparel manufacturing
316|4.5|3.0|1.5|1.5|1.5|Leather and allied product manufacturing
3161|9.9|6.9|3.2|3.7|3.0|Leather and hide tanning and finishing
3162|4.6|2.8|1.5|1.3|1.8|Footwear manufacturing
3169|2.7|2.0|0.9|||Other leather and allied product manufacturing
321|4.0|2.5|1.4|1.2|1.5|Wood product manufacturing
3211|3.2|1.9|1.2|0.7|1.3|Sawmills and wood preservation
32111|3.2|1.9|1.2|0.7|1.3|Sawmills and wood preservation
321113|3.1|1.8|1.2|0.7|1.2|Sawmills
321114|4.2|2.5|1.7|0.8|1.7|Wood preservation
3212|4.5|2.8|1.3|1.5|1.7|Veneer, plywood, and engineered wood product manufacturing
32121|4.5|2.8|1.3|1.5|1.7|Veneer, plywood, and engineered wood product manufacturing
321211|3.6|2.3|1.3|1.0|1.3|Hardwood veneer and plywood manufacturing
321212|4.3|2.5|1.6|1.0|1.8|Softwood veneer and plywood manufacturing
321215|5.7|3.7|1.5|2.2|2.1|Engineered wood member manufacturing
3219|4.2|2.7|1.4|1.3|1.5|Other wood product manufacturing
32191|3.1|2.0|1.1|0.8|1.2|Millwork
321911|2.7|1.8|0.9|1.0|0.9|Wood window and door manufacturing
321912|5.1|2.5|2.0|0.5|2.6|Cut stock, resawing lumber, and planing
321918|3.1|2.0|1.3|0.7|1.1|Other millwork (including flooring)
32192|4.5|3.3|1.8|1.5|1.2|Wood container and pallet manufacturing
32199|5.3|3.2|1.5|1.6|2.1|All other wood product manufacturing
321991|5.6|3.3|1.3|2.1|2.2|Manufactured home (mobile home) manufacturing
321999|3.1|1.7|1.2|0.5|1.4|All other miscellaneous wood product manufacturing
322|2.1|1.4|0.7|0.7|0.7|Paper manufacturing
3221|2.2|1.3|0.8|0.5|0.8|Pulp, paper, and paperboard mills
32212|2.4|1.4|0.9|0.5|0.9|Paper mills
32213|1.8|1.2|0.7|0.5|0.6|Paperboard mills
3222|2.1|1.4|0.7|0.8|0.7|Converted paper product manufacturing
32221|2.0|1.3|0.6|0.7|0.7|Paperboard container manufacturing
322211|2.0|1.4|0.7|0.7|0.6|Corrugated and solid fiber box manufacturing
322212|1.4|0.7|0.4|0.3|0.7|Folding paperboard box manufacturing
322219|2.4|1.6|0.7|0.9|0.8|Other paperboard container manufacturing
32222|2.7|2.0|0.9|1.1|0.8|Paper bag and coated and treated paper manufacturing
32223|1.8|1.3|0.6|0.7|0.5|Stationery product manufacturing
32229|1.9|1.4|0.7|0.7|0.5|Other converted paper product manufacturing
322291|1.7|1.3|0.6|0.6|0.4|Sanitary paper product manufacturing
322299|2.1|1.5|0.8|0.8|0.6|All other converted paper product manufacturing
323|1.4|0.9|0.5|0.3|0.5|Printing and related support activities
3231|1.4|0.9|0.5|0.3|0.5|Printing and related support activities
32311|1.4|0.9|0.5|0.4|0.5|Printing
323111|1.6|1.0|0.6|0.4|0.6|Commercial printing (except screen and books)
323113|0.6|0.3|0.2|0.2|0.2|Commercial screen printing
323117|2.1|1.2|0.5|0.7|0.8|Books printing
32312|1.7|0.8|0.6|0.2|0.9|Support activities for printing
324|1.0|0.7|0.5|0.2|0.2|Petroleum and coal products manufacturing
3241|1.0|0.7|0.5|0.2|0.2|Petroleum and coal products manufacturing
32411|0.5|0.3|0.2|0.2|0.2|Petroleum refineries
324121|0.6|0.3|0.1|0.2|0.3|Asphalt paving mixture and block manufacturing
32419|1.5|1.1|0.6|0.5|0.4|Other petroleum and coal products manufacturing
324191|1.4|1.0|0.6|0.4|0.4|Petroleum lubricating oil and grease manufacturing
324199|1.6|1.2|0.6|0.5|0.5|All other petroleum and coal products manufacturing
325|1.5|1.0|0.5|0.4|0.5|Chemical manufacturing
3251|1.0|0.6|0.3|0.3|0.4|Basic chemical manufacturing
32513|1.9|1.5|1.1|0.5|0.4|Synthetic dye and pigment manufacturing
32518|1.1|0.7|0.4|0.3|0.4|Other basic inorganic chemical manufacturing
32519|1.5|0.8|0.4|0.5|0.6|Other basic organic chemical manufacturing
325193|2.8|1.2|0.7|0.5|1.6|Ethyl alcohol manufacturing
325199|1.1|0.7|0.3|0.5|0.3|All other basic organic chemical manufacturing
3252|2.1|1.5|0.9|0.6|0.6|Resin, synthetic rubber, and artificial and synthetic fibers and filaments manufacturing
32521|2.2|1.6|1.0|0.6|0.6|Resin and synthetic rubber manufacturing
325211|2.1|1.5|0.9|0.6|0.6|Plastics material and resin manufacturing
325212|2.8|2.0|1.9||0.8|Synthetic rubber manufacturing
32522|1.7|1.0|0.4|0.6|0.6|Artificial and synthetic fibers and filaments manufacturing
3253|1.8|1.0|0.4|0.6|0.7|Pesticide, fertilizer, and other agricultural chemical manufacturing
32531|1.9|1.2|0.5|0.7|0.7|Fertilizer and compost manufacturing
325311|0.6|0.2|||0.4|Nitrogenous fertilizer manufacturing
32532|1.4|0.6|0.3|0.4|0.7|Pesticide and other agricultural chemical manufacturing
3254|1.2|0.8|0.4|0.4|0.4|Pharmaceutical and medicine manufacturing
32541|1.2|0.8|0.4|0.4|0.4|Pharmaceutical and medicine manufacturing
325411|1.3|0.9|0.6|0.3|0.4|Medicinal and botanical manufacturing
325412|1.3|0.8|0.4|0.4|0.4|Pharmaceutical preparation manufacturing
325413|1.1|0.8|0.4|0.4|0.3|In-vitro diagnostic substance manufacturing
325414|0.9|0.6|0.2|0.3|0.4|Biological product (except diagnostic) manufacturing
3255|1.7|1.2|0.8|0.4|0.5|Paint, coating, and adhesive manufacturing
3256|1.8|1.3|0.7|0.6|0.6|Soap, cleaning compound, and toilet preparation manufacturing
32561|2.0|1.3|0.7|0.6|0.7|Soap and cleaning compound manufacturing
325611|2.0|1.3|0.7|0.6|0.7|Soap and other detergent manufacturing
325612|2.1|1.5|0.7|0.8|0.6|Polish and other sanitation good manufacturing
325613|1.0|0.4|0.4||0.7|Surface active agent manufacturing
32562|1.7|1.2|0.7|0.5|0.5|Toilet preparation manufacturing
3259|1.9|1.4|0.8|0.6|0.5|Other chemical product and preparation manufacturing
32591|1.2|0.8|0.4|0.4||Printing ink manufacturing
32599|1.9|1.4|0.8|0.6|0.5|All other chemical product and preparation manufacturing
325998|1.6|1.1|0.6|0.5|0.5|All other miscellaneous chemical product and preparation manufacturing
326|2.7|1.8|0.9|0.9|0.9|Plastics and rubber products manufacturing
3261|2.7|1.8|0.9|0.9|0.9|Plastics product manufacturing
32611|2.6|1.7|0.7|1.0|0.9|Plastics packaging materials and unlaminated film and sheet manufacturing
326111|2.5|1.8|0.6|1.2|0.7|Plastics bag and pouch manufacturing
326112|2.1|1.3|0.7|0.7|0.7|Plastics packaging film and sheet (including laminated) manufacturing
326113|3.2|2.0|0.9|1.1|1.2|Unlaminated plastics film and sheet (except packaging) manufacturing
32612|2.7|1.7|0.8|0.8|1.0|Plastics pipe, pipe fitting, and unlaminated profile shape manufacturing
326121|2.7|1.5|0.7|0.8|1.1|Unlaminated plastics profile shape manufacturing
326122|2.7|1.7|0.9|0.9|0.9|Plastics pipe and pipe fitting manufacturing
32613|3.2|2.3|0.9|1.5|0.9|Laminated plastics plate, sheet (except packaging), and shape manufacturing
32614|2.5|1.9|0.8|1.1|0.5|Polystyrene foam product manufacturing
32615|3.6|2.5|1.2|1.3|1.1|Urethane and other foam product (except polystyrene) manufacturing
32616|1.3|0.9|0.5|0.4|0.4|Plastics bottle manufacturing
32619|2.8|1.8|1.1|0.8|1.0|Other plastics product manufacturing
326191|1.2|0.6|0.2|0.4|0.6|Plastics plumbing fixture manufacturing
326199|2.9|1.9|1.1|0.8|1.0|All other plastics product manufacturing
3262|2.7|1.9|0.9|1.0|0.8|Rubber product manufacturing
32621|3.1|2.4|1.0|1.4|0.7|Tire manufacturing
326211|3.1|2.3|0.9|1.4|0.8|Tire manufacturing (except retreading)
32622|2.8|1.8|0.8|1.0|0.9|Rubber and plastics hoses and belting manufacturing
32629|2.2|1.5|0.9|0.6|0.7|Other rubber product manufacturing
326291|1.9|1.4|0.7|0.7|0.6|Rubber product manufacturing for mechanical use
326299|2.5|1.6|1.0|0.6|0.9|All other rubber product manufacturing
327|3.0|1.9|0.9|1.0|1.1|Nonmetallic mineral product manufacturing
3272|2.9|1.7|0.9|0.9|1.2|Glass and glass product manufacturing
32721|2.9|1.7|0.9|0.9|1.2|Glass and glass product manufacturing
327211|2.9|1.5|0.8|0.7|1.4|Flat glass manufacturing
327212|2.0|1.2|0.8|0.4|0.8|Other pressed and blown glass and glassware manufacturing
327213|4.1|2.4|1.7|0.8|1.7|Glass container manufacturing
327215|2.8|1.7|0.7|1.0|1.1|Glass product manufacturing made of purchased glass
3273|3.4|2.2|1.1|1.1|1.2|Cement and concrete product manufacturing
32732|2.9|1.9|1.0|0.9|0.9|Ready-mix concrete manufacturing
327331|2.9|1.9|1.3|0.5|1.0|Concrete block and brick manufacturing
32739|5.5|3.5|1.5|2.0|2.0|Other concrete product manufacturing
32742|1.8|1.2|0.5|0.7|0.6|Gypsum product manufacturing
3279|2.1|1.3|0.6|0.8|0.7|Other nonmetallic mineral product manufacturing
32791|2.8|1.6|0.8|0.8|1.2|Abrasive product manufacturing
32799|2.0|1.3|0.6|0.8|0.7|All other nonmetallic mineral product manufacturing
327991|2.0|1.1|0.5|0.6|0.9|Cut stone and stone product manufacturing
327992|2.2|1.5|0.7|0.8|0.7|Ground or treated mineral and earth manufacturing
327993|2.4|1.9|0.9|1.1|0.5|Mineral wool manufacturing
327999|1.2|0.9|0.2|0.7|0.4|All other miscellaneous nonmetallic mineral product manufacturing
331|3.2|2.0|1.0|1.0|1.2|Primary metal manufacturing
3311|1.6|0.9|0.4|0.5|0.7|Iron and steel mills and ferroalloy manufacturing
3312|4.1|2.7|1.4|1.4|1.4|Steel product manufacturing from purchased steel
33121|4.1|2.7|1.4|1.3|1.4|Iron and steel pipe and tube manufacturing from purchased steel
33122|4.1|2.8|1.4|1.4|1.4|Rolling and drawing of purchased steel
331221|4.3|2.8|1.5|1.4|1.5|Rolled steel shape manufacturing
331222|3.6|2.6|1.1|1.5|1.1|Steel wire drawing
3313|3.2|1.9|0.9|1.1|1.3|Alumina and aluminum production and processing
33131|3.2|1.9|0.9|1.1|1.3|Alumina and aluminum production and processing
331313|3.0|1.6|0.6|1.0|1.4|Alumina refining and primary aluminum production
331314|5.7|4.0|2.8|1.2|1.7|Secondary smelting and alloying of aluminum
331315|1.4|0.6|0.2|0.4|0.8|Aluminum sheet, plate, and foil manufacturing
331318|4.1|2.5|1.0|1.5|1.6|Other aluminum rolling, drawing, and extruding
3314|2.6|2.0|1.0|0.9|0.7|Nonferrous metal (except aluminum) production and processing
33141|1.7|1.2|0.8|0.4|0.5|Nonferrous metal (except aluminum) smelting and refining
33142|2.5|1.9|1.0|0.9|0.6|Copper rolling, drawing, extruding, and alloying
33149|3.1|2.3|1.2|1.1|0.8|Nonferrous metal (except copper and aluminum) rolling, drawing, extruding, and alloying
331491|3.1|2.2|1.2|1.0|0.8|Nonferrous metal (except copper and aluminum) rolling, drawing, and extruding
331492|3.2|2.5|1.3|1.2|0.7|Secondary smelting, refining, and alloying of nonferrous metal (except copper and aluminum)
3315|4.4|2.6|1.4|1.2|1.8|Foundries
33151|4.0|2.5|1.2|1.3|1.5|Ferrous metal foundries
331511|4.4|2.6|1.1|1.5|1.8|Iron foundries
331512|3.3|2.2|1.2|1.0|1.1|Steel investment foundries
33152|4.9|2.7|1.6|1.2|2.2|Nonferrous metal foundries
331523|3.0|1.8|0.8|1.0|1.2|Nonferrous metal die-casting foundries
331524|6.3|3.9|1.9|2.0|2.4|Aluminum foundries (except die-casting)
331529|6.4|2.9|2.3||3.5|Other nonferrous metal foundries (except die-casting)
332|3.0|1.6|0.9|0.7|1.4|Fabricated metal product manufacturing
3321|3.8|1.9|1.1|0.7|2.0|Forging and stamping
33211|3.8|1.9|1.1|0.7|2.0|Forging and stamping
332111|4.2|2.3|1.3|1.0|1.9|Iron and steel forging
332112|3.4|2.5|1.4|1.1|0.9|Nonferrous forging
332114|1.6|1.3|0.4|0.9|0.3|Custom roll forming
332117|4.4|3.0|2.5|0.5|1.5|Powder metallurgy part manufacturing
332119|4.0|1.4|0.9|0.6|2.6|Metal crown, closure, and other metal stamping (except automotive)
3322|2.6|1.3|0.5|0.8|1.3|Cutlery and handtool manufacturing
33221|2.6|1.3|0.5|0.8|1.3|Cutlery and handtool manufacturing
332215|2.1|1.1|0.6|0.5|1.1|Metal kitchen cookware, utensil, cutlery, and flatware (except precious) manufacturing
332216|2.7|1.4|0.5|0.9|1.3|Saw blade and handtool manufacturing
3323|3.4|1.9|1.0|0.8|1.6|Architectural and structural metals manufacturing
33231|3.0|1.7|1.0|0.7|1.3|Plate work and fabricated structural product manufacturing
332311|2.2|1.3|0.8|0.5|0.9|Prefabricated metal building and component manufacturing
332312|3.1|1.8|1.0|0.7|1.3|Fabricated structural metal manufacturing
332313|3.5|1.9|1.0|0.9|1.6|Plate work manufacturing
33232|3.8|2.0|1.1|0.9|1.8|Ornamental and architectural metal products manufacturing
332321|3.7|2.4|1.1|1.4|1.3|Metal window and door manufacturing
332322|3.6|1.8|0.9|0.9|1.8|Sheet metal work manufacturing
332323|4.6|1.9|1.6|0.3|2.7|Ornamental and architectural metal work manufacturing
3324|2.9|1.8|1.1|0.8|1.1|Boiler, tank, and shipping container manufacturing
33241|2.3|1.3|0.8|0.5|1.1|Power boiler and heat exchanger manufacturing
33242|3.7|2.5|1.3|1.2|1.3|Metal tank (heavy gauge) manufacturing
33243|2.5|1.6|1.0|0.6|1.0|Metal can, box, and other metal container (light gauge) manufacturing
332431|1.9|1.1|0.7|0.4|0.8|Metal can manufacturing
332439|3.4|2.3|1.4|0.8|1.1|Other metal container manufacturing
3325|2.0|1.3|0.5|0.8|0.6|Hardware manufacturing
3326|2.7|1.6|1.1|0.5|1.2|Spring and wire product manufacturing
33261|2.7|1.6|1.1|0.5|1.2|Spring and wire product manufacturing
332613|3.9|1.9|1.4|0.5|2.0|Spring manufacturing
332618|2.0|1.4|0.9|0.5|0.6|Other fabricated wire product manufacturing
3327|2.8|1.5|1.1|0.4|1.3|Machine shops; turned product; and screw, nut, and bolt manufacturing
33271|2.9|1.6|1.2|0.4|1.3|Machine shops
33272|2.6|1.4|0.8|0.5|1.3|Turned product and screw, nut, and bolt manufacturing
332721|3.2|1.5|0.9|0.5|1.7|Precision turned product manufacturing
332722|2.1|1.3|0.7|0.6|0.8|Bolt, nut, screw, rivet, and washer manufacturing
3328|3.7|2.0|0.9|1.1|1.7|Coating, engraving, heat treating, and allied activities
33281|3.7|2.0|0.9|1.1|1.7|Coating, engraving, heat treating, and allied activities
332811|1.6|1.2|0.6|0.6|0.3|Metal heat treating
332812|3.4|1.9|0.8|1.1|1.5|Metal coating, engraving (except jewelry and silverware), and allied services to manufacturers
332813|4.7|2.3|1.2|1.1|2.4|Electroplating, plating, polishing, anodizing, and coloring
3329|2.1|1.2|0.5|0.7|1.0|Other fabricated metal product manufacturing
33291|1.5|1.0|0.4|0.6|0.5|Metal valve manufacturing
332911|1.1|0.7|0.3|0.4|0.4|Industrial valve manufacturing
332912|1.8|1.1|0.4|0.7|0.6|Fluid power valve and hose fitting manufacturing
332913|1.6|0.9|0.4|0.5|0.7|Plumbing fixture fitting and trim manufacturing
332919|1.6|1.1|0.6|0.5|0.5|Other metal valve and pipe fitting manufacturing
33299|2.4|1.3|0.5|0.7|1.2|All other fabricated metal product manufacturing
332991|1.8|1.2|0.4|0.8|0.6|Ball and roller bearing manufacturing
332992|1.1|0.8|0.4|0.4||Small arms ammunition manufacturing
332994|1.6|0.9|0.5|0.4|0.7|Small arms, ordnance, and ordnance accessories manufacturing
332996|2.3|1.4|0.6|0.8|1.0|Fabricated pipe and pipe fitting manufacturing
332999|3.3|1.6|0.7|0.9|1.7|All other miscellaneous fabricated metal product manufacturing
333|2.2|1.2|0.6|0.6|1.0|Machinery manufacturing
3331|2.7|1.6|0.9|0.7|1.1|Agriculture, construction, and mining machinery manufacturing
33311|3.3|2.1|1.2|0.9|1.3|Agricultural implement manufacturing
333111|3.4|2.1|1.2|0.9|1.3|Farm machinery and equipment manufacturing
333112|2.9|1.9|1.2|0.7|1.1|Lawn and garden tractor and home lawn and garden equipment manufacturing
33312|3.0|1.9|1.1|0.8|1.1|Construction machinery manufacturing
33313|1.5|0.7|0.4|0.3|0.8|Mining and oil and gas field machinery manufacturing
333132|1.2|0.6|0.3|0.3|0.6|Oil and gas field machinery and equipment manufacturing
3332|1.8|0.9|0.6|0.4|0.9|Industrial machinery manufacturing
33324|1.8|0.9|0.6|0.4|0.9|Industrial machinery manufacturing
333241|2.8|1.1|0.5|0.6|1.6|Food product machinery manufacturing
333242|0.4|0.3|0.1|0.1|0.1|Semiconductor machinery manufacturing
333243|1.9|0.8|0.5|0.4|1.0|Sawmill, woodworking, and paper machinery manufacturing
333248|2.2|1.2|0.8|0.4|1.0|All other industrial machinery manufacturing
3333|1.9|1.1|0.6|0.5|0.8|Commercial and service industry machinery manufacturing
3334|2.1|1.3|0.5|0.9|0.8|Ventilation, heating, air-conditioning, and commercial refrigeration equipment manufacturing
33341|2.1|1.3|0.5|0.9|0.8|Ventilation, heating, air-conditioning, and commercial refrigeration equipment manufacturing
333413|2.7|1.8|0.6|1.2|0.9|Industrial and commercial fan and blower and air purification equipment manufacturing
333414|2.6|1.1|0.5|0.6|1.5|Heating equipment (except warm air furnaces) manufacturing
333415|1.9|1.2|0.4|0.8|0.6|Air-conditioning and warm air heating equipment and commercial and industrial refrigeration equipment manufacturing
3335|2.6|1.3|0.6|0.6|1.3|Metalworking machinery manufacturing
33351|2.6|1.3|0.6|0.6|1.3|Metalworking machinery manufacturing
333511|3.0|2.3|1.2|1.1|0.8|Industrial mold manufacturing
333514|2.2|1.0|0.4|0.6|1.2|Special die and tool, die set, jig, and fixture manufacturing
333515|1.0|0.7|0.5|0.2|0.3|Cutting tool and machine tool accessory manufacturing
333517|3.6|1.2|0.6|0.6|2.4|Machine tool manufacturing
333519|2.3|1.0|0.7|0.3|1.3|Rolling mill and other metalworking machinery manufacturing
3336|2.1|1.1|0.6|0.5|1.0|Engine, turbine, and power transmission equipment manufacturing
33361|2.1|1.1|0.6|0.5|1.0|Engine, turbine, and power transmission equipment manufacturing
333611|2.4|1.3|0.7|0.6|1.2|Turbine and turbine generator set units manufacturing
333612|2.1|1.2|0.8|0.3|0.9|Speed changer, industrial high-speed drive, and gear manufacturing
333613|2.6|1.3|0.4|0.9|1.3|Mechanical power transmission equipment manufacturing
333618|1.8|1.0|0.5|0.5|0.8|Other engine equipment manufacturing
3339|1.9|1.0|0.6|0.5|0.8|Other general purpose machinery manufacturing
333914|1.4|0.8|0.4|0.4|0.6|Measuring, dispensing, and other pumping equipment manufacturing
33392|2.6|1.4|0.6|0.7|1.2|Material handling equipment manufacturing
333921|1.3|0.7|0.4|0.3|0.6|Elevator and moving stairway manufacturing
333922|2.9|1.5|0.7|0.8|1.4|Conveyor and conveying equipment manufacturing
333923|1.8|0.7|0.4|0.3|1.1|Overhead traveling crane, hoist, and monorail system manufacturing
33399|1.8|1.0|0.6|0.3|0.8|All other general purpose machinery manufacturing
333991|1.1|0.7|0.6||0.4|Power-driven handtool manufacturing
333993|1.9|1.0|0.5|0.5|1.0|Packaging machinery manufacturing
333995|1.9|1.0|0.5|0.5|0.9|Fluid power cylinder and actuator manufacturing
333996|1.1|0.6|0.3|0.2|0.5|Fluid power pump and motor manufacturing
333998|1.6|0.9|0.5|0.4|0.7|All other miscellaneous general purpose machinery manufacturing
334|0.8|0.5|0.2|0.2|0.3|Computer and electronic product manufacturing
3341|0.6|0.3|0.2|0.1|0.2|Computer and peripheral equipment manufacturing
33411|0.6|0.3|0.2|0.1|0.2|Computer and peripheral equipment manufacturing
334112|0.6|0.5|0.4|||Computer storage device manufacturing
334118|0.3|0.2|0.1|0.1||Computer terminal and other computer peripheral equipment manufacturing
3342|0.8|0.5|0.1|0.4|0.3|Communications equipment manufacturing
33422|0.8|0.5|0.1|0.4|0.3|Radio and television broadcasting and wireless communications equipment manufacturing
33429|1.4|0.8|0.2|0.5|0.6|Other communications equipment manufacturing
3344|0.8|0.5|0.3|0.2|0.4|Semiconductor and other electronic component manufacturing
33441|0.8|0.5|0.3|0.2|0.4|Semiconductor and other electronic component manufacturing
334412|1.6|1.2|0.6|0.7|0.4|Bare printed circuit board manufacturing
334413|0.7|0.3|0.2|0.1|0.3|Semiconductor and related device manufacturing
334416|0.8|0.4|0.3|0.1|0.3|Capacitor, resistor, coil, transformer, and other inductor manufacturing
334417|0.9|0.4|0.2|0.2|0.5|Electronic connector manufacturing
334418|0.7|0.4|0.2|0.1|0.4|Printed circuit assembly (electronic assembly) manufacturing
334419|1.2|0.8|0.4|0.4|0.4|Other electronic component manufacturing
3345|0.7|0.5|0.3|0.2|0.2|Navigational, measuring, electromedical, and control instruments manufacturing
33451|0.7|0.5|0.3|0.2|0.2|Navigational, measuring, electromedical, and control instruments manufacturing
334510|0.6|0.4|0.2|0.2|0.2|Electromedical and electrotherapeutic apparatus manufacturing
334511|0.5|0.3|0.2|0.1|0.2|Search, detection, navigation, guidance, aeronautical, and nautical system and instrument manufacturing
334512|2.1|1.1|0.2|0.9|1.0|Automatic environmental control manufacturing for residential, commercial, and appliance use
334513|0.7|0.4|0.3|0.1|0.3|Instruments and related products manufacturing for measuring, displaying, and controlling industrial process variables
334515|0.4|0.3|0.2|0.2|0.1|Instrument manufacturing for measuring and testing electricity and electrical signals
334516|1.2|0.9|0.5|0.4|0.3|Analytical laboratory instrument manufacturing
334517|1.3|1.1|0.8|0.3|0.2|Irradiation apparatus manufacturing
334519|0.5|0.3|0.2|0.2|0.2|Other measuring and controlling device manufacturing
335|1.8|1.2|0.6|0.6|0.6|Electrical equipment, appliance, and component manufacturing
3351|1.6|0.9|0.3|0.6|0.7|Electric lighting equipment manufacturing
33513|1.6|0.9|0.3|0.6|0.7|Electric lighting equipment manufacturing
335132|1.3|0.9|0.5|0.5|0.3|Commercial, industrial, and institutional electric lighting fixture manufacturing
335139|1.7|0.9||0.7|0.8|Electric lamp bulb and other lighting equipment manufacturing
3352|1.8|1.0|0.5|0.5|0.8|Household appliance manufacturing
33521|0.8|0.5|0.3|0.2|0.2|Small electrical appliance manufacturing
33522|2.0|1.1|0.5|0.6|0.9|Major household appliance manufacturing
3353|1.8|1.2|0.6|0.6|0.5|Electrical equipment manufacturing
33531|1.8|1.2|0.6|0.6|0.5|Electrical equipment manufacturing
335311|3.1|2.4|1.3|1.1|0.7|Power, distribution, and specialty transformer manufacturing
335312|1.5|0.8|0.4|0.4|0.7|Motor and generator manufacturing
335313|1.8|1.2|0.5|0.8|0.6|Switchgear and switchboard apparatus manufacturing
335314|0.7|0.5|0.3|0.2|0.1|Relay and industrial control manufacturing
3359|1.8|1.2|0.6|0.6|0.7|Other electrical equipment and component manufacturing
33591|2.2|1.5|0.9|0.6|0.7|Battery manufacturing
33592|1.5|1.1|0.5|0.7|0.4|Communication and energy wire and cable manufacturing
335921|1.3|0.7|0.5|0.2|0.5|Fiber optic cable manufacturing
335929|1.7|1.5|0.4|1.1|0.3|Other communication and energy wire manufacturing
33593|1.8|1.0|0.5|0.5|0.8|Wiring device manufacturing
335931|1.9|0.9|0.4|0.5|1.0|Current-carrying wiring device manufacturing
335932|1.6|1.2|0.5|0.7|0.4|Noncurrent-carrying wiring device manufacturing
33599|1.6|1.0|0.4|0.6|0.6|All other electrical equipment and component manufacturing
335991|2.4|1.0|0.3|0.7|1.4|Carbon and graphite product manufacturing
335999|1.4|1.0|0.5|0.5|0.4|All other miscellaneous electrical equipment and component manufacturing
336|2.9|1.9|0.9|1.0|1.0|Transportation equipment manufacturing
3361|5.2|3.8|1.4|2.4|1.4|Motor vehicle manufacturing
33611|5.4|4.0|1.4|2.6|1.4|Automobile and light duty motor vehicle manufacturing
33612|3.7|2.3|1.1|1.1|1.4|Heavy duty truck manufacturing
3362|4.3|2.3|1.2|1.1|2.0|Motor vehicle body and trailer manufacturing
33621|4.3|2.3|1.2|1.1|2.0|Motor vehicle body and trailer manufacturing
336211|3.4|2.2|1.1|1.1|1.3|Motor vehicle body manufacturing
336212|5.2|2.6|1.4|1.1|2.6|Truck trailer manufacturing
336213|2.6|1.4|0.7|0.7|1.2|Motor home manufacturing
336214|4.7|2.3|1.1|1.3|2.4|Travel trailer and camper manufacturing
3363|2.6|1.6|0.7|0.9|1.0|Motor vehicle parts manufacturing
33631|2.6|1.6|0.6|1.0|0.9|Motor vehicle gasoline engine and engine parts manufacturing
33632|1.1|0.9|0.4|0.5|0.2|Motor vehicle electrical and electronic equipment manufacturing
33633|2.2|1.3|0.7|0.6|0.9|Motor vehicle steering and suspension components (except spring) manufacturing
33634|1.5|1.0|0.4|0.6|0.5|Motor vehicle brake system manufacturing
33635|2.1|1.3|0.6|0.7|0.8|Motor vehicle transmission and power train parts manufacturing
33636|2.8|2.0|0.7|1.3|0.8|Motor vehicle seating and interior trim manufacturing
33637|3.9|2.2|1.0|1.2|1.7|Motor vehicle metal stamping
33639|2.8|1.7|0.8|0.9|1.1|Other motor vehicle parts manufacturing
3364|1.4|0.9|0.4|0.5|0.5|Aerospace product and parts manufacturing
33641|1.4|0.9|0.4|0.5|0.5|Aerospace product and parts manufacturing
336411|1.8|1.3|0.5|0.8|0.6|Aircraft manufacturing
336412|0.9|0.6|0.3|0.3|0.4|Aircraft engine and engine parts manufacturing
336413|1.6|1.0|0.6|0.5|0.6|Other aircraft parts and auxiliary equipment manufacturing
336414|0.6|0.3|0.1|0.2|0.3|Guided missile and space vehicle manufacturing
336415|1.0|0.7|0.5|0.3|0.3|Guided missile and space vehicle propulsion unit and propulsion unit parts manufacturing
336419|2.0|1.4|0.7|0.7|0.6|Other guided missile and space vehicle parts and auxiliary equipment manufacturing
3365|1.3|0.9|0.5|0.4|0.4|Railroad rolling stock manufacturing
3366|4.4|2.9|1.8|1.2|1.5|Ship and boat building
33661|4.4|2.9|1.8|1.2|1.5|Ship and boat building
336611|4.9|3.3|2.1|1.2|1.6|Ship building and repairing
336612|3.1|1.8|0.8|1.0|1.3|Boat building
3369|1.9|1.2|0.7|0.5|0.7|Other transportation equipment manufacturing
33699|1.9|1.2|0.7|0.5|0.7|Other transportation equipment manufacturing
336991|0.9|0.5|0.2|0.3||Motorcycle, bicycle, and parts manufacturing
336992|3.0|1.9|1.3|0.6|1.1|Military armored vehicle, tank, and tank component manufacturing
336999|1.9|1.2|0.6|0.6|0.7|All other transportation equipment manufacturing
337|2.8|1.7|0.8|0.9|1.1|Furniture and related product manufacturing
3371|2.9|1.7|0.8|0.9|1.2|Household and institutional furniture and kitchen cabinet manufacturing
33711|2.7|1.6|0.8|0.7|1.1|Wood kitchen cabinet and countertop manufacturing
33712|3.0|1.8|0.7|1.1|1.2|Household and institutional furniture manufacturing
337121|3.2|2.0|0.6|1.3|1.2|Upholstered household furniture manufacturing
337126|3.5|2.0|1.2|0.9|1.5|Household furniture (except wood and upholstered) manufacturing
337127|3.3|2.5|0.7|1.8|0.8|Institutional furniture manufacturing
3372|2.5|1.5|0.7|0.8|1.0|Office furniture (including fixtures) manufacturing
33721|2.5|1.5|0.7|0.8|1.0|Office furniture (including fixtures) manufacturing
337211|3.8|2.6|1.1|1.5|1.2|Wood office furniture manufacturing
337212|1.5|0.7|0.5|0.2|0.8|Custom architectural woodwork and millwork manufacturing
337214|2.9|1.8|0.5|1.4|1.1|Office furniture (except wood) manufacturing
337215|2.5|1.5|0.9|0.6|1.0|Showcase, partition, shelving, and locker manufacturing
3379|3.5|2.2|1.0|1.2|1.4|Other furniture related product manufacturing
33791|3.2|2.1|1.3|0.8|1.1|Mattress manufacturing
339|1.9|1.1|0.6|0.5|0.8|Miscellaneous manufacturing
3391|1.4|0.8|0.4|0.4|0.7|Medical equipment and supplies manufacturing
33911|1.4|0.8|0.4|0.4|0.7|Medical equipment and supplies manufacturing
339112|1.3|0.9|0.3|0.5|0.4|Surgical and medical instrument manufacturing
339113|1.9|0.8|0.5|0.3|1.1|Surgical appliance and supplies manufacturing
339114|1.4|0.9|0.5|0.5|0.5|Dental equipment and supplies manufacturing
339115|1.3|0.6|0.3|0.3|0.7|Ophthalmic goods manufacturing
339116|0.9|0.4|0.2|0.2|0.5|Dental laboratories
3399|2.4|1.5|0.9|0.6|0.9|Other miscellaneous manufacturing
33991|0.4|0.1|0.1||0.3|Jewelry and silverware manufacturing
33992|2.9|1.9|0.7|1.2|1.0|Sporting and athletic goods manufacturing
33993|1.4|0.4|0.3||1.1|Doll, toy, and game manufacturing
33995|2.6|1.7|1.3|0.5|0.9|Sign manufacturing
33999|2.6|1.6|0.9|0.7|1.0|All other miscellaneous manufacturing
339991|1.1|0.7|0.4|0.4|0.4|Gasket, packing, and sealing device manufacturing
339992|2.4|1.9|1.0|0.8|0.6|Musical instrument manufacturing
339995|3.9|2.1|1.5||1.8|Burial casket manufacturing
339999|2.9|1.7|1.1|0.6|1.2|All other miscellaneous manufacturing
42|2.2|1.5|0.9|0.7|0.6|Wholesale trade
423|1.9|1.3|0.7|0.6|0.7|Merchant wholesalers, durable goods
4231|3.2|2.2|1.2|1.0|1.0|Motor vehicle and motor vehicle parts and supplies merchant wholesalers
4232|1.0|0.6|0.3|0.3|0.4|Furniture and home furnishing merchant wholesalers
4233|3.3|2.3|1.5|0.8|1.0|Lumber and other construction materials merchant wholesalers
4234|0.7|0.5|0.3|0.2|0.2|Professional and commercial equipment and supplies merchant wholesalers
4235|4.0|2.7|1.3|1.5|1.3|Metal and mineral (except petroleum) merchant wholesalers
4236|0.9|0.6|0.3|0.3|0.3|Household appliances and electrical and electronic goods merchant wholesalers
4237|2.6|1.5|0.9|0.5|1.2|Hardware, and plumbing and heating equipment and supplies merchant wholesalers
4238|1.9|1.2|0.6|0.6|0.7|Machinery, equipment, and supplies merchant wholesalers
4239|2.2|1.7|1.1|0.6|0.5|Miscellaneous durable goods merchant wholesalers
42391|1.1|0.9|0.5|0.3|0.2|Sporting and recreational goods and supplies merchant wholesalers
42393|4.6|3.5|2.1|1.3|1.1|Recyclable material merchant wholesalers
42394|0.7|0.6|0.5|||Jewelry, watch, precious stone, and precious metal merchant wholesalers
42399|1.2|0.9|0.5|0.4|0.2|Other miscellaneous durable goods merchant wholesalers
424|2.9|2.2|1.2|1.0|0.7|Merchant wholesalers, nondurable goods
4242|0.9|0.6|0.3|0.2|0.3|Drugs and druggists' sundries merchant wholesalers
4243|0.9|0.6|0.3|0.2|0.3|Apparel, piece goods, and notions merchant wholesalers
4244|4.0|3.3|1.8|1.5|0.7|Grocery and related product merchant wholesalers
4245|2.6|1.1|0.7|0.4|1.5|Farm product raw material merchant wholesalers
4246|2.1|1.5|0.3|1.1|0.6|Chemical and allied products merchant wholesalers
4247|1.8|1.2|0.8|0.3|0.6|Petroleum and petroleum products merchant wholesalers
4248|4.9|3.6|1.9|1.7|1.3|Beer, wine, and distilled alcoholic beverage merchant wholesalers
4249|1.7|1.2|0.8|0.4|0.5|Miscellaneous nondurable goods merchant wholesalers
425|0.5|0.4|0.3|0.1|0.1|Wholesale trade agents and brokers
44-45|2.8|1.7|0.9|0.8|1.1|Retail trade
441|2.5|1.5|0.9|0.6|1.0|Motor vehicle and parts dealers
4411|2.3|1.2|0.8|0.4|1.0|Automobile dealers
44111|2.4|1.3|0.9|0.4|1.1|New car dealers
44112|1.7|1.0|0.6|0.3|0.8|Used car dealers
4412|2.6|1.5|1.0|0.5|1.0|Other motor vehicle dealers
44121|3.5|2.2|1.4|0.8|1.3|Recreational vehicle dealers
44122|2.1|1.2|0.9|0.4|0.9|Motorcycle, boat, and other motor vehicle dealers
4413|3.0|2.3|1.1|1.2|0.7|Automotive parts, accessories, and tire retailers
44133|2.6|2.0|1.0|1.0|0.6|Automotive parts and accessories retailers
44134|3.8|2.8|1.4|1.5|0.9|Tire dealers
444|3.3|2.2|1.3|0.9|1.1|Building material and garden equipment and supplies dealers
4441|3.1|2.2|1.3|1.0|0.9|Building material and supplies dealers
44411|3.3|2.3|1.2|1.1|1.0|Home centers
44412|2.4|2.3|0.9|||Paint and wallpaper retailers
44414|3.0|1.8|1.3|0.4|1.2|Hardware retailers
44418|3.0|2.4|1.5|1.0|0.6|Other building material dealers
4442|4.6|1.8|1.2|0.6|2.8|Lawn and garden equipment and supplies retailers
44423|2.8|2.0|1.4|0.6|0.8|Outdoor power equipment retailers
44424|5.0|1.8|1.2|0.6|3.2|Nursery, garden center, and farm supply retailers
445|3.4|2.3|1.2|1.1|1.1|Food and beverage retailers
4451|3.8|2.6|1.3|1.2|1.2|Grocery and convenience retailers
44511|4.0|2.7|1.4|1.3|1.3|Supermarkets and other grocery retailers (except convenience retailers)
44513|1.4|0.8|0.7|0.2|0.6|Convenience retailers and vending machine operators
4452|1.1|0.8|0.5|0.3|0.3|Specialty food retailers
44524|1.6|1.2|0.9|0.3||Meat retailers
44529|0.8|0.5|0.3|0.3|0.3|Other specialty food retailers
4453|0.5|0.4|0.3|0.1|0.2|Beer, wine, and liquor retailers
449|1.9|1.1|0.6|0.5|0.8|Furniture, home furnishings, electronics, and appliance retailers
4491|2.7|1.6|0.8|0.8|1.1|Furniture and home furnishings retailers
44911|2.4|1.7|0.9|0.8|0.7|Furniture retailers
44912|3.0|1.5|0.8|0.8|1.5|Home furnishings retailers
4492|1.1|0.6|0.4|0.2|0.5|Electronics and appliance retailers
455|3.8|2.2|1.1|1.1|1.7|General merchandise retailers
4551|3.2|1.9|1.0|0.8|1.3|Department stores
4552|4.0|2.3|1.1|1.2|1.8|Warehouse clubs, supercenters, and other general merchandise retailers
45521|4.0|2.3|1.1|1.2|1.8|Warehouse clubs, supercenters, and other general merchandise retailers
455211|4.6|2.5|1.2|1.3|2.1|Warehouse clubs and supercenters
455219|2.1|1.4|0.8|0.6|0.7|All other general merchandise retailers
456|1.5|0.8|0.5|0.3|0.7|Health and personal care retailers
4561|1.5|0.8|0.5|0.3|0.7|Health and personal care retailers
45611|1.7|0.9|0.5|0.4|0.8|Pharmacies and drug retailers
45612|1.3|1.1|0.6|0.4|0.2|Cosmetics, beauty supplies, and perfume retailers
45619|1.1|0.6|0.3|0.3|0.4|Other heath and personal care retailers
457|2.3|1.4|0.9|0.4|0.9|Gasoline stations and fuel dealers
4571|2.2|1.3|0.9|0.5|0.9|Gasoline stations
45711|2.1|1.2|0.8|0.4|0.9|Gasoline stations with convenience stores
45712|3.0|2.3|1.6|0.7|0.7|Other gasoline stations
4572|3.4|2.0|1.7|0.3|1.4|Fuel dealers
458|1.4|0.6|0.5|0.2|0.7|Clothing, clothing accessories, shoe, and jewelry retailers
4581|1.6|0.7|0.5|0.2|0.9|Clothing and clothing accessories retailers
4582|1.4|1.0|0.8|0.2|0.5|Shoe retailers
459|2.0|1.2|0.6|0.6|0.8|Sporting goods, hobby, musical instrument, book, and miscellaneous retailers
4591|1.9|1.2|0.6|0.6|0.8|Sporting goods, hobby, and musical instrument retailers
45911|1.4|0.9|0.5|0.4|0.6|Sporting goods retailers
45912|3.6|2.1|1.0|1.1|1.4|Hobby, toy, and game retailers
45914|0.3|0.3||0.1|0.1|Musical instrument and supplies retailers
4592|2.7|0.7|0.7|0.0|1.9|Book retailers and news dealers
4593|1.3|0.9||0.2||Florists
4594|1.7|0.7|0.3|0.4|1.0|Office supplies, stationery, and gift retailers
4595|3.3|2.5|1.0|1.5|0.8|Used merchandise retailers
4599|1.8|0.9|0.5|0.5|0.8|Other miscellaneous retailers
45999|0.9|0.5|0.3|0.2|0.4|All other miscellaneous store retailers
459999|1.0|0.7|0.4|0.3|0.3|All other miscellaneous retailers
48-49|4.4|3.6|2.0|1.6|0.8|Transportation and warehousing
481|6.6|5.6|3.8|1.8|1.0|Air transportation
4811|7.3|6.3|4.3|2.0|1.0|Scheduled air transportation
48111|7.3|6.3|4.3|2.0|1.0|Scheduled air transportation
481111|7.4|6.3|4.3|2.0|1.1|Scheduled passenger air transportation
4812|1.4|0.6|0.4|0.2|0.8|Nonscheduled air transportation
482|2.0|1.4|1.3|0.1|0.6|Rail transportation
483|1.1|0.8|0.6|0.1|0.3|Water transportation
483113|1.7|0.8|0.8||0.9|Coastal and great lakes freight transportation
4832|1.3|1.1|0.9|0.3|0.2|Inland water transportation
48321|1.3|1.1|0.9|0.3|0.2|Inland water transportation
483211|1.3|1.2|0.9|0.3|0.1|Inland water freight transportation
484|2.9|2.3|1.6|0.7|0.6|Truck transportation
4841|3.1|2.4|1.7|0.7|0.7|General freight trucking
48411|3.3|2.5|1.6|0.9|0.8|General freight trucking, local
48412|3.1|2.4|1.8|0.6|0.7|General freight trucking, long-distance
4842|2.4|1.9|1.4|0.6|0.5|Specialized freight trucking
48421|4.3|3.8|1.6|2.2|0.6|Used household and office goods moving
48422|2.0|1.6|1.3|0.3|0.4|Specialized freight (except used goods) trucking, local
48423|2.1|1.5|1.3|0.2|0.6|Specialized freight (except used goods) trucking, long-distance
485|3.3|2.3|1.8|0.5|0.9|Transit and ground passenger transportation
4851|5.3|3.7|2.6|1.1|1.6|Urban transit systems
4854|3.0|2.0|1.6|0.4|1.0|School and employee bus transportation
4859|2.9|2.1|1.3|0.7|0.9|Other transit and ground passenger transportation
487|2.3|1.1|0.9|0.2|1.2|Scenic and sightseeing transportation
488|2.5|1.8|1.1|0.7|0.7|Support activities for transportation
4881|3.7|2.7|1.5|1.1|1.1|Support activities for air transportation
4882|1.7|0.5|0.4||1.2|Support activities for rail transportation
4883|2.6|1.6|1.1|0.5|1.0|Support activities for water transportation
48832|3.2|1.9|1.2|0.7|1.3|Marine cargo handling
48833|1.5|1.0|0.9|0.1|0.6|Navigational services to shipping
48839|2.2|1.7|1.7||0.5|Other support activities for water transportation
4884|4.0|3.4|2.1|1.2|0.7|Support activities for road transportation
48841|3.5|3.0|1.8|1.2||Motor vehicle towing
48849|5.2|4.1|2.8|1.4|1.0|Other support activities for road transportation
4885|0.8|0.6|0.4|0.2|0.1|Freight transportation arrangement
492|8.5|7.2|3.8|3.3|1.3|Couriers and messengers
4921|8.9|7.6|3.9|3.7|1.3|Couriers and express delivery services
4922|6.4|5.1|3.6|1.5|1.3|Local messengers and local delivery
493|4.5|3.9|1.4|2.5|0.6|Warehousing and storage
4931|4.5|3.9|1.4|2.5|0.6|Warehousing and storage
49311|4.6|3.9|1.4|2.6|0.7|General warehousing and storage
49312|4.8|4.1|1.5|2.6|0.6|Refrigerated warehousing and storage
49319|2.8|2.3|1.4|0.9|0.5|Other warehousing and storage
22|1.7|1.1|0.7|0.3|0.7|Utilities
221|1.7|1.1|0.7|0.3|0.7|Utilities
2211|1.7|1.0|0.7|0.3|0.7|Electric power generation, transmission and distribution
22111|1.4|0.5|0.3|0.2|0.9|Electric power generation
221111|3.4|0.7|0.4||2.7|Hydroelectric power generation
221112|1.9|0.7|0.4|0.3|1.2|Fossil fuel electric power generation
221113|0.2|0.0|||0.2|Nuclear electric power generation
221114|0.4|0.4|0.3|||Solar electric power generation
22112|1.8|1.2|0.9|0.3|0.6|Electric power transmission, control, and distribution
2212|1.8|1.1|0.5|0.5|0.7|Natural gas distribution
2213|2.3|1.7|1.2|0.4|0.6|Water, sewage and other systems
22131|2.5|1.8|1.3|0.5|0.7|Water supply and irrigation systems
22132|1.2|1.2|1.2|||Sewage treatment facilities
51|0.8|0.5|0.4|0.1|0.3|Information
512|1.4|0.7|0.6|0.1|0.7|Motion picture and sound recording industries
5121|1.5|0.8|0.6|0.1|0.7|Motion picture and video industries
51211|0.9|0.6|0.6|0.1|0.2|Motion picture and video production
51213|3.6|1.3|1.1|0.3|2.3|Motion picture and video exhibition
513|0.2|0.1|0.1|0.0|0.1|Publishing industries
5131|0.4|0.3|0.2|0.1|0.1|Newspaper, periodical, book, and directory publishers
51311|0.7|0.5|0.3|0.1|0.2|Newspaper publishers
51312|0.1|0.1||0.0|0.0|Periodical publishers
51313|0.3|0.1|0.0|0.1|0.1|Book publishers
51319|0.2|0.1|0.0|0.1||Other publishers
5132|0.1|0.0|0.0|0.0|0.0|Software publishers
516|0.5|0.3|0.2|0.1|0.2|Broadcasting and content providers
5161|0.7|0.3|0.2|0.1|0.4|Radio and television broadcasting stations
51612|1.0|0.4|0.3|0.1|0.6|Television broadcasting stations
5162|0.4|0.3|0.2|0.1|0.1|Media streaming distribution services, social networks, and other media networks and content providers
517|2.2|1.6|1.3|0.3|0.6|Telecommunications
5171|2.3|1.7|1.4|0.3|0.6|Wired and wireless telecommunications (except satellite)
5178|1.0|0.5|0.5||0.5|All other telecommunications
518|0.4|0.1|0.1|0.0|0.3|Computing infrastructure providers, data processing, web hosting, and related services
519|0.2|0.1|0.1|0.0|0.1|Web search portals, libraries, archives, and other information services
5192|0.2|0.1|0.1|0.0|0.1|Web search portals, libraries, archives, and other information services
51921|1.0|0.4|0.3||0.7|Libraries and archives
51929|0.1|0.1||||Web search portals and all other information services
52|0.3|0.1|0.1|0.0|0.1|Finance and insurance
521|1.0|0.5|0.5||0.5|Monetary authorities-central bank
522|0.4|0.2|0.1|0.1||Credit intermediation and related activities
5221|0.4|0.2|0.1|0.1|0.2|Depository credit intermediation
52211|0.4|0.2|0.1|0.1|0.2|Commercial banking
52213|0.7|0.3|0.2|0.0|0.4|Credit unions
52221|0.1|0.0|||0.1|Credit card issuing
5223|0.1|0.1|0.1||0.1|Activities related to credit intermediation
52231|0.1|0.0|0.0||0.0|Mortgage and nonmortgage loan brokers
523|0.0|0.0|0.0|0.0|0.0|Securities, commodity contracts, and other financial investments and related activities
5239|0.0|0.0|0.0||0.0|Other financial investment activities
52394|0.0|0.0|0.0||0.0|Portfolio management and investment advice
524|0.3|0.1|0.1|0.0|0.1|Insurance carriers and related activities
5241|0.2|0.1|0.1|0.0|0.1|Insurance carriers
52411|0.2|0.1|0.0|0.0|0.1|Direct life, health, and medical insurance carriers
52412|0.3|0.1|0.1|0.0|0.2|Direct insurance (except life, health, and medical) carriers
5242|0.3|0.2|0.2|0.0|0.1|Agencies, brokerages, and other insurance related activities
52421|0.2|0.1|0.1|0.0|0.1|Insurance agencies and brokerages
52429|0.5|0.2|0.2||0.2|Other insurance related activities
53|2.0|1.3|0.9|0.4|0.7|Real estate and rental and leasing
531|1.7|1.0|0.7|0.3|0.7|Real estate
5311|1.9|1.0|0.8|0.2|0.9|Lessors of real estate
53111|2.1|1.1|0.9|0.2|0.9|Lessors of residential buildings and dwellings
53112|1.8|0.9|0.8||0.9|Lessors of nonresidential buildings (except miniwarehouses)
53113|1.5|0.5|0.4|0.1||Lessors of miniwarehouses and self-storage units
5312|0.5|0.3|0.2|0.0|0.2|Offices of real estate agents and brokers
5313|2.0|1.3|0.9|0.4|0.7|Activities related to real estate
53131|2.3|1.5|1.0|0.5|0.8|Real estate property managers
53139|0.2|0.1|0.1|0.0|0.1|Other activities related to real estate
532|3.0|2.0|1.3|0.7|1.0|Rental and leasing services
5321|3.9|2.9||0.7|1.0|Automotive equipment rental and leasing
53212|4.0|2.1|1.5|0.6|1.9|Truck, utility trailer, and RV (Recreational Vehicle) rental and leasing
532289|5.0|3.6|1.2|2.4|1.4|All other consumer goods rental
5324|1.4|0.6|0.3|0.2|0.8|Commercial and industrial machinery and equipment rental and leasing
53241|0.5|0.3|0.2||0.3|Construction, transportation, mining, and forestry machinery and equipment rental and leasing
54|0.7|0.3|0.2|0.1|0.5|Professional, scientific, and technical services
541|0.7|0.3|0.2|0.1|0.5|Professional, scientific, and technical services
5411|0.2|0.1|0.1||0.1|Legal services
5412|0.2|0.1|0.1||0.1|Accounting, tax preparation, bookkeeping, and payroll services
54121|0.2|0.1|0.1||0.1|Accounting, tax preparation, bookkeeping, and payroll services
541211|0.0|0.0|0.0||0.0|Offices of certified public accountants
5413|0.5|0.2|0.2|0.1|0.2|Architectural, engineering, and related services
54133|0.4|0.2|0.1|0.1|0.2|Engineering services
54137|1.5|0.8|0.7||0.7|Surveying and mapping (except geophysical) services
54138|0.7|0.4|0.2|0.2|0.4|Testing laboratories and services
5415|0.1|0.0|0.0|0.0|0.1|Computer systems design and related services
54151|0.1|0.0|0.0|0.0|0.1|Computer systems design and related services
541511|0.1|0.0|0.0|0.0|0.1|Custom computer programming services
541512|0.1|0.0|0.0|0.0|0.1|Computer systems design services
5416|0.4|0.3|0.2|0.1||Management, scientific, and technical consulting services
54161|0.4|0.3|0.2|0.1|0.1|Management consulting services
54162|0.6|0.3|0.1|0.1|0.3|Environmental consulting services
5417|0.6|0.2|0.1|0.1|0.4|Scientific research and development services
5418|0.7|0.4|0.2|0.1|0.3|Advertising, public relations, and related services
5419|6.0|1.4|0.9|0.5|4.6|Other professional, scientific, and technical services
54194|11.8|2.6|1.7|0.9|9.2|Veterinary services
55|0.5|0.2|0.2|0.1|0.3|Management of companies and enterprises
56|1.7|1.1|0.8|0.3|0.6|Administrative and support and waste management and remediation services
561|1.6|1.0|0.7|0.3|0.6|Administrative and support services
5611|1.0|0.3|0.2|0.1|0.6|Office administrative services
5612|1.9|1.2|0.6|0.6|0.7|Facilities support services
5613|0.5|0.2|0.2|0.1|0.3|Employment services
56131|0.6|0.3|0.1|0.2|0.2|Employment placement agencies and executive search services
56132|0.4|0.2|0.1|0.0|0.2|Temporary help services
56133|1.2|0.6|0.6|0.1|0.6|Professional employer organizations
5614|0.6|0.4|0.3|0.1|0.2|Business support services
56142|0.3|0.2|0.2|0.0|0.1|Telephone call centers
56143|2.6|2.1|1.8|||Business service centers
5615|0.5|0.3|0.3|0.0|0.2|Travel arrangement and reservation services
56159|0.9|0.5|0.4|0.0|0.4|Other travel arrangement and reservation services
5616|1.4|0.9|0.7|0.2|0.5|Investigation and security services
56161|1.5|0.9|0.7|0.3|0.5|Investigation, guard, and armored car services
561612|1.3|0.8|0.6|0.2|0.5|Security guards and patrol services
56162|1.4|0.9|0.7|0.2|0.4|Security systems services
5617|2.3|1.5|1.1|0.4|0.8|Services to buildings and dwellings
56171|2.3|1.4|1.0|0.4|0.9|Exterminating and pest control services
56172|2.1|1.4|0.9|0.5|0.7|Janitorial services
56173|2.4|1.6|1.1|0.5|0.8|Landscaping services
56174|3.6|2.5|2.4||1.1|Carpet and upholstery cleaning services
5619|2.7|1.7|1.2|0.5|0.9|Other support services
562|3.3|2.3|1.4|0.9|1.0|Waste management and remediation services
5621|4.0|2.9|2.1|0.9|1.1|Waste collection
56211|4.0|2.9|2.1|0.9|1.1|Waste collection
562111|4.2|3.2|2.3|0.9|1.0|Solid waste collection
562112|2.7|1.5|0.4|1.1|1.1|Hazardous waste collection
562119|3.0|1.9|1.3|0.6|1.1|Other waste collection
5622|3.2|2.0|0.8|1.2|1.2|Waste treatment and disposal
56221|3.2|2.0|0.8|1.2|1.2|Waste treatment and disposal
562211|2.1|0.9|0.4|0.4|1.3|Hazardous waste treatment and disposal
562212|4.7|3.0|1.1|1.9|1.6|Solid waste landfill
562219|3.0|2.5|1.1|1.4|0.5|Other nonhazardous waste treatment and disposal
5629|2.5|1.7|1.0|0.7|0.8|Remediation and other waste management services
56291|1.8|1.2|0.9|0.3|0.6|Remediation services
56292|5.1|3.4|0.9|2.6|1.6|Materials recovery facilities
56299|2.4|1.7|1.1|0.6|0.7|All other waste management services
61|1.8|0.8|0.5|0.3|1.0|Educational services
611|1.8|0.8|0.5|0.3|1.0|Educational services
6111|2.8|1.3|0.8|0.5|1.5|Elementary and secondary schools
6113|1.3|0.5|0.3|0.2|0.8|Colleges, universities, and professional schools
6114|0.2|0.1|0.0|0.0|0.1|Business schools and computer and management training
61143|0.3|0.1|0.1|0.1|0.1|Professional and management development training
6115|1.3|0.5|0.4|0.1|0.8|Technical and trade schools
6116|1.5|0.6|0.3|0.2|0.9|Other schools and instruction
61162|2.2|0.5|0.3|0.1|1.8|Sports and recreation instruction
61169|1.4|0.8|0.4|0.3|0.6|All other schools and instruction
6117|1.5|0.8|0.7|0.1|0.7|Educational support services
62|3.2|1.4|0.9|0.5|1.8|Health care and social assistance
621|2.0|0.6|0.4|0.2|1.3|Ambulatory health care services
6211|1.7|0.3|0.2|0.1|1.4|Offices of physicians
62111|1.7|0.3|0.2|0.1|1.4|Offices of physicians
621111|1.7|0.3|0.2|0.1|1.4|Offices of physicians (except mental health specialists)
6212|1.6|0.2|0.2|0.1|1.4|Offices of dentists
6213|1.7|0.8|0.5|0.3|0.9|Offices of other health practitioners
6214|2.7|0.8|0.6|0.2|1.9|Outpatient care centers
6215|1.8|0.5|0.3|0.2|1.3|Medical and diagnostic laboratories
6216|1.7|0.9|0.8|0.2|0.8|Home health care services
6219|4.4|2.3|1.4|0.9|2.1|Other ambulatory health care services
62191|5.9|3.7|2.4|1.3|2.3|Ambulance services
62199|3.0|1.0|0.5|0.6|2.0|All other ambulatory health care services
622|4.9|2.0|1.2|0.8|2.9|Hospitals
6221|4.9|1.9|1.2|0.7|3.0|General medical and surgical hospitals
6222|6.5|3.9|2.5|1.4|2.6|Psychiatric and substance abuse hospitals
6223|4.4|2.4|1.4|1.0|2.0|Specialty (except psychiatric and substance abuse) hospitals
623|4.9|3.0|1.7|1.3|1.9|Nursing and residential care facilities
6231|5.0|3.2|1.8|1.5|1.8|Nursing care facilities (skilled nursing facilities)
6232|4.6|2.4|1.5|0.9|2.2|Residential intellectual and developmental disability, mental health, and substance abuse facilities
6233|4.9|3.0|1.6|1.4|1.9|Continuing care retirement communities and assisted living facilities for the elderly
6239|5.6|3.5|2.3|1.2|2.1|Other residential care facilities
624|2.0|1.1|0.8|0.3|1.0|Social assistance
6241|2.0|1.0|0.8|0.2|1.0|Individual and family services
62411|2.0|1.1|0.9|0.3|0.9|Child and youth services
62412|1.9|1.0|0.8|0.2|0.9|Services for the elderly and persons with disabilities
62419|2.1|1.0|0.8|0.2|1.1|Other individual and family services
6242|2.3|1.3|0.9|0.4|1.0|Community food and housing, and emergency and other relief services
62421|2.0|1.0|0.7|0.3|1.1|Community food services
62422|2.6|1.6|1.1|0.4|1.0|Community housing services
6243|3.1|1.8|1.2|0.6|1.3|Vocational rehabilitation services
6244|1.8|0.9|0.6|0.3|0.8|Child care services
71|3.7|1.9|1.0|0.9|1.7|Arts, entertainment, and recreation
711|5.0|2.3|1.2|1.1|2.7|Performing arts, spectator sports, and related industries
7111|5.5|2.2|1.3|0.9|3.3|Performing arts companies
7112|9.9|5.4|2.4|3.0|4.5|Spectator sports
71121|9.9|5.4|2.4|3.0|4.5|Spectator sports
711211|13.9|7.7|3.3|4.4|6.2|Sports teams and clubs
711219|0.9|0.4|0.4|||Other spectator sports
7113|4.0|1.0|0.7|0.3|3.0|Promoters of performing arts, sports, and similar events
7114|0.1|0.1|0.1|||Agents and managers for artists, athletes, entertainers, and other public figures
7115|0.2|0.2|0.2|0.0||Independent artists, writers, and performers
712|3.6|1.8|1.0|0.8|1.8|Museums, historical sites, and similar institutions
713|3.2|1.8|1.0|0.8|1.4|Amusement, gambling, and recreation industries
7131|5.6|4.5|1.6|2.9|1.1|Amusement parks and arcades
71311|6.2|5.1|1.7|3.3|1.2|Amusement and theme parks
7132|2.4|1.2|0.9|0.4|1.2|Gambling industries
7139|3.0|1.5|0.9|0.6|1.6|Other amusement and recreation industries
71391|3.8|2.0|1.2|0.8|1.8|Golf courses and country clubs
71392|9.2|5.7|2.9|2.8|3.5|Skiing facilities
71393|3.7|1.8|0.8|1.0|1.9|Marinas
71394|2.0|0.8|0.5|0.3|1.1|Fitness and recreational sports centers
71395|4.8|1.1|0.9||3.7|Bowling centers
71399|2.0|1.0|0.8|0.3|1.0|All other amusement and recreation industries
72|2.7|1.3|0.9|0.4|1.4|Accommodation and food services
721|4.2|2.4|1.5|0.9|1.7|Accommodation
7211|4.1|2.4|1.5|0.9|1.7|Traveler accommodation
72111|4.1|2.4|1.6|0.8|1.7|Hotels (except casino hotels) and motels
72112|3.6|2.4|1.1|1.3|1.2|Casino hotels
7212|5.2|2.5|1.3|1.2|2.7|RV (Recreational Vehicle) parks and recreational camps
72121|5.2|2.5|1.3|1.2|2.7|RV (Recreational Vehicle) parks and recreational camps
721211|3.3|1.7|1.0|0.7|1.7|RV (Recreational Vehicle) parks and campgrounds
721214|6.4|3.1|1.5|1.5|3.4|Recreational and vacation camps (except campgrounds)
722|2.4|1.1|0.8|0.3|1.3|Food services and drinking places
7223|4.0|2.6|1.9|0.8|1.3|Special food services
7224|0.7|0.3|0.2|0.1|0.4|Drinking places (alcoholic beverages)
7225|2.3|1.0|0.7|0.2|1.3|Restaurants and other eating places
72251|2.3|1.0|0.7|0.2|1.3|Restaurants and other eating places
722511|2.0|0.9|0.7|0.2|1.1|Full-service restaurants
722513|2.5|1.0|0.8|0.3|1.5|Limited-service restaurants
722514|2.3|1.3|1.1|0.2|1.0|Cafeterias, grill buffets, and buffets
722515|2.9|1.4|0.9|0.5|1.6|Snack and nonalcoholic beverage bars
81|1.8|1.0|0.7|0.3|0.9|Other services (except public administration)
811|2.0|1.1|0.8|0.3|0.9|Repair and maintenance
8111|2.0|1.0|0.7|0.3|0.9|Automotive repair and maintenance
8112|1.2|0.9||0.2|0.3|Electronic and precision equipment repair and maintenance
8113|2.3|1.6|1.2|0.4|0.7|Commercial and industrial machinery and equipment (except automotive and electronic) repair and maintenance
8114|2.8|1.3|1.1||1.5|Personal and household goods repair and maintenance
812|1.6|0.9|0.6|0.3|0.7|Personal and laundry services
8121|0.3|0.3|0.2|0.1|0.1|Personal care services
8122|1.8|1.2|1.0|0.1|0.6|Death care services
8123|2.6|1.9|1.1|0.8|0.6|Drycleaning and laundry services
81232|1.6|1.0|0.5|0.5|0.7|Drycleaning and laundry services (except coin-operated)
81233|3.6|2.8|1.7|1.1|0.7|Linen and uniform supply
812332|3.7|3.2|2.0|1.1|0.5|Industrial launderers
8129|3.2|1.2|1.0|0.3|2.0|Other personal services
81291|5.6|2.1|1.7|0.4||Pet care (except veterinary) services
81293|1.4|0.8|0.6|0.2|0.6|Parking lots and garages
813|1.8|0.8|0.6|0.3|1.0|Religious, grantmaking, civic, professional, and similar organizations
S|2.9|1.7|1.3|0.4|1.3|State government
S61|1.4|0.6|0.4|0.3|0.8|Educational services
S611|1.4|0.6|0.4|0.3|0.8|Educational services
S6113|1.3|0.6|0.3|0.3|0.8|Colleges, universities, and professional schools
S62|5.7|3.5|2.9|0.6|2.2|Health care and social assistance
S622|6.4|3.7|2.9|0.7|2.7|Hospitals
S623|8.4|6.3|5.6|0.7|2.1|Nursing and residential care facilities
S92|3.2|1.9|1.5|0.4|1.4|Public administration
S922|5.5|3.3|2.8|0.5|2.2|Justice, public order, and safety activities
S9221|5.5|3.3|2.8|0.5|2.2|Justice, public order, and safety activities
S92212|6.0|3.6|2.4|1.1|2.4|Police protection
S92214|7.9|4.8|4.3|0.5|3.1|Correctional institutions
L|4.6|2.2|1.5|0.7|2.4|Local government
L22|4.2|2.5|1.5|1.0|1.6|Utilities
L221|4.2|2.5|1.5|1.0|1.6|Utilities
L2213|4.2|2.6|1.4|1.2|1.6|Water, sewage and other systems
L61|3.9|1.6|1.0|0.6|2.3|Educational services
L611|3.9|1.6|1.0|0.6|2.3|Educational services
L6111|4.1|1.7|1.1|0.6|2.4|Elementary and secondary schools
L62|4.3|1.6|1.1|0.5|2.7|Health care and social assistance
L622|4.7|1.6|1.1|0.5|3.1|Hospitals
L623|5.7|3.0|1.8|1.2|2.8|Nursing and residential care facilities
L92|5.7|2.9|2.2|0.7|2.8|Public administration`;

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
