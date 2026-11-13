// NAICS titles and a plain-words search, so people can find their code by typing what they
// do ("fishing", "roofing", "property management") instead of knowing the number.
//
// Source: U.S. Census Bureau, 2017 NAICS titles and descriptions (public domain), the same
// NAICS version BLS uses for its 2024 injury tables. Keywords are words pulled from each
// industry's Census description, with filler words and cross-references removed.
// Pairs with ./naics (BLS rates). Copy both files to reuse the search in another project.
//
// Format: code|Title|keywords

import { lookupNaics, type NaicsMatch, type Ownership } from "./naics";

export const NAICS_TITLE_VERSION = "2017";

const DATA = `11|Agriculture, Forestry, Fishing and Hunting|
111|Crop Production|
1111|Oilseed and Grain Farming|
11111|Soybean Farming|
111110|Soybean Farming|growing soybeans producing seeds
11112|Oilseed (except Soybean) Farming|
111120|Oilseed (except Soybean) Farming|growing fibrous producing plants seeds sunflower safflower flax rape canola sesame
11113|Dry Pea and Bean Farming|
111130|Dry Pea and Bean Farming|growing peas beans lentils
11114|Wheat Farming|
111140|Wheat Farming|growing producing seeds
11115|Corn Farming|
111150|Corn Farming|growing sweet producing seeds
11116|Rice Farming|
111160|Rice Farming|growing wild producing seeds
11119|Other Grain Farming|growing producing seeds wheat corn rice oilseed family grains oilseeds accounting one-half agricultural production value crops market produce grow barley rye milo
111191|Oilseed and Grain Combination Farming|growing family oilseeds grains accounting one-half agricultural production value crops market produce seeds grow
111199|All Other Grain Farming|growing grains producing seeds wheat corn rice oilseed combinations barley sorghum oat wild rye
1112|Vegetable and Melon Farming|
11121|Vegetable and Melon Farming|growing crops producing seeds bedding plants annual growth cycle grown open fields climate cultural practices limit areas often permit year
111211|Potato Farming|growing potatoes producing seed
111219|Other Vegetable (except Potato) and Melon Farming|growing melons vegetables potatoes dry peas beans field silage seed corn sugar beets producing seeds bedding plants carrot squash green bean tomato
1113|Fruit and Tree Nut Farming|
11131|Orange Groves|
111310|Orange Groves|growing oranges
11132|Citrus (except Orange) Groves|
111320|Citrus (except Orange) Groves|growing fruits oranges mandarin grapefruit tangelo lemon tangerine
11133|Noncitrus Fruit and Tree Nut Farming|growing fruits apples grapes berries peaches nuts pecans almonds pistachios family accounting one-half agricultural production value crops market
111331|Apple Orchards|growing apples
111332|Grape Vineyards|growing grapes sun dry raisins
111333|Strawberry Farming|growing strawberries
111334|Berry (except Strawberry) Farming|growing berries strawberries cranberry blackberry currant blueberry raspberry
111335|Tree Nut Farming|growing nuts almond pistachio filbert macadamia walnut pecan
111336|Fruit and Tree Nut Combination Farming|growing family nuts accounting one-half agricultural production value crops market
111339|Other Noncitrus Fruit Farming|growing fruits apples grapes berries tree nut combinations apricot fig banana cherry peach coffee pineapple date prune
1114|Greenhouse, Nursery, and Floriculture Production|
11141|Food Crops Grown Under Cover|growing fruits melons tomatoes glass protective
111411|Mushroom Production|growing mushrooms cover mines underground controlled environments
111419|Other Food Crops Grown Under Cover|growing mushrooms glass protective alfalfa sprout farming melon vegetable hydroponic crop fruit
11142|Nursery and Floriculture Production|growing stock shrubbery cut flowers flower seeds foliage plants cover open fields short rotation woody trees harvesting cycle years less pulp tree
111421|Nursery and Tree Production|growing stock shrubbery bulbs fruit sod forth cover open fields short rotation woody trees growth harvest cycle years less pulp
111422|Floriculture Production|growing producing cut flowers roses cultivated greens potted flowering foliage plants flower seeds cover open fields
1119|Other Crop Farming|
11191|Tobacco Farming|
111910|Tobacco Farming|growing
11192|Cotton Farming|
111920|Cotton Farming|growing
11193|Sugarcane Farming|
111930|Sugarcane Farming|growing
11194|Hay Farming|
111940|Hay Farming|growing alfalfa clover mixed
11199|All Other Crop Farming|growing crops oilseeds grains vegetables melons fruits tree nuts greenhouse nursery floriculture tobacco cotton sugarcane hay oilseed grain fruit nut family accounting
111991|Sugar Beet Farming|growing beets
111992|Peanut Farming|growing peanuts
111998|All Other Miscellaneous Crop Farming|growing crops oilseeds grains vegetables melons fruits tree nuts greenhouse nursery floriculture tobacco cotton sugarcane hay sugar beets peanuts oilseed grain fruit
112|Animal Production and Aquaculture|
1121|Cattle Ranching and Farming|
11211|Beef Cattle Ranching and Farming, including Feedlots|raising dairy herd replacements feeding fattening
112111|Beef Cattle Ranching and Farming|raising dairy herd replacements
112112|Cattle Feedlots|feeding fattening
11212|Dairy Cattle and Milk Production|
112120|Dairy Cattle and Milk Production|milking
11213|Dual-Purpose Cattle Ranching and Farming|
112130|Dual-Purpose Cattle Ranching and Farming|raising milking meat production
1122|Hog and Pig Farming|
11221|Hog and Pig Farming|
112210|Hog and Pig Farming|raising hogs pigs breeding farrowing weanling feeder market size
1123|Poultry and Egg Production|
11231|Chicken Egg Production|
112310|Chicken Egg Production|raising chickens eggs produced table hatching
11232|Broilers and Other Meat Type Chicken Production|
112320|Broilers and Other Meat Type Chicken Production|raising fryers roasters chickens
11233|Turkey Production|
112330|Turkey Production|raising turkeys meat egg
11234|Poultry Hatcheries|
112340|Poultry Hatcheries|hatching
11239|Other Poultry Production|
112390|Other Poultry Production|raising chickens meat egg turkeys duck ostrich emu pheasant geese quail
1124|Sheep and Goat Farming|
11241|Sheep Farming|
112410|Sheep Farming|raising lambs feeding fattening raised sale wool production
11242|Goat Farming|
112420|Goat Farming|raising goats
1125|Aquaculture|
11251|Aquaculture|farm raising production aquatic animals plants controlled selected environments form intervention rearing process enhance holding captivity regular stocking feeding protecting predators pests
112511|Finfish Farming and Fish Hatcheries|farm raising catfish trout goldfish tropical minnows hatching
112512|Shellfish Farming|farm raising crayfish shrimp oysters clams mollusks
112519|Other Aquaculture|farm raising aquatic animals finfish shellfish plants alligator algae frog seaweed turtle production
1129|Other Animal Production|
11291|Apiculture|
112910|Apiculture|raising bees collect gather honey sell queen packages royal jelly wax propolis venom pollen bee
11292|Horses and Other Equine Production|
112920|Horses and Other Equine Production|raising mules donkeys equines
11293|Fur-Bearing Animal and Rabbit Production|
112930|Fur-Bearing Animal and Rabbit Production|raising fur-bearing animals rabbits raised sale pelt
11299|All Other Animal Production|
112990|All Other Animal Production|raising animals cattle hogs pigs poultry sheep goats aquaculture apiculture horses equines fur-bearing rabbits family accounting one-half agricultural value market bird canaries
113|Forestry and Logging|
1131|Timber Tract Operations|
11311|Timber Tract Operations|
113110|Timber Tract Operations|tracts purpose selling standing
1132|Forest Nurseries and Gathering of Forest Products|
11321|Forest Nurseries and Gathering of Forest Products|
113210|Forest Nurseries and Gathering of Forest Products|growing trees reforestation gums barks balsam needles rhizomes fibers spanish moss ginseng truffles
1133|Logging|
11331|Logging|
113310|Logging|cutting timber transporting producing wood chips field
114|Fishing, Hunting and Trapping|
1141|Fishing|
11411|Fishing|commercial catching taking finfish shellfish miscellaneous marine natural habitat bluefish eels salmon tuna clams crabs lobsters mussels oysters shrimp frogs sea urchins
114111|Finfish Fishing|commercial catching taking bluefish salmon trout tuna natural habitat
114112|Shellfish Fishing|commercial catching taking clams crabs lobsters mussels oysters sea urchins shrimp natural habitat
114119|Other Marine Fishing|commercial catching taking animals finfish shellfish
1142|Hunting and Trapping|
11421|Hunting and Trapping|
114210|Hunting and Trapping|commercial game preserves retreats
115|Support Activities for Agriculture and Forestry|
1151|Support Activities for Crop Production|
11511|Support Activities for Crop Production|growing crops aerial dusting spraying specialized dedicated aircraft farm management cotton ginning planting cultivating vineyard cultivation
115111|Cotton Ginning|
115112|Soil Preparation, Planting, and Cultivating|performing crop production plowing fertilizing seed bed protecting
115113|Crop Harvesting, Primarily by Machine|mechanical picking combining crops machinery servicing
115114|Postharvest Crop Activities (except Cotton Ginning)|performing crops subsequent harvest intent preparing market further processing cleaning sun drying shelling fumigating curing sorting grading packing cooling
115115|Farm Labor Contractors and Crew Leaders|supplying agricultural production harvesting
115116|Farm Management Services|citrus groves orchards vineyards always arrange partial complete manage operational cultivating harvesting specialized agricultural support
1152|Support Activities for Animal Production|
11521|Support Activities for Animal Production|
115210|Support Activities for Animal Production|performing raising livestock cattle goats hogs horses poultry sheep perform breeding animals companion cats dogs pet birds pedigree record boarding dairy herd
1153|Support Activities for Forestry|
11531|Support Activities for Forestry|
115310|Support Activities for Forestry|performing particular timber production wood technology economics marketing forest protection estimating firefighting pest control treating burned forests air reforestation emergency consulting attributes
21|Mining, Quarrying, and Oil and Gas Extraction|
211|Oil and Gas Extraction|
2111|Oil and Gas Extraction|
21112|Crude Petroleum Extraction|
211120|Crude Petroleum Extraction|exploration development production wells hydrocarbons initially flow produced normal enhanced drilling techniques surface shales tar sands reservoirs semisolids operate oil account
21113|Natural Gas Extraction|
211130|Natural Gas Extraction|exploration development production wells hydrocarbons initially flow produced normal enhanced drilling techniques recovery liquid oil field gases sulfur
212|Mining (except Oil and Gas)|
2121|Coal Mining|
21211|Coal Mining|bituminous anthracite lignite underground auger strip culm bank surface developing mine sites beneficiating preparing cleaning washing screening sizing
212111|Bituminous Coal and Lignite Surface Mining|developing mine sites beneficiating cleaning washing screening sizing
212112|Bituminous Coal Underground Mining|developing mine sites beneficiating cleaning washing screening sizing
212113|Anthracite Mining|coal developing mine sites beneficiating cleaning washing screening sizing
2122|Metal Ore Mining|
21221|Iron Ore Mining|
212210|Iron Ore Mining|developing mine sites beneficiating preparing ores manganiferous valued content producing sinter produced steel mills agglomerates
21222|Gold Ore and Silver Ore Mining|developing mine site beneficiating preparing ores valued content transformation bullion dore bar
212221|Gold Ore Mining|developing mine site beneficiating preparing ores valued content transformation bullion dore bar
212222|Silver Ore Mining|developing mine site beneficiating preparing ores valued content transformation bullion dore bar
21223|Copper, Nickel, Lead, and Zinc Mining|
212230|Copper, Nickel, Lead, and Zinc Mining|developing mine site beneficiating preparing ores valued content transformation concentrates recovering precipitation leaching electrowinning ore
21229|Other Metal Ore Mining|developing mine site beneficiating preparing ores iron manganiferous valued content gold silver copper nickel lead zinc antimony tantalum columbite tungsten ilmenite uranium-radium-vanadium
212291|Uranium-Radium-Vanadium Ore Mining|developing mine site beneficiating preparing uranium-radium-vanadium ores
212299|All Other Metal Ore Mining|developing mine site beneficiating preparing ores iron manganiferous valued content gold silver copper nickel lead zinc uranium-radium-vanadium antimony rare earth columbite tantalum
2123|Nonmetallic Mineral Mining and Quarrying|
21231|Stone Mining and Quarrying|developing mine site dimension rough blocks slabs crushed broken preparation plants beneficiating crushing grinding washing screening pulverizing sizing
212311|Dimension Stone Mining and Quarrying|developing mine site rough blocks slabs
212312|Crushed and Broken Limestone Mining and Quarrying|developing mine site rocks dolomite cement rock marl travertine calcareous tufa preparation plants beneficiating grinding pulverizing
212313|Crushed and Broken Granite Mining and Quarrying|developing mine site rocks gneiss syenite nepheline diorite preparation plants beneficiating grinding pulverizing
212319|Other Crushed and Broken Stone Mining and Quarrying|developing mine site limestone granite preparation plants beneficiating grinding pulverizing bituminous sandstone marble
21232|Sand, Gravel, Clay, and Ceramic and Refractory Minerals Mining and Quarrying|developing mine site dredging china paper slip preparation plants beneficiating washing screening grinding
212321|Construction Sand and Gravel Mining|commercial grade pits dredging washing screening otherwise preparing
212322|Industrial Sand Mining|grade pits dredging washing screening otherwise preparing
212324|Kaolin and Ball Clay Mining|developing mine site china paper slip beneficiating preparing
212325|Clay and Ceramic and Refractory Minerals Mining|kaolin ball developing mine site beneficiating preparing bentonite fuller earth common magnesite feldspar nepheline syenite fire shale oil
21239|Other Nonmetallic Mineral Mining and Quarrying|developing mine site milling otherwise beneficiating preparing minerals coal stone sand gravel clay ceramic refractory barite phosphate rock borate natural potash peat
212391|Potash, Soda, and Borate Mineral Mining|developing mine site milling otherwise beneficiating preparing natural potassium sodium boron compounds drylake brine producing specified minerals underground open pit mines
212392|Phosphate Rock Mining|developing mine site milling drying otherwise beneficiating preparing
212393|Other Chemical and Fertilizer Mineral Mining|developing mine site milling drying otherwise beneficiating preparing raw materials potash soda boron phosphate rock barite salt celestite sulfur fluorspar
212399|All Other Nonmetallic Mineral Mining|developing mine site milling otherwise beneficiating preparing minerals stone sand gravel clay ceramic refractory chemical fertilizer gypsum soapstone mica talc pyrophyllite
213|Support Activities for Mining|
2131|Support Activities for Mining|
21311|Support Activities for Mining|required quarrying minerals extraction oil gas drilling taking core samples making geological observations prospective sites geophysical surveying mapping
213111|Drilling Oil and Gas Wells|contractors specialize spudding redrilling directional
213112|Support Activities for Oil and Gas Operations|performing site preparation construction exploration geophysical surveying mapping excavating slush pits cellars running cutting pulling casings tubes rods cementing wells shooting perforating
213113|Support Activities for Coal Mining|site preparation construction exploration traditional prospecting methods taking core samples making geological observations prospective sites
213114|Support Activities for Metal Mining|site preparation construction quarrying metallic minerals extraction ores exploration geophysical surveying mapping traditional prospecting methods taking core samples making geological observations prospective
213115|Support Activities for Nonmetallic Minerals (except Fuels) Mining|quarrying fuel extraction site preparation construction exploration geophysical surveying mapping traditional prospecting methods taking core samples making geological observations prospective sites
22|Utilities|
221|Utilities|
2211|Electric Power Generation, Transmission and Distribution|
22111|Electric Power Generation|facilities convert forms energy water hydroelectric fossil fuels nuclear solar electrical produce electricity transmission systems distribution
221111|Hydroelectric Power Generation|facilities water drive turbine produce electric energy produced transmission systems distribution
221112|Fossil Fuel Electric Power Generation|powered facilities fuels coal oil gas internal combustion turbine conventional steam process produce energy produced transmission systems distribution
221113|Nuclear Electric Power Generation|facilities produce energy produced transmission systems distribution
221114|Solar Electric Power Generation|facilities energy sun produce produced transmission systems distribution
221115|Wind Electric Power Generation|facilities drive turbine produce energy produced transmission systems distribution
221116|Geothermal Electric Power Generation|facilities heat derived earth produce energy produced transmission systems distribution
221117|Biomass Electric Power Generation|facilities wood waste alcohol fuels produce energy produced transmission systems distribution
221118|Other Electric Power Generation|facilities hydroelectric fossil fuel nuclear solar wind geothermal biomass convert forms energy tidal produced transmission systems distribution
22112|Electric Power Transmission, Control, and Distribution|systems controlling regulating voltages electricity distributing system lines transformer stations arrange facilitate coordinate generating source centers utilities final consumers consists poles meters
221121|Electric Bulk Power Transmission and Control|systems controlling regulating voltages electricity generating source distribution centers utilities system lines transformer stations
221122|Electric Power Distribution|systems consisting lines poles meters wiring brokers agents arrange sale electricity via operated
2212|Natural Gas Distribution|
22121|Natural Gas Distribution|
221210|Natural Gas Distribution|systems mains meters marketers buy sell system brokers agents arrange sale operated transmitting distributing final consumers
2213|Water, Sewage and Other Systems|
22131|Water Supply and Irrigation Systems|
221310|Water Supply and Irrigation Systems|treatment plants system pumping stations aqueducts distribution mains drinking uses
22132|Sewage Treatment Facilities|
221320|Sewage Treatment Facilities|sewer systems collect treat dispose waste
22133|Steam and Air-Conditioning Supply|
221330|Steam and Air-Conditioning Supply|heated cooled distribution mains
23|Construction|
236|Construction of Buildings|
2361|Residential Building Construction|
23611|Residential Building Construction|responsible remodeling renovation single-family multifamily buildings housing general contractors renovating existing structures for-sale builders remodelers project management firms design-build
236115|New Single-Family Housing Construction (except For-Sale Builders)|general contractor responsible entire single-family detached houses town row unit separated neighbors ground-to-roof wall units constructed above below contractors on-site assembly modular
236116|New Multifamily Housing Construction (except For-Sale Builders)|general contractor responsible residential units high-rise garden town house apartments condominiums unit separated neighbors ground-to-roof wall design-build firms management acting contractors
236117|New Housing For-Sale Builders|building homes land owned controlled builder rather homebuyer investor home build single-family multifamily often referred merchant production for-sale
236118|Residential Remodelers|responsible remodeling construction additions alterations reconstruction maintenance repairs houses buildings single-family multifamily general contractors for-sale design-build firms project management
2362|Nonresidential Building Construction|
23621|Industrial Building Construction|
236210|Industrial Building Construction|responsible work additions alterations maintenance repairs buildings warehouses selected additional structures whose production processes incinerators cement plants blast furnaces nonbuilding general contractors
23622|Commercial and Institutional Building Construction|
236220|Commercial and Institutional Building Construction|responsible work additions alterations maintenance repairs buildings structures stadiums grain elevators indoor swimming facilities on-site assembly modular prefabricated general contractors for-sale builders
237|Heavy and Civil Engineering Construction|
2371|Utility System Construction|
23711|Water and Sewer Line and Related Structures Construction|
237110|Water and Sewer Line and Related Structures Construction|lines mains pumping stations treatment plants storage tanks work performed reconstruction rehabilitation repairs specialty trade contractors buildings integral parts networks sewage distribution
23712|Oil and Gas Pipeline and Related Structures Construction|
237120|Oil and Gas Pipeline and Related Structures Construction|lines mains refineries storage tanks work performed reconstruction rehabilitation repairs specialty trade contractors buildings integral parts networks pumping stations distribution line refinery
23713|Power and Communication Line and Related Structures Construction|
237130|Power and Communication Line and Related Structures Construction|lines towers plants radio television telecommunications transmitting receiving work performed reconstruction rehabilitation repairs specialty trade contractors buildings integral parts networks substations alternative
2372|Land Subdivision|
23721|Land Subdivision|
237210|Land Subdivision|servicing subdividing real property lots subsequent sale builders excavation work installation roads utility lines extent vary project precedes building often residential commercial
2373|Highway, Street, and Bridge Construction|
23731|Highway, Street, and Bridge Construction|
237310|Highway, Street, and Bridge Construction|highways elevated streets roads airport runways public sidewalks bridges work performed reconstruction rehabilitation repairs specialty trade contractors installing guardrails runway line painting
2379|Other Heavy and Civil Engineering Construction|
23799|Other Heavy and Civil Engineering Construction|
237990|Other Heavy and Civil Engineering Construction|projects excluding highway street bridge distribution line work performed reconstruction rehabilitation repairs specialty trade contractors oil gas structure utilities building involving water
238|Specialty Trade Contractors|
2381|Foundation, Structure, and Building Exterior Contractors|
23811|Poured Concrete Foundation and Structure Contractors|
238110|Poured Concrete Foundation and Structure Contractors|pouring finishing foundations structural elements performing grout shotcrete work performed additions alterations maintenance repairs gunite pumping placement mud-jacking paving footing
23812|Structural Steel and Precast Concrete Contractors|
238120|Structural Steel and Precast Concrete Contractors|erecting assembling parts made beams components installing construction rods bars rebar mesh cages reinforce poured-in-place work performed additions alterations maintenance repairs prestressed
23813|Framing Contractors|
238130|Framing Contractors|structural sheathing materials steel concrete work performed additions alterations maintenance repairs building post foundation wood frame component truss fabrication site
23814|Masonry Contractors|
238140|Masonry Contractors|work stone setting bricklaying performed additions alterations maintenance repairs block laying marble granite slate exterior pointing cleaning caulking concrete stucco foundation brick
23815|Glass and Glazing Contractors|
238150|Glass and Glazing Contractors|installing panes prepared openings work buildings performed additions alterations maintenance repairs decorative mirror installation cladding stained coating tinting automotive window pane sheet
23816|Roofing Contractors|
238160|Roofing Contractors|treating roofs spraying painting coating installing skylights work performed additions alterations maintenance repairs roof sheet metal installation shake shingle skylight
23817|Siding Contractors|
238170|Siding Contractors|installing wood aluminum vinyl exterior finish material brick stone stucco curtain wall gutters downspouts work performed additions alterations maintenance repairs downspout gutter
23819|Other Foundation, Structure, and Building Exterior Contractors|
238190|Other Foundation, Structure, and Building Exterior Contractors|trades work poured concrete structural steel precast framing masonry glass glazing roofing siding performed additions alterations maintenance repairs curtain wall metal installation
2382|Building Equipment Contractors|
23821|Electrical Contractors and Other Wiring Installation Contractors|
238210|Electrical Contractors and Other Wiring Installation Contractors|installing servicing equipment parts labor performing work perform additions alterations maintenance repairs airport runway lighting fiber optic cable transmission line alarm system
23822|Plumbing, Heating, and Air-Conditioning Contractors|
238220|Plumbing, Heating, and Air-Conditioning Contractors|installing servicing air-conditioning equipment parts labor performing work performed additions alterations maintenance repairs cooling tower installation ventilation hvac duct dust collection exhaust
23829|Other Building Equipment Contractors|
238290|Other Building Equipment Contractors|installing servicing electrical plumbing heating cooling ventilation repair maintenance miscellaneous work performed additions alterations repairs automated revolving door installation lightning protection rod
2383|Building Finishing Contractors|
23831|Drywall and Insulation Contractors|
238310|Drywall and Insulation Contractors|plaster work building applying plain ornamental installation lath receive performed additions alterations maintenance repairs firestop acoustical ceiling tile panel lathing drop plastering
23832|Painting and Wall Covering Contractors|
238320|Painting and Wall Covering Contractors|interior exterior work performed additions alterations maintenance repairs bridge paperhanging removal house ship paint wallpaper stripping hanging
23833|Flooring Contractors|
238330|Flooring Contractors|installation resilient floor tile carpeting linoleum hardwood work performed additions alterations maintenance repairs carpet sheet rubber vinyl resurfacing laying scraping finishing refinishing
23834|Tile and Terrazzo Contractors|
238340|Tile and Terrazzo Contractors|setting installing ceramic stone interior mosaic mixing marble particles cement make job site work performed additions alterations maintenance repairs installation mantel resilient
23835|Finish Carpentry Contractors|
238350|Finish Carpentry Contractors|work performed additions alterations maintenance repairs built-in wood cabinets constructed site molding trim plastic installation countertop residential-type paneling door window frame construction
23839|Other Building Finishing Contractors|
238390|Other Building Finishing Contractors|trade work drywall plaster insulation painting wall covering flooring tile terrazzo finish carpentry performed additions alterations maintenance repairs bathtub refinishing on-site fabricating
2389|Other Specialty Trade Contractors|
23891|Site Preparation Contractors|
238910|Site Preparation Contractors|excavating grading demolition buildings structures septic system installation earthmoving land clearing sites building nonbuilding mining construction equipment rental operator cranes blasting foundation
23899|All Other Specialty Trade Contractors|
238990|All Other Specialty Trade Contractors|specialized trades foundation structure building exterior equipment finishing site preparation work performed additions alterations maintenance repairs billboard erection outdoor swimming pool construction
31-33|Manufacturing|
311|Food Manufacturing|
3111|Animal Food Manufacturing|
31111|Animal Food Manufacturing|feed animals ingredients grains oilseed mill meat
311111|Dog and Cat Food Manufacturing|ingredients grains oilseed mill meat
311119|Other Animal Food Manufacturing|dog cat ingredients grains oilseed mill meat
3112|Grain and Oilseed Milling|
31121|Flour Milling and Malt Manufacturing|meal grains vegetables preparing mixes doughs milled cleaning polishing rice barley rye
311211|Flour Milling|meal grains rice vegetables preparing mixes doughs
311212|Rice Milling|cleaning polishing package mill ingredients
311213|Malt Manufacturing|barley rye grains
31122|Starch and Vegetable Fats and Oils Manufacturing|wet milling corn vegetables crushing oilseeds tree nuts refining blending shortening margarine purchased animal
311221|Wet Corn Milling|vegetables make ethyl alcohol made sweeteners glucose dextrose fructose oil starches laundry
311224|Soybean and Other Oilseed Processing|crushing oilseeds tree nuts soybeans cottonseeds linseeds peanuts sunflower seeds produced oils cakes meals protein isolates concentrates
311225|Fats and Oils Refining and Blending|manufacturing shortening margarine purchased vegetable oilseed tree nut animal
31123|Breakfast Cereal Manufacturing|
311230|Breakfast Cereal Manufacturing|foods
3113|Sugar and Confectionery Product Manufacturing|
31131|Sugar Manufacturing|raw liquid refined sugarcane cane beets
311313|Beet Sugar Manufacturing|refined beets
311314|Cane Sugar Manufacturing|processing sugarcane refining raw
31134|Nonchocolate Confectionery Manufacturing|
311340|Nonchocolate Confectionery Manufacturing|confectioneries retailing immediate consumption made premises
31135|Chocolate and Confectionery Manufacturing|confectioneries cacao beans produced retailing immediate consumption made premises
311351|Chocolate and Confectionery Manufacturing from Cacao Beans|shelling roasting grinding making confectioneries
311352|Confectionery Manufacturing from Purchased Chocolate|confectioneries produced retailing immediate consumption made premises
3114|Fruit and Vegetable Preserving and Specialty Food Manufacturing|
31141|Frozen Food Manufacturing|fruit juices vegetables specialty foods seafood dinners entrees side dishes pizza whipped toppings waffles pancakes french toast
311411|Frozen Fruit, Juice, and Vegetable Manufacturing|fruits vegetables juices ades drinks cocktail mixes concentrates
311412|Frozen Specialty Food Manufacturing|foods seafood dinners entrees side dishes pizza whipped topping waffles pancakes french toast
31142|Fruit and Vegetable Canning, Pickling, and Drying|manufacturing canned pickled dried fruits vegetables specialty foods package dehydrated ingredients make purchased made juices baby soups seafood dry beans tomato-based sauces
311421|Fruit and Vegetable Canning|manufacturing canned pickled brined fruits vegetables made juices jams jellies tomato-based sauces catsup salsa chili sauce spaghetti barbeque tomato paste pickles relishes
311422|Specialty Canning|manufacturing canned foods made baby food baked beans soups seafood spaghetti nationality
311423|Dried and Dehydrated Food Manufacturing|drying freeze-dried dehydrating fruits vegetables soup mixes bouillon ingredients packaging purchased rice dry pasta
3115|Dairy Product Manufacturing|
31151|Dairy Product (except Frozen) Manufacturing|raw milk processed substitutes soybeans nondairy substances dry condensed concentrated evaporated substitute
311511|Fluid Milk Manufacturing|processed pasteurized cream sour dairy substitutes soybeans nondairy substances
311512|Creamery Butter Manufacturing|milk processed
311513|Cheese Manufacturing|cottage raw milk processed substitutes soybean nondairy substances
311514|Dry, Condensed, and Evaporated Dairy Product Manufacturing|milk substitute
31152|Ice Cream and Frozen Dessert Manufacturing|
311520|Ice Cream and Frozen Dessert Manufacturing|yogurts ices sherbets tofu desserts bakery
3116|Animal Slaughtering and Processing|
31161|Animal Slaughtering and Processing|animals preparing processed meats meat byproducts rendering refining fat bones scraps assembly cutting packing boxed purchased carcasses
311611|Animal (except Poultry) Slaughtering|animals small game slaughter prepare meats
311612|Meat Processed from Carcasses|processing preserving byproducts poultry small game purchased meats assembly cutting packing boxed
311613|Rendering and Meat Byproduct Processing|animal fat bones scraps
311615|Poultry Processing|slaughtering small game preparing processed meat byproducts
3117|Seafood Product Preparation and Packaging|
31171|Seafood Product Preparation and Packaging|
311710|Seafood Product Preparation and Packaging|canning soup smoking salting drying eviscerating fresh fish removing heads fins scales bones entrails shucking packing shellfish processing marine fats oils freezing
3118|Bakeries and Tortilla Manufacturing|
31181|Bread and Bakery Product Manufacturing|fresh frozen
311811|Retail Bakeries|retailing bread bakery immediate consumption made premises flour prepared dough
311812|Commercial Bakeries|manufacturing fresh frozen bread bread-type rolls bakery cookies crackers
311813|Frozen Cakes, Pies, and Other Pastries Manufacturing|bakery bread doughnuts
31182|Cookie, Cracker, and Pasta Manufacturing|cookies crackers preparing flour dough mixes ground dry package manufacture ingredients
311821|Cookie and Cracker Manufacturing|cookies crackers ice cream cones
311824|Dry Pasta, Dough, and Flour Mixes Manufacturing from Purchased Flour|prepared ground package manufacture ingredients
31183|Tortilla Manufacturing|
311830|Tortilla Manufacturing|tortillas
3119|Other Food Manufacturing|
31191|Snack Food Manufacturing|salting roasting drying cooking canning nuts processing grains seeds snacks peanut butter potato chips corn popped popcorn pretzels soft pork rinds
311911|Roasted Nuts and Peanut Butter Manufacturing|salting roasting drying cooking canning processing grains seeds snacks
311919|Other Snack Food Manufacturing|foods roasted nuts peanut butter corn chips snacks popped popcorn candy-covered pork rinds potato pretzels soft tortilla
31192|Coffee and Tea Manufacturing|
311920|Coffee and Tea Manufacturing|roasting concentrates instant freeze-dried blending herbal extracts flavorings syrups
31193|Flavoring Syrup and Concentrate Manufacturing|
311930|Flavoring Syrup and Concentrate Manufacturing|drink concentrates soda fountain manufacture soft drinks
31194|Seasoning and Dressing Manufacturing|dressings sauces mayonnaise salad vinegar mustard horseradish soy sauce tarter worcestershire prepared tomato-based gravies spices table salt flavoring extracts coffee meat natural
311941|Mayonnaise, Dressing, and Other Prepared Sauce Manufacturing|salad vinegar mustard horseradish soy tarter worcestershire sauces tomato-based gravy
311942|Spice and Extract Manufacturing|spices table salt seasonings flavoring extracts coffee meat natural food colorings dry mix preparations salad dressing mixes gravy sauce frosting
31199|All Other Food Manufacturing|animal grain oilseed milling sugar confectionery preserved fruits vegetables specialty foods dairy meat seafood baked tortillas snack coffee tea flavoring syrups concentrates
311991|Perishable Prepared Food Manufacturing|foods salads sandwiches meals fresh pizza pasta peeled cut vegetables
311999|All Other Miscellaneous Food Manufacturing|animal grain oilseed milling sugar confectionery preserved fruits vegetables specialties dairy meat seafood bakeries tortillas snack foods coffee tea flavoring syrups concentrates
312|Beverage and Tobacco Product Manufacturing|
3121|Beverage Manufacturing|
31211|Soft Drink and Ice Manufacturing|drinks purifying bottling water
312111|Soft Drink Manufacturing|drinks artificially carbonated waters
312112|Bottled Water Manufacturing|purifying bottling naturally carbonated
312113|Ice Manufacturing|
31212|Breweries|
312120|Breweries|brewing beer ale lager malt liquors nonalcoholic
31213|Wineries|
312130|Wineries|growing grapes manufacturing wines brandies fruits grown blending
31214|Distilleries|
312140|Distilleries|distilling potable liquors brandies blending mixing ingredients
3122|Tobacco Manufacturing|
31223|Tobacco Manufacturing|
312230|Tobacco Manufacturing|stemming redrying cigarettes chewing cigar electronic snuff prepared pipe leaf processing aging
313|Textile Mills|
3131|Fiber, Yarn, and Thread Mills|
31311|Fiber, Yarn, and Thread Mills|
313110|Fiber, Yarn, and Thread Mills|spinning manufacturing texturizing throwing twisting winding purchased manmade filaments producing hemp further processing rope bags
3132|Fabric Mills|
31321|Broadwoven Fabric Mills|
313210|Broadwoven Fabric Mills|weaving fabrics felts tire rugs weave finish further fabricate
31322|Narrow Fabric Mills and Schiffli Machine Embroidery|
313220|Narrow Fabric Mills and Schiffli Machine Embroidery|weaving braiding fabrics final form initially made wider widths specially constructed narrower making fabric-covered elastic yarn thread manufacturing embroideries weave finish further
31323|Nonwoven Fabric Mills|
313230|Nonwoven Fabric Mills|manufacturing fabrics felts processes bonding interlocking fibers mechanical chemical thermal solvent means combinations thereof
31324|Knit Fabric Mills|
313240|Knit Fabric Mills|knitting weft circular warp flat finishing manufacturing lace dyeing finish further fabricate apparel
3133|Textile and Fabric Finishing and Fabric Coating Mills|
31331|Textile and Fabric Finishing Mills|
313310|Textile and Fabric Finishing Mills|textiles fabrics apparel converters buy grey finished sell wholesale bleaching dyeing printing roller screen flock plisse stonewashing mechanical preshrinking shrinking sponging calendering
31332|Fabric Coating Mills|
313320|Fabric Coating Mills|laminating varnishing waxing rubberizing textiles apparel
314|Textile Product Mills|
3141|Textile Furnishings Mills|
31411|Carpet and Rug Mills|
314110|Carpet and Rug Mills|manufacturing woven tufted carpets rugs art squares floor mattings needlepunch carpeting door mats textile materials twisted paper grasses reeds sisal jute rags
31412|Curtain and Linen Mills|
314120|Curtain and Linen Mills|manufacturing household textile curtains draperies linens bedspreads sheets tablecloths towels shower purchased materials made stock custom sale individual retail customers
3149|Other Textile Product Mills|
31491|Textile Bag and Canvas Mills|
314910|Textile Bag and Canvas Mills|manufacturing bags canvas-like awnings sails tarpaulins tents purchased fabrics yarns covers boat swimming pool truck made laundry woven knitted materials seed
31499|All Other Textile Product Mills|manufacturing nonapparel carpet rugs curtains linens bags canvas purchased materials decorative stitching embroidery art needlework apparel batts batting nonwoven fabrics cutting binding
314994|Rope, Cordage, Twine, Tire Cord, and Tire Fabric Mills|manufacturing cable materials abaca sisal henequen cotton paper jute flax manmade fibers glass polyester rayon steel reinforcing rubber tires industrial belting uses
314999|All Other Miscellaneous Textile Product Mills|manufacturing carpets rugs curtains linens bags canvas rope cordage twine tire cords fabrics purchased materials further embellish manufacture decorative stitching adding embroidery
315|Apparel Manufacturing|
3151|Apparel Knitting Mills|
31511|Hosiery and Sock Mills|
315110|Hosiery and Sock Mills|knitting finishing socks
31519|Other Apparel Knitting Mills|
315190|Other Apparel Knitting Mills|underwear outerwear nightwear fabric manufacturing finishing knit
3152|Cut and Sew Apparel Manufacturing|
31521|Cut and Sew Apparel Contractors|
315210|Cut and Sew Apparel Contractors|commonly referred cutting materials owned accessories sewing
31522|Men’s and Boys’ Cut and Sew Apparel Manufacturing|
315220|Men’s and Boys’ Cut and Sew Apparel Manufacturing|purchased fabric clothing jobbers perform entrepreneurial functions involved manufacture buying raw materials designing preparing samples arranging made marketing finished
31524|Women’s, Girls’, and Infants’ Cut and Sew Apparel Manufacturing|
315240|Women’s, Girls’, and Infants’ Cut and Sew Apparel Manufacturing|purchased fabric clothing jobbers perform entrepreneurial functions involved manufacture buying raw materials designing preparing samples arranging made marketing finished
31528|Other Cut and Sew Apparel Manufacturing|
315280|Other Cut and Sew Apparel Manufacturing|purchased fabric men boys women girls infants clothing jobbers perform entrepreneurial functions involved manufacture buying raw materials designing preparing samples arranging made
3159|Apparel Accessories and Other Apparel Manufacturing|
31599|Apparel Accessories and Other Apparel Manufacturing|
315990|Apparel Accessories and Other Apparel Manufacturing|knitting mills cut sew contractors men boys women girls infants jobbers perform entrepreneurial functions involved manufacture buying raw materials designing preparing samples
316|Leather and Allied Product Manufacturing|
3161|Leather and Hide Tanning and Finishing|
31611|Leather and Hide Tanning and Finishing|
316110|Leather and Hide Tanning and Finishing|currying hides skins having process dyeing dressing furs
3162|Footwear Manufacturing|
31621|Footwear Manufacturing|
316210|Footwear Manufacturing|orthopedic extension athletic shoes ballet slippers cleated children infants men women
3169|Other Leather and Allied Product Manufacturing|
31699|Other Leather and Allied Product Manufacturing|footwear apparel purchased substitutes fabric plastics billfolds materials boot shoe cut stock findings dog furnishings collars leashes harnesses muzzles luggage purses women
316992|Women's Handbag and Purse Manufacturing|handbags purses material precious metal
316998|All Other Leather Good and Allied Product Manufacturing|footwear handbags purses apparel purchased substitutes fabric plastics billfolds materials boot shoe cut stock findings coin metal dog furnishings collars leashes harnesses
321|Wood Product Manufacturing|
3211|Sawmills and Wood Preservation|
32111|Sawmills and Wood Preservation|sawing dimension lumber boards beams timber poles ties shingles shakes siding chips logs bolts round pilings posts treating preservatives sawed planed shaped
321113|Sawmills|sawing dimension lumber boards beams timbers poles ties shingles shakes siding wood chips logs bolts plane rough make planing machine achieve smoothness
321114|Wood Preservation|treating sawed planed shaped creosote preservatives alkaline copper quat azole sodium borates prevent decay protect against fire insects sawing round poles pilings
3212|Veneer, Plywood, and Engineered Wood Product Manufacturing|
32121|Veneer, Plywood, and Engineered Wood Product Manufacturing|members reconstituted made faced nonwood materials plastics metal fabricated structural laminated medium density fiberboard mdf oriented strandboard osb particleboard sheets boards roof
321211|Hardwood Veneer and Plywood Manufacturing|
321212|Softwood Veneer and Plywood Manufacturing|
321213|Engineered Wood Member (except Truss) Manufacturing|fabricated laminated arches structural members finger joint lumber i-joists fabricating veneer lvl parallel strand timbers glue pre-engineered
321214|Truss Manufacturing|laminated fabricated wood roof floor trusses
321219|Reconstituted Wood Product Manufacturing|sheets boards medium density fiberboard mdf oriented strandboard osb particleboard waferboard
3219|Other Wood Product Manufacturing|
32191|Millwork|manufacturing hardwood softwood cut stock dimension shapes wood windows doors flooring defined lumber worked shaped specialized sizes woodworking machinery jointers planers lathes
321911|Wood Window and Door Manufacturing|units sash frames doors clad metal plastics
321912|Cut Stock, Resawing Lumber, and Planing|manufacturing dimension purchased shapes output sawmills woodworking machinery jointers planers lathes routers shape wood
321918|Other Millwork (including Flooring)|manufacturing wood windows doors cut stock clear finger joint moldings decorative base chair rail crown shoe ornamental woodwork cornices mantel planing mills
32192|Wood Container and Pallet Manufacturing|
321920|Wood Container and Pallet Manufacturing|pallets box shook boxes containers parts
32199|All Other Wood Product Manufacturing|sawmills preservation facilities veneer plywood engineered millwork containers pallets mobile homes panels prefabricated building buildings sections dowels handles broom handtool mop
321991|Manufactured Home (Mobile Home) Manufacturing|making homes nonresidential buildings designed accept permanent water sewer utility connections although equipped wheels intended regular highway movement
321992|Prefabricated Wood Building Manufacturing|buildings sections panels
321999|All Other Miscellaneous Wood Product Manufacturing|sawmills preservation facilities veneer engineered millwork containers pallets container parts making manufactured homes mobile prefabricated buildings components cabinets housings sewing machines stereo
322|Paper Manufacturing|
3221|Pulp, Paper, and Paperboard Mills|
32211|Pulp Mills|
322110|Pulp Mills|manufacturing paper paperboard made separating cellulose fibers impurities wood materials recycled rags linters scrap straw
32212|Paper Mills|manufacturing pulp manufacture purchase addition convert make making classifies regardless output
322121|Paper (except Newsprint) Mills|manufacturing uncoated groundwood pulp manufacture purchase addition convert make
322122|Newsprint Mills|manufacturing uncoated groundwood paper pulp manufacture purchase addition convert make
32213|Paperboard Mills|
322130|Paperboard Mills|manufacturing drum stock container board corrugating medium folding carton linerboard tube pulp manufacture purchase addition convert make
3222|Converted Paper Product Manufacturing|
32221|Paperboard Container Manufacturing|converting containers corrugating cutting shaping machinery form made boxes corrugated sheets pads pallets paper dishes fiber drums reels
322211|Corrugated and Solid Fiber Box Manufacturing|laminating purchased paper paperboard boxes pads partitions pallets shipping
322212|Folding Paperboard Box Manufacturing|converting corrugated boxes paper
322219|Other Paperboard Container Manufacturing|converting containers corrugated solid fiber folding boxes cans drums all-fiber nonfiber ends material made purchased milk cartons paper sanitary food setup shipped
32222|Paper Bag and Coated and Treated Paper Manufacturing|
322220|Paper Bag and Coated and Treated Paper Manufacturing|cutting coating paperboard laminating flexible materials plastics film bags multiwall sacks metal foil laminates combinations laminated aluminum converted foils purchased surface
32223|Stationery Product Manufacturing|
322230|Stationery Product Manufacturing|converting paper paperboard writing filing art work applications computer die-cut made purchased office envelopes mailing material tablets memo note tapes adding machine
32229|Other Converted Paper Product Manufacturing|converting paperboard containers bags coated treated stationery pulp disposable diapers molded egg cartons food trays dishes processes laminating lining purchased crepe made
322291|Sanitary Paper Product Manufacturing|converting purchased stock wadding facial tissues handkerchiefs table napkins toilet towels disposable diapers tampons
322299|All Other Converted Paper Product Manufacturing|converting paperboard containers bags coated treated stationery sanitary pulp egg cartons food trays molded crepe made purchased die-cut office novelties
323|Printing and Related Support Activities|
3231|Printing and Related Support Activities|
32311|Printing|apparel textile paper metal glass plastics materials fabric grey processes employed limited lithographic gravure screen flexographic digital letterpress manufacture stock print perform
323111|Commercial Printing (except Screen and Books)|publishing grey processes limited lithographic gravure flexographic letterpress engraving digital technologies purchased stock materials stationery invitations labels job-order traditional combined document photocopying
323113|Commercial Screen Printing|publishing books grey manifold business forms purchased stock materials stationery invitations labels job-order apparel textile t-shirts caps jackets towels napkins
323117|Books Printing|binding pamphlets publishing
32312|Support Activities for Printing|
323120|Support Activities for Printing|performing prepress postpress things platemaking typesetting trade binding sample mounting book paper bronzing die cutting edging embossing folding gilding gluing indexing
324|Petroleum and Coal Products Manufacturing|
3241|Petroleum and Coal Products Manufacturing|
32411|Petroleum Refineries|
324110|Petroleum Refineries|refining crude refined involves fractionation straight distillation oil cracking
32412|Asphalt Paving, Roofing, and Saturated Materials Manufacturing|tar mixtures blocks cements coatings purchased asphaltic saturating mats felts
324121|Asphalt Paving Mixture and Block Manufacturing|tar mixtures blocks purchased asphaltic materials
324122|Asphalt Shingle and Coating Materials Manufacturing|saturating purchased mats felts tar asphaltic roofing cements coatings
32419|Other Petroleum and Coal Products Manufacturing|asphalt paving roofing saturated materials refined made coke ovens integrated steel mill biodiesel fuels refineries blended purchased oven gases tars brake fluids
324191|Petroleum Lubricating Oil and Grease Manufacturing|blending compounding refined make oils greases re-refining
324199|All Other Petroleum and Coal Products Manufacturing|asphalt paving roofing saturated materials lubricating oils greases refined made coke ovens integrated steel mill biodiesel fuels refineries blended purchased oven gases
325|Chemical Manufacturing|
3251|Basic Chemical Manufacturing|
32511|Petrochemical Manufacturing|
325110|Petrochemical Manufacturing|acyclic aliphatic hydrocarbons ethylene propylene butylene made refined petroleum liquid cyclic aromatic benzene toluene styrene xylene ethyl cumene
32512|Industrial Gas Manufacturing|
325120|Industrial Gas Manufacturing|organic inorganic gases compressed liquid solid forms
32513|Synthetic Dye and Pigment Manufacturing|
325130|Synthetic Dye and Pigment Manufacturing|organic inorganic dyes pigments lakes toners electrostatic photographic
32518|Other Basic Inorganic Chemical Manufacturing|
325180|Other Basic Inorganic Chemical Manufacturing|chemicals industrial gases synthetic dyes pigments alkalies aluminum compounds specified process carbides baron calcium silicon tungsten carbon black chlorine hydrochloric acid potassium
32519|Other Basic Organic Chemical Manufacturing|chemicals petrochemicals industrial gases synthetic dyes pigments biodiesel fuels made petroleum refineries blended carbon compounds specified process cyclic intermediates refined natural gas
325193|Ethyl Alcohol Manufacturing|nonpotable
325194|Cyclic Crude, Intermediate, and Gum and Wood Chemical Manufacturing|distilling tall oil distillates coal tars chemicals naval stores natural tanning materials charcoal briquettes activated crudes intermediates hydrocarbons aromatic petrochemicals refined petroleum
325199|All Other Basic Organic Chemical Manufacturing|aromatic petrochemicals industrial gases synthetic dyes pigments gum wood chemicals cyclic crudes intermediates ethyl alcohol biodiesel fuels made petroleum refineries blended calcium
3252|Resin, Synthetic Rubber, and Artificial and Synthetic Fibers and Filaments Manufacturing|
32521|Resin and Synthetic Rubber Manufacturing|resins plastics materials nonvulcanizable elastomers mixing blending custom noncustomized
325211|Plastics Material and Resin Manufacturing|resins materials nonvulcanizable thermoplastic elastomers mixing blending custom noncustomized synthetic
325212|Synthetic Rubber Manufacturing|
32522|Artificial and Synthetic Fibers and Filaments Manufacturing|
325220|Artificial and Synthetic Fibers and Filaments Manufacturing|cellulosic rayon acetate noncellulosic nylon polyolefin polyester form monofilament filament yarn staple tow texturizing
3253|Pesticide, Fertilizer, and Other Agricultural Chemical Manufacturing|
32531|Fertilizer Manufacturing|nitrogenous phosphatic materials fertilizers sewage animal waste mixing ingredients made
325311|Nitrogenous Fertilizer Manufacturing|materials mixing ingredients fertilizers sewage animal waste
325312|Phosphatic Fertilizer Manufacturing|materials mixing fertilizers
325314|Fertilizer (Mixing Only) Manufacturing|ingredients made fertilizers
32532|Pesticide and Other Agricultural Chemical Manufacturing|
325320|Pesticide and Other Agricultural Chemical Manufacturing|formulation preparation household pest control chemicals fertilizers
3254|Pharmaceutical and Medicine Manufacturing|
32541|Pharmaceutical and Medicine Manufacturing|biological medicinal processing grading grinding milling botanical drugs herbs isolating active principals intended internal external consumption forms ampoules tablets capsules vials ointments
325411|Medicinal and Botanical Manufacturing|uncompounded chemicals derivatives pharmaceutical preparation manufacturers grading grinding milling botanicals
325412|Pharmaceutical Preparation Manufacturing|in-vivo diagnostic substances preparations biological intended internal external consumption dose forms ampoules tablets capsules vials ointments powders solutions suspensions
325413|In-Vitro Diagnostic Substance Manufacturing|in-vitro taken internally substances chemical biological radioactive tests performed test tubes petri dishes machines test-type devices
325414|Biological Product (except Diagnostic) Manufacturing|vaccines toxoids blood fractions culture media plant animal origin
3255|Paint, Coating, and Adhesive Manufacturing|
32551|Paint and Coating Manufacturing|
325510|Paint and Coating Manufacturing|mixing pigments solvents binders paints coatings stains varnishes lacquers enamels shellacs water-repellent concrete masonry allied putties varnish removers brush cleaners frit
32552|Adhesive Manufacturing|
325520|Adhesive Manufacturing|adhesives glues caulking compounds
3256|Soap, Cleaning Compound, and Toilet Preparation Manufacturing|
32561|Soap and Cleaning Compound Manufacturing|packaging soaps compounds surface active agents textile leather finishing reduce tension speed drying process
325611|Soap and Other Detergent Manufacturing|packaging soaps detergents laundry dishwashing toothpaste gels tooth powders natural glycerin
325612|Polish and Other Sanitation Good Manufacturing|packaging polishes specialty cleaning preparations
325613|Surface Active Agent Manufacturing|bulk agents wetting emulsifiers penetrants textile leather finishing reduce tension speed drying process
32562|Toilet Preparation Manufacturing|
325620|Toilet Preparation Manufacturing|preparing blending compounding packaging preparations perfumes shaving hair face creams lotions sunscreens cosmetic
3259|Other Chemical Product and Preparation Manufacturing|
32591|Printing Ink Manufacturing|
325910|Printing Ink Manufacturing|inkjet inks cartridges
32592|Explosives Manufacturing|
325920|Explosives Manufacturing|
32599|All Other Chemical Product and Preparation Manufacturing|basic chemicals resins synthetic rubber cellulosic noncellulosic fibers filaments pesticides fertilizers agricultural pharmaceuticals medicines paints coatings adhesives soaps cleaning compounds toilet preparations
325991|Custom Compounding of Purchased Resins|mixing blending plastics made reformulating recycled
325992|Photographic Film, Paper, Plate, and Chemical Manufacturing|sensitized cloth plates toners photocopiers laser printers electrostatic printing devices toner cartridges chemicals
325998|All Other Miscellaneous Chemical Product and Preparation Manufacturing|basic chemicals resins synthetic rubber cellulosic noncellulosic fibers filaments pesticides fertilizers agricultural pharmaceuticals medicines paints coatings adhesives soaps cleaning compounds toilet preparations
326|Plastics and Rubber Products Manufacturing|
3261|Plastics Product Manufacturing|
32611|Plastics Packaging Materials and Unlaminated Film and Sheet Manufacturing|converting resins unsupported forming coating laminating bags
326111|Plastics Bag and Pouch Manufacturing|converting resins bags pouches forming coating laminating film sheet single-web multiweb print manufacture
326112|Plastics Packaging Film and Sheet (including Laminated) Manufacturing|converting resins flexible
326113|Unlaminated Plastics Film and Sheet (except Packaging) Manufacturing|converting resins
32612|Plastics Pipe, Pipe Fitting, and Unlaminated Profile Shape Manufacturing|pipes fittings shapes rod tube sausage casings
326121|Unlaminated Plastics Profile Shape Manufacturing|converting resins nonrigid shapes film sheet bags rod tube sausage casings
326122|Plastics Pipe and Pipe Fitting Manufacturing|converting resins rigid pipes fittings
32613|Laminated Plastics Plate, Sheet (except Packaging), and Shape Manufacturing|
326130|Laminated Plastics Plate, Sheet (except Packaging), and Shape Manufacturing|laminating profile shapes rod lamination process involves bonding impregnating profiles resins compressing heat
32614|Polystyrene Foam Product Manufacturing|
326140|Polystyrene Foam Product Manufacturing|
32615|Urethane and Other Foam Product (except Polystyrene) Manufacturing|
326150|Urethane and Other Foam Product (except Polystyrene) Manufacturing|plastics
32616|Plastics Bottle Manufacturing|
326160|Plastics Bottle Manufacturing|bottles
32619|Other Plastics Product Manufacturing|plumbing fixtures film sheet bags profile shapes pipes pipe fittings laminates foam bottles inflatable swimming pool rafts flotation devices air mattresses bottle
326191|Plastics Plumbing Fixture Manufacturing|fiberglass fixtures made bathtubs hot tubs portable toilets shower stalls
326199|All Other Plastics Product Manufacturing|film sheet bags profile shapes pipes pipe fittings laminates foam bottles plumbing fixtures inflatable swimming pool rafts flotation devices air mattresses bottle
3262|Rubber Product Manufacturing|
32621|Tire Manufacturing|tires inner tubes natural synthetic rubber retreading rebuilding
326211|Tire Manufacturing (except Retreading)|tires inner tubes natural synthetic rubber
326212|Tire Retreading|rebuilding tires
32622|Rubber and Plastics Hoses and Belting Manufacturing|
326220|Rubber and Plastics Hoses and Belting Manufacturing|hose reinforced natural synthetic resins garden purchased
32629|Other Rubber Product Manufacturing|tires hoses belting natural synthetic birth control devices diaphragms prophylactics latex foam mechanical molded extruded lathe-cut reclaiming waste scrap balloons bands floor
326291|Rubber Product Manufacturing for Mechanical Use|tubing applications processes molding extruding lathe-cutting parts motor vehicles machinery equipment
326299|All Other Rubber Product Manufacturing|tires hoses belting molded extruded lathe-cut mechanical applications tubing natural synthetic made regardless process birth control devices diaphragms prophylactics latex foam reclaiming
327|Nonmetallic Mineral Product Manufacturing|
3271|Clay Product and Refractory Manufacturing|
32711|Pottery, Ceramics, and Plumbing Fixture Manufacturing|
327110|Pottery, Ceramics, and Plumbing Fixture Manufacturing|shaping molding glazing firing fixtures electrical supplies made entirely partly clay ceramic materials bathroom accessories vitreous china earthenware ferrite permanent magnets chemical
32712|Clay Building Material and Refractories Manufacturing|
327120|Clay Building Material and Refractories Manufacturing|shaping molding baking burning hardening nonclay ceramic tile structural brick materials refractory retain shape chemical identity subjected high temperatures applications require extreme
3272|Glass and Glass Product Manufacturing|
32721|Glass and Glass Product Manufacturing|manufacture melting silica sand cullet purchased
327211|Flat Glass Manufacturing|melting silica sand cullet laminated
327212|Other Pressed and Blown Glass and Glassware Manufacturing|melting silica sand cullet making shaped packaging containers
327213|Glass Container Manufacturing|packaging containers
327215|Glass Product Manufacturing Made of Purchased Glass|coating laminating tempering shaping
3273|Cement and Concrete Product Manufacturing|
32731|Cement Manufacturing|
327310|Cement Manufacturing|portland natural masonry pozzolanic hydraulic cements calcine earths mine quarry manufacture purchase lime
32732|Ready-Mix Concrete Manufacturing|
327320|Ready-Mix Concrete Manufacturing|batch plants delivered purchaser plastic unhardened state ready-mix mine quarry purchase sand gravel
32733|Concrete Pipe, Brick, and Block Manufacturing|
327331|Concrete Block and Brick Manufacturing|
327332|Concrete Pipe Manufacturing|
32739|Other Concrete Product Manufacturing|
327390|Other Concrete Product Manufacturing|block brick pipe
3274|Lime and Gypsum Product Manufacturing|
32741|Lime Manufacturing|
327410|Lime Manufacturing|calcitic limestone dolomitic calcareous materials coral chalk shells mine quarry collect purchase sources calcium carbonate
32742|Gypsum Product Manufacturing|
327420|Gypsum Product Manufacturing|wallboard plaster plasterboard molding ornamental moldings statuary architectural work mine quarry purchase
3279|Other Nonmetallic Mineral Product Manufacturing|
32791|Abrasive Product Manufacturing|
327910|Abrasive Product Manufacturing|grinding wheels natural synthetic materials abrasive-coated aluminum oxide fused abrasives buffing polishing nonabrasive diamond dressing sandpaper silicon carbide whetstones
32799|All Other Nonmetallic Mineral Product Manufacturing|pottery plumbing fixtures clay building materials refractories glass cement ready-mix concrete lime gypsum abrasive
327991|Cut Stone and Stone Product Manufacturing|cutting shaping finishing granite marble limestone slate building miscellaneous uses mine quarry purchase
327992|Ground or Treated Mineral and Earth Manufacturing|calcining dead burning otherwise processing beyond beneficiation clays ceramic refractory minerals barite miscellaneous nonmetallic
327993|Mineral Wool Manufacturing|fiberglass insulation made siliceous materials rock slag glass combinations thereof
327999|All Other Miscellaneous Nonmetallic Mineral Product Manufacturing|pottery ceramics plumbing fixtures clay building materials refractories glass cement ready-mix concrete lime gypsum abrasive cut stone ground treated minerals earth wool
331|Primary Metal Manufacturing|
3311|Iron and Steel Mills and Ferroalloy Manufacturing|
33111|Iron and Steel Mills and Ferroalloy Manufacturing|
331110|Iron and Steel Mills and Ferroalloy Manufacturing|direct reduction ore pig molten solid form converting making shapes bar plate rod sheet strip wire forming pipe tube electrometallurgical ferroalloys add
3312|Steel Product Manufacturing from Purchased Steel|
33121|Iron and Steel Pipe and Tube Manufacturing from Purchased Steel|
331210|Iron and Steel Pipe and Tube Manufacturing from Purchased Steel|welded riveted seamless
33122|Rolling and Drawing of Purchased Steel|shapes plate sheet strip rod bar
331221|Rolled Steel Shape Manufacturing|rolling drawing shapes wire plate sheet strip rod bar purchased
331222|Steel Wire Drawing|purchased
3313|Alumina and Aluminum Production and Processing|
33131|Alumina and Aluminum Production and Processing|refining making primary recovering scrap dross alloying purchased manufacturing forms bar foil pipe plate rod sheet tube wire
331313|Alumina Refining and Primary Aluminum Production|oxide bauxite making rolling drawing extruding casting make forms aluminum-based alloys cross-references
331314|Secondary Smelting and Alloying of Aluminum|recovering alloys scrap dross making billet ingot rolling manufacturing powder paste flake purchased
331315|Aluminum Sheet, Plate, and Foil Manufacturing|flat rolling continuous casting welded tube purchased recovering scrap integrated mills
331318|Other Aluminum Rolling, Drawing, and Extruding|shapes flat rolled sheet plate foil welded tube purchased recovering scrap integrated mills bar made nails wire plants rod structural bare
3314|Nonferrous Metal (except Aluminum) Production and Processing|
33141|Nonferrous Metal (except Aluminum) Smelting and Refining|
331410|Nonferrous Metal (except Aluminum) Smelting and Refining|ores metals primary electrolytic methods processes
33142|Copper Rolling, Drawing, Extruding, and Alloying|
331420|Copper Rolling, Drawing, Extruding, and Alloying|recovering alloys scraps purchased shapes bar plate sheet strip tube wire scrap
33149|Nonferrous Metal (except Copper and Aluminum) Rolling, Drawing, Extruding, and Alloying|recovering metals alloys scrap purchased shapes integrated facilities
331491|Nonferrous Metal (except Copper and Aluminum) Rolling, Drawing, and Extruding|shapes bar plate sheet strip tube purchased metals recovering scrap integrated mills
331492|Secondary Smelting, Refining, and Alloying of Nonferrous Metal (except Copper and Aluminum)|purchased metals recovering scrap make primary forms bar billet bloom cake ingot slab slug wire processes
3315|Foundries|
33151|Ferrous Metal Foundries|pouring molten iron steel molds desired shape make castings purchase made
331511|Iron Foundries|pouring molten pig alloys molds manufacture castings cast manhole covers pipe skillets purchase made
331512|Steel Investment Foundries|manufacturing castings molds formed covering wax shape refractory slurry after hardens melted leaving seamless mold highly detailed consistent purchase made
331513|Steel Foundries (except Investment)|manufacturing castings purchase made
33152|Nonferrous Metal Foundries|pouring introducing molten high pressure molds dies manufacture castings purchase metals made
331523|Nonferrous Metal Die-Casting Foundries|introducing molten high pressure molds dies make die-castings purchase metals made cross-references
331524|Aluminum Foundries (except Die-Casting)|pouring molten molds manufacture castings nonferrous die-castings purchase made
331529|Other Nonferrous Metal Foundries (except Die-Casting)|pouring molten metals aluminum molds manufacture castings die-castings purchase copper nickel lead zinc made cross-references
332|Fabricated Metal Product Manufacturing|
3321|Forging and Stamping|
33211|Forging and Stamping|manufacturing forgings purchased metals metal custom roll forming stamped spun automotive cans coins powder metallurgy making stampings further machining assembling specific manufactured
332111|Iron and Steel Forging|manufacturing forgings purchased hammering mill shapes making further machining assembling specific manufactured finished perform surface finishing cleaning deburring manufacture
332112|Nonferrous Forging|manufacturing forgings purchased metals hammering mill shapes making further machining assembling specific manufactured finished perform surface finishing cleaning deburring manufacture
332114|Custom Roll Forming|metal rotary motion rolls contours bend shape
332117|Powder Metallurgy Part Manufacturing|processing techniques pressing sintering metal injection molding make wide range parts job order
332119|Metal Crown, Closure, and Other Metal Stamping (except Automotive)|crowns closures bottle caps home canning lids rings manufacturing unfinished stampings spinning cans coins making spun further machining assembling specific finished perform
3322|Cutlery and Handtool Manufacturing|
33221|Cutlery and Handtool Manufacturing|metal kitchen cookware casting cast iron skillets stamped further fabrication utensils nonprecious precious plated flatware saw blades power sawing machines nonpowered handtools
332215|Metal Kitchen Cookware, Utensil, Cutlery, and Flatware (except Precious) Manufacturing|casting cast iron skillets stamped further fabrication utensils nonprecious plated
332216|Saw Blade and Handtool Manufacturing|blades power sawing machines nonpowered handtools edge tools
3323|Architectural and Structural Metals Manufacturing|
33231|Plate Work and Fabricated Structural Product Manufacturing|prefabricated metal buildings panels sections
332311|Prefabricated Metal Building and Component Manufacturing|buildings panels sections
332312|Fabricated Structural Metal Manufacturing|fabricating assemblies concrete reinforcing bars bar joists
332313|Plate Work Manufacturing|fabricated metal cutting punching bending shaping welding purchased
33232|Ornamental and Architectural Metal Products Manufacturing|framed windows typically purchased glass doors sheet work
332321|Metal Window and Door Manufacturing|framed windows typically purchased glass doors made frames screens molding trim automotive
332322|Sheet Metal Work Manufacturing|stampings
332323|Ornamental and Architectural Metal Work Manufacturing|staircases open steel flooring fire escapes railings scaffolding
3324|Boiler, Tank, and Shipping Container Manufacturing|
33241|Power Boiler and Heat Exchanger Manufacturing|
332410|Power Boiler and Heat Exchanger Manufacturing|boilers exchangers perform installation addition
33242|Metal Tank (Heavy Gauge) Manufacturing|
332420|Metal Tank (Heavy Gauge) Manufacturing|cutting forming joining manufacture tanks vessels containers
33243|Metal Can, Box, and Other Metal Container (Light Gauge) Manufacturing|forming containers
332431|Metal Can Manufacturing|cans lids ends
332439|Other Metal Container Manufacturing|light gauge containers cans bins drums garbage lunch boxes mailboxes tool vats air cargo barrels vacuum bottles jugs
3325|Hardware Manufacturing|
33251|Hardware Manufacturing|
332510|Hardware Manufacturing|metal hinges handles keys locks coin-operated time
3326|Spring and Wire Product Manufacturing|
33261|Spring and Wire Product Manufacturing|steel springs forming cutting bending heat winding metal rod strip stock fabricated drawn watch clock
332613|Spring Manufacturing|springs purchased wire strip rod
332618|Other Fabricated Wire Product Manufacturing|springs made purchased barbed chain link fencing fence gates metal baskets nails brads staples noninsulated cable paper clips woven cloth
3327|Machine Shops; Turned Product; and Screw, Nut, and Bolt Manufacturing|
33271|Machine Shops|
332710|Machine Shops|machining metal plastic parts composite materials job order shop jobs low volume tools lathes computer numerically controlled automatic screw machines boring grinding
33272|Turned Product and Screw, Nut, and Bolt Manufacturing|machining precision metal bolts nuts screws rivets industrial fasteners parts machinery equipment custom
332721|Precision Turned Product Manufacturing|manufacturers machining materials job order jobs large volume machines automatic screw rotary transfer computer numerically controlled cnc lathes turning centers
332722|Bolt, Nut, Screw, Rivet, and Washer Manufacturing|metal bolts nuts screws rivets washers industrial fasteners machines headers threaders forming
3328|Coating, Engraving, Heat Treating, and Allied Activities|
33281|Coating, Engraving, Heat Treating, and Allied Activities|metals metal enameling lacquering varnishing hot dip galvanizing chasing etching jewelry personal carried about person compacts cigarette cases precious plated flatware ware
332811|Metal Heat Treating|annealing tempering brazing cryogenically metals trade
332812|Metal Coating, Engraving (except Jewelry and Silverware), and Allied Services to Manufacturers|enameling lacquering varnishing metals hot dip galvanizing chasing etching personal carried about person compacts cigarette cases precious plated flatware ware printing plates
332813|Electroplating, Plating, Polishing, Anodizing, and Coloring|buffing cleaning sandblasting metals metal trade perform processes materials plastics addition
3329|Other Fabricated Metal Product Manufacturing|
33291|Metal Valve Manufacturing|valves industrial fluid power hose fittings plumbing fixture trim pipe
332911|Industrial Valve Manufacturing|valves water works municipal systems complete fire hydrants industrial-type ball butterfly check gate globe plug solenoid fluid power steam traps nuclear applications
332912|Fluid Power Valve and Hose Fitting Manufacturing|valves fittings aircraft subassemblies assemblies systems hydraulic pneumatic tube
332913|Plumbing Fixture Fitting and Trim Manufacturing|metal plastics fittings faucets flush valves shower heads
332919|Other Metal Valve and Pipe Fitting Manufacturing|valves industrial fluid power hose fittings plumbing fixture trim aerosol firefighting nozzles lawn sprinklers couplings flanges flange unions heating inline check cutoff
33299|All Other Fabricated Metal Product Manufacturing|forgings stampings cutlery handtools architectural structural boilers tanks shipping containers hardware spring wire machine shop turned screws nuts bolts valves ammunition ball
332991|Ball and Roller Bearing Manufacturing|bearings materials
332992|Small Arms Ammunition Manufacturing|
332993|Ammunition (except Small Arms) Manufacturing|made bombs depth charges rockets guided missiles grenades mines torpedoes
332994|Small Arms, Ordnance, and Ordnance Accessories Manufacturing|
332996|Fabricated Pipe and Pipe Fitting Manufacturing|fabricating cutting threading bending metal pipes fittings made purchased
332999|All Other Miscellaneous Fabricated Metal Product Manufacturing|forgings stampings cutlery handtools architectural structural metals boilers tanks shipping containers hardware spring wire machine shop turned screws nuts bolts valves ball
333|Machinery Manufacturing|
3331|Agriculture, Construction, and Mining Machinery Manufacturing|
33311|Agricultural Implement Manufacturing|farm machinery equipment powered mowing home lawn garden combines harvester-threshers cotton ginning fertilizing farm-type haying machines milking planting plows poultry brooders feeders
333111|Farm Machinery and Equipment Manufacturing|agricultural turf grounds care planting harvesting grass mowing lawn garden-type combines harvester-threshers cotton ginning feed processing farm-type fertilizing garden haying machines milking
333112|Lawn and Garden Tractor and Home Lawn and Garden Equipment Manufacturing|powered lawnmowers tractors tillers shredders yard vacuums leaf blowers
33312|Construction Machinery Manufacturing|
333120|Construction Machinery Manufacturing|surface mining logging equipment backhoes bulldozers mining-type rock drill bits construction-type tractors attachments off-highway trucks pile-driving portable crushing pulverizing screening powered post
33313|Mining and Oil and Gas Field Machinery Manufacturing|underground equipment coal breakers cutters pulverizers core drills mining-type mineral processing beneficiating cars field-type derricks drilling offshore floating platforms stationary rock crushing
333131|Mining Machinery and Equipment Manufacturing|underground coal breakers cars core drills cutters rock mineral beneficiating surface mines
333132|Oil and Gas Field Machinery and Equipment Manufacturing|drilling production derricks water
3332|Industrial Machinery Manufacturing|
33324|Industrial Machinery Manufacturing|food beverage semiconductor sawmill woodworking handheld making paper printing binding equipment textile plastics rubber
333241|Food Product Machinery Manufacturing|beverage manufacturing-type equipment dairy plant homogenizers pasteurizers ice cream freezers bakery dough mixers bake ovens pastry rolling machines meat poultry processing preparation
333242|Semiconductor Machinery Manufacturing|wafer processing equipment assembly packaging making
333243|Sawmill, Woodworking, and Paper Machinery Manufacturing|handheld circular band sawing equipment planing sanding making pulp paperboard converting
333244|Printing Machinery and Equipment Manufacturing|bookbinding presses typesetting bindery
333249|Other Industrial Machinery Manufacturing|agricultural farm-type construction mining food manufacturing-type semiconductor making sawmill woodworking paper printing equipment additive chemical processing cigarette glass blowing forming molding petroleum
3333|Commercial and Service Industry Machinery Manufacturing|
33331|Commercial and Service Industry Machinery Manufacturing|optical instruments photographic photocopying equipment automatic vending laundry drycleaning office automotive maintenance mechanics handtools commercial-type cooking
333314|Optical Instrument and Lens Manufacturing|instruments lenses binoculars microscopes electron proton telescopes prisms ophthalmic coating polishing mounting
333316|Photographic and Photocopying Equipment Manufacturing|cameras television video projectors film developing microfilm
333318|Other Commercial and Service Industry Machinery Manufacturing|equipment optical instruments lenses photographic photocopying calculators carnival amusement park rides car washing commercial-type coffee makers urns cooking fryers microwave ovens ranges
3334|Ventilation, Heating, Air-Conditioning, and Commercial Refrigeration Equipment Manufacturing|
33341|Ventilation, Heating, Air-Conditioning, and Commercial Refrigeration Equipment Manufacturing|ventilating air-conditioning industrial freezer air-conditioner filters warm units attic fans dust fume collecting gas fireplaces boilers commercial-type refrigerated counter display cases drinking
333413|Industrial and Commercial Fan and Blower and Air Purification Equipment Manufacturing|stationary dust fume collection electrostatic precipitation warm furnace filters washers attic fans blowers exhaust ventilating
333414|Heating Equipment (except Warm Air Furnaces) Manufacturing|electric boilers stoves floor wall baseboard units
333415|Air-Conditioning and Warm Air Heating Equipment and Commercial and Industrial Refrigeration Equipment Manufacturing|air-conditioning motor vehicle furnace freezer units compressors condensers condensing dehumidifiers portable electric heat pumps humidifying refrigerated counter display cases drinking fountains snow
3335|Metalworking Machinery Manufacturing|
33351|Metalworking Machinery Manufacturing|metal cutting forming machine tools accessories special dies jigs fixtures industrial molds rolling mill assembly coil handling conversion straightening equipment wire drawing
333511|Industrial Mold Manufacturing|molds casting metals forming materials plastics glass rubber
333514|Special Die and Tool, Die Set, Jig, and Fixture Manufacturing|shops tools fixtures cutting dies jigs
333515|Cutting Tool and Machine Tool Accessory Manufacturing|accessories attachments metal forming tools knives bits metalworking lathes planers shapers measuring sine bars drill taps dies
333517|Machine Tool Manufacturing|metal cutting tools handtools forming punching sheering bending pressing forging die-casting machines metalworking buffing polishing drilling grinding home workshop welding equipment lathes
333519|Rolling Mill and Other Metalworking Machinery Manufacturing|equipment industrial molds special dies tools die sets jigs fixtures cutting machine tool accessories assembly machines cradle assemblies wire making coil winding
3336|Engine, Turbine, and Power Transmission Equipment Manufacturing|
33361|Engine, Turbine, and Power Transmission Equipment Manufacturing|turbines internal combustion engines automotive gasoline aircraft clutches brakes electromagnetic industrial controls motor vehicle diesel semidiesel electric outboard motors hybrid drive systems
333611|Turbine and Turbine Generator Set Units Manufacturing|turbines aircraft complete steam hydraulic gas wind
333612|Speed Changer, Industrial High-Speed Drive, and Gear Manufacturing|gears changers high-speed drives hydrostatic
333613|Mechanical Power Transmission Equipment Manufacturing|motor vehicle aircraft plain bearings clutches electromagnetic industrial control couplings joints drive chains
333618|Other Engine Equipment Manufacturing|internal combustion engines automotive gasoline aircraft
3339|Other General Purpose Machinery Manufacturing|
33391|Pump and Compressor Manufacturing|pumps compressors general purpose air gas nonagricultural spraying dusting equipment pumping fluid power motors measuring dispensing
333912|Air and Gas Compressor Manufacturing|general purpose compressors reciprocating centrifugal vacuum pumps laboratory nonagricultural spraying dusting spray gun units
333914|Measuring, Dispensing, and Other Pumping Equipment Manufacturing|pumps gasoline lubricating oil general purpose fluid power motors reciprocating turbine centrifugal rotary diaphragm domestic water system field sump
33392|Material Handling Equipment Manufacturing|elevators moving stairs conveyors conveying overhead traveling cranes hoists monorail systems industrial trucks tractors trailers stacker machinery
333921|Elevator and Moving Stairway Manufacturing|elevators stairways automobile lifts garage-type station escalators walkways passenger freight
333922|Conveyor and Conveying Equipment Manufacturing|conveyors gravity trolley tow pneumatic tube carousel farm belt
333923|Overhead Traveling Crane, Hoist, and Monorail System Manufacturing|cranes hoists systems aerial work platforms automobile wrecker tow truck block tackle metal pulleys power transmission winches
333924|Industrial Truck, Tractor, Trailer, and Stacker Machinery Manufacturing|trucks tractors trailers stackers truck-type forklifts pallet loaders unloaders portable loading docks
33399|All Other General Purpose Machinery Manufacturing|ventilation heating air-conditioning commercial refrigeration equipment metalworking engines turbines power transmission pumps compressors material handling automatic fire sprinkler systems bridge gate lifting
333991|Power-Driven Handtool Manufacturing|power-driven battery corded pneumatic handtools drills screwguns circular saws chain staplers nailers
333992|Welding and Soldering Equipment Manufacturing|accessories transformers arc resistance gas plasma laser electron beam ultrasonic electrodes coated cored wire handheld
333993|Packaging Machinery Manufacturing|wrapping bottling canning labeling
333994|Industrial Process Furnace and Oven Manufacturing|ovens induction dielectric heating equipment kilns cement chemical wood laboratory furnaces
333995|Fluid Power Cylinder and Actuator Manufacturing|hydraulic pneumatic cylinders actuators
333996|Fluid Power Pump and Motor Manufacturing|hydraulic pneumatic pumps motors
333997|Scale and Balance Manufacturing|scales balances laboratories
333999|All Other Miscellaneous General Purpose Machinery Manufacturing|ventilating heating air-conditioning commercial refrigeration equipment metalworking engines turbines power transmission pumps compressors material handling power-driven handtools welding soldering packaging industrial process
334|Computer and Electronic Product Manufacturing|
3341|Computer and Peripheral Equipment Manufacturing|
33411|Computer and Peripheral Equipment Manufacturing|assembling electronic computers mainframes personal workstations laptops servers storage devices printers monitors input output terminals analog digital hybrid common store processing program
334111|Electronic Computer Manufacturing|assembling computers mainframes personal workstations laptops servers analog digital hybrid common devices store processing program programs data immediately necessary execution freely programmed
334112|Computer Storage Device Manufacturing|devices allow retrieval data phase change magnetic optical media made cd-rom drives floppy disk hard tape backup units
334118|Computer Terminal and Other Computer Peripheral Equipment Manufacturing|terminals storage devices automatic teller machines atm joystick keyboards monitors mouse optical readers scanners plotters point-of-sale printers
3342|Communications Equipment Manufacturing|
33421|Telephone Apparatus Manufacturing|
334210|Telephone Apparatus Manufacturing|wire data communications equipment stand-alone board-level components larger system made central office switching cordless telephones cellular pbx answering machines lan modems multi-user
33422|Radio and Television Broadcasting and Wireless Communications Equipment Manufacturing|
334220|Radio and Television Broadcasting and Wireless Communications Equipment Manufacturing|broadcast made transmitting receiving antennas cable gps pagers cellular phones mobile studio
33429|Other Communications Equipment Manufacturing|
334290|Other Communications Equipment Manufacturing|telephone apparatus radio television broadcast wireless fire detection alarm systems intercom signals highway pedestrian railway traffic video-based stadium displays
3343|Audio and Video Equipment Manufacturing|
33431|Audio and Video Equipment Manufacturing|
334310|Audio and Video Equipment Manufacturing|electronic home entertainment motor vehicles public address musical instrument amplification made digital recorders televisions stereo speaker systems household-type cameras jukeboxes amplifiers instruments
3344|Semiconductor and Other Electronic Component Manufacturing|
33441|Semiconductor and Other Electronic Component Manufacturing|semiconductors components applications made capacitors resistors microprocessors bare loaded printed circuit boards electron tubes connectors computer modems
334412|Bare Printed Circuit Board Manufacturing|rigid flexible boards mounted electronic components print perforate plate screen etch photoprint interconnecting pathways electric current laminates
334413|Semiconductor and Related Device Manufacturing|semiconductors solid-state devices made integrated circuits memory chips microprocessors diodes transistors solar cells optoelectronic
334416|Capacitor, Resistor, Coil, Transformer, and Other Inductor Manufacturing|electronic fixed variable capacitors condensers resistors networks thermistors varistors inductors coils transformers
334417|Electronic Connector Manufacturing|connectors coaxial cylindrical rack panel pin sleeve printed circuit fiber optic
334418|Printed Circuit Assembly (Electronic Assembly) Manufacturing|loading components onto boards manufacture ship loaded assemblies electronics modules semiconductor inserted mounted inputs wide systems devices
334419|Other Electronic Component Manufacturing|components bare printed circuit boards semiconductors devices capacitors resistors coils transformers inductors connectors loaded crystals crystal assemblies electron tubes lcd liquid display
3345|Navigational, Measuring, Electromedical, and Control Instruments Manufacturing|
33451|Navigational, Measuring, Electromedical, and Control Instruments Manufacturing|made aeronautical appliance regulators controls switches laboratory analytical navigation guidance systems physical properties testing equipment
334510|Electromedical and Electrotherapeutic Apparatus Manufacturing|magnetic resonance imaging equipment medical ultrasound pacemakers hearing aids electrocardiographs endoscopic
334511|Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing|systems instruments made aircraft engine flight recorders navigational radar equipment sonar
334512|Automatic Environmental Control Manufacturing for Residential, Commercial, and Appliance Use|controls regulators applications heating air-conditioning refrigeration appliances
334513|Instruments and Related Products Manufacturing for Measuring, Displaying, and Controlling Industrial Process Variables|devices indicating recording transmitting measure display control monitor analyze forth temperature humidity pressure vacuum combustion flow level viscosity density acidity concentration rotation
334514|Totalizing Fluid Meter and Counting Device Manufacturing|registering meters devices made gas consumption water parking taxi motor vehicle gauges fare collection equipment
334515|Instrument Manufacturing for Measuring and Testing Electricity and Electrical Signals|instruments characteristics made circuit continuity testers voltmeters ohm meters wattmeters multimeters semiconductor test equipment
334516|Analytical Laboratory Instrument Manufacturing|instruments instrumentation systems analysis chemical physical composition concentration samples solid fluid gaseous composite material
334517|Irradiation Apparatus Manufacturing|tubes applications medical diagnostic therapeutic industrial research scientific evaluation take form beta-rays gamma-rays x-rays ionizing radiation
334519|Other Measuring and Controlling Device Manufacturing|devices search detection navigation guidance aeronautical nautical instruments systems automatic environmental controls residential commercial appliance measurement display control industrial process variables totalizing
3346|Manufacturing and Reproducing Magnetic and Optical Media|
33461|Manufacturing and Reproducing Magnetic and Optical Media|blank audio tapes video diskettes mass duplicating making copies software data
334613|Blank Magnetic and Optical Recording Media Manufacturing|tape diskettes discs hard drive cassettes
334614|Software and Other Prerecorded Compact Disc, Tape, and Record Reproducing|mass computer audio video material magnetic optical media cd-roms dvds tapes cartridges develop produce content reproduce game cds
335|Electrical Equipment, Appliance, and Component Manufacturing|
3351|Electric Lighting Equipment Manufacturing|
33511|Electric Lamp Bulb and Part Manufacturing|
335110|Electric Lamp Bulb and Part Manufacturing|light bulbs tubes parts components glass blanks
33512|Lighting Fixture Manufacturing|electric fixtures vehicular nonelectric equipment lamp shades glass plastics components current-carrying wiring devices
335121|Residential Electric Lighting Fixture Manufacturing|fixed portable fixtures lamp shades metal paper textiles inside outside residence ceiling chandeliers table lamps
335122|Commercial, Industrial, and Institutional Electric Lighting Fixture Manufacturing|fixtures
335129|Other Lighting Equipment Manufacturing|electric fixtures residential commercial industrial institutional vehicular nonelectric christmas tree sets fireplace logs flashlights insect lamps lanterns carbide gas gasoline kerosene spotlights
3352|Household Appliance Manufacturing|
33521|Small Electrical Appliance Manufacturing|
335210|Small Electrical Appliance Manufacturing|electric appliances housewares household-type fans attic vacuum cleaners floor care machines bath residential carpet cleaning equipment ceiling curling irons blankets portable cooking
33522|Major Household Appliance Manufacturing|
335220|Major Household Appliance Manufacturing|household-type cooking appliances laundry equipment refrigerators upright chest freezers electrical nonelectrical dishwashers water heaters garbage disposal units
3353|Electrical Equipment Manufacturing|
33531|Electrical Equipment Manufacturing|power distribution specialty transformers electric motors generators motor generator sets switchgear switchboard apparatus relays industrial controls
335311|Power, Distribution, and Specialty Transformer Manufacturing|transformers electronic components industrial-type consumer-type vary step down voltage convert alternating direct current electric fluorescent ballasts substation transmission regulators
335312|Motor and Generator Manufacturing|electric motors internal combustion engine starting power generators battery charging alternators engines sets turbine set units rewinding armatures factory
335313|Switchgear and Switchboard Apparatus Manufacturing|circuit breakers power control panels electric distribution ducts electrical fuses switching equipment switches pushbutton snap solenoid tumbler
335314|Relay and Industrial Control Manufacturing|relays motor starters controllers controls accessories
3359|Other Electrical Equipment and Component Manufacturing|
33591|Battery Manufacturing|primary storage batteries
335911|Storage Battery Manufacturing|batteries lead acid lithium rechargeable nickel-cadmium nicad
335912|Primary Battery Manufacturing|wet dry batteries disposable flashlight cells aaa lithium watch
33592|Communication and Energy Wire and Cable Manufacturing|insulating fiber optic insulated nonferrous drawn
335921|Fiber Optic Cable Manufacturing|insulated purchased strand
335929|Other Communication and Energy Wire Manufacturing|insulated cable nonferrous metals purchased
33593|Wiring Device Manufacturing|current-carrying devices noncurrent-carrying electrical circuits
335931|Current-Carrying Wiring Device Manufacturing|current-carrying devices bus bars electrical conductors switchgear-type gfci ground fault circuit interrupters lamp holders lightning arrestors coils receptacles outlets switches pressure pushbutton
335932|Noncurrent-Carrying Wiring Device Manufacturing|noncurrent-carrying devices boxes electrical junction outlet switch conduits fittings face plates covers transmission pole line hardware
33599|All Other Electrical Equipment and Component Manufacturing|electric lighting household-type appliances transformers motors generators switchgear relays industrial controls batteries communication energy wire cable wiring devices carbon graphite electrodes brushes
335991|Carbon and Graphite Product Manufacturing|metal-graphite brushes brush stock electrodes thermal electrolytic uses fibers
335999|All Other Miscellaneous Electrical Equipment and Component Manufacturing|industrial commercial electric apparatus lighting household appliances transformers motors generators switchgear relays controls batteries communication energy wire cable wiring devices carbon graphite
336|Transportation Equipment Manufacturing|
3361|Motor Vehicle Manufacturing|
33611|Automobile and Light Duty Motor Vehicle Manufacturing|complete vehicles body chassis unibody
336111|Automobile Manufacturing|complete automobiles body chassis unibody
336112|Light Truck and Utility Vehicle Manufacturing|complete trucks vehicles body chassis made duty vans pick-up minivans sport
33612|Heavy Duty Truck Manufacturing|
336120|Heavy Duty Truck Manufacturing|chassis assembling complete trucks buses motor homes special purpose vehicles highway
3362|Motor Vehicle Body and Trailer Manufacturing|
33621|Motor Vehicle Body and Trailer Manufacturing|bodies cabs truck automobile utility trailers chassis detachable made sold separately assembled purchased complete vehicles homes units living quarters contained integrated unit
336211|Motor Vehicle Body Manufacturing|truck bus bodies cabs automobile made sold separately assembled purchased chassis complete vehicles
336212|Truck Trailer Manufacturing|trailers chassis cargo container detachable bodies sale separately
336213|Motor Home Manufacturing|homes purchased chassis conversion vans assembly line units living quarters integrated unit
336214|Travel Trailer and Camper Manufacturing|trailers campers designed attach motor vehicles pick-up coaches caps covers mounting trucks automobile utility light-truck towed unit light truck transporter single car
3363|Motor Vehicle Parts Manufacturing|
33631|Motor Vehicle Gasoline Engine and Engine Parts Manufacturing|
336310|Motor Vehicle Gasoline Engine and Engine Parts Manufacturing|rebuilding engines carburetors pistons piston rings valves whether vehicular crankshaft assemblies automotive truck cylinder heads fuel injection systems hybrid vehicles manifolds intake
33632|Motor Vehicle Electrical and Electronic Equipment Manufacturing|
336320|Motor Vehicle Electrical and Electronic Equipment Manufacturing|rebuilding vehicles internal combustion engines made transportation aircraft automobiles trucks trains ships stationary engine applications alternators generators automotive lighting fixtures coils ignition
33633|Motor Vehicle Steering and Suspension Components (except Spring) Manufacturing|
336330|Motor Vehicle Steering and Suspension Components (except Spring) Manufacturing|rebuilding mechanisms springs power pumps rack pinion assemblies shock absorbers automotive truck bus columns wheels struts
33634|Motor Vehicle Brake System Manufacturing|
336340|Motor Vehicle Brake System Manufacturing|rebuilding systems components cylinders master wheel automotive truck bus drums hose assemblies pads shoes calipers
33635|Motor Vehicle Transmission and Power Train Parts Manufacturing|
336350|Motor Vehicle Transmission and Power Train Parts Manufacturing|rebuilding transmissions automatic automotive truck bus axle bearings constant velocity joints differential rear assemblies torque converters universal
33636|Motor Vehicle Seating and Interior Trim Manufacturing|
336360|Motor Vehicle Seating and Interior Trim Manufacturing|seats seat frames belts trimmings
33637|Motor Vehicle Metal Stamping|
336370|Motor Vehicle Metal Stamping|manufacturing stampings fenders tops body parts trim molding
33639|Other Motor Vehicle Parts Manufacturing|
336390|Other Motor Vehicle Parts Manufacturing|rebuilding accessories gasoline engines engine electrical electronic equipment steering suspension components brake systems transmissions power train seating interior trim stampings air bag
3364|Aerospace Product and Parts Manufacturing|
33641|Aerospace Product and Parts Manufacturing|complete aircraft missiles space vehicles engines propulsion units auxiliary equipment developing making prototypes conversion modifications systems overhaul rebuilding periodic restoration original design
336411|Aircraft Manufacturing|assembling complete developing making prototypes conversion modifications systems overhaul rebuilding periodic restoration original design specifications
336412|Aircraft Engine and Engine Parts Manufacturing|engines developing making prototypes propulsion system conversion modifications systems overhaul rebuilding periodic restoration original design specifications
336413|Other Aircraft Parts and Auxiliary Equipment Manufacturing|engines fluid power subassemblies developing making prototypes crop dusting apparatus armament racks inflight refueling external fuel tanks
336414|Guided Missile and Space Vehicle Manufacturing|complete missiles vehicles developing making prototypes
336415|Guided Missile and Space Vehicle Propulsion Unit and Propulsion Unit Parts Manufacturing|units developing making prototypes
336419|Other Guided Missile and Space Vehicle Parts and Auxiliary Equipment Manufacturing|propulsion units unit developing making prototypes
3365|Railroad Rolling Stock Manufacturing|
33651|Railroad Rolling Stock Manufacturing|
336510|Railroad Rolling Stock Manufacturing|rebuilding locomotives locomotive frames parts street rapid transit cars car equipment rails freight passenger rail layers ballast distributors tamping railway track maintenance
3366|Ship and Boat Building|
33661|Ship and Boat Building|shipyards yards manufacturing facilities fixed drydocks fabrication equipment capable defined watercraft typically suitable intended personal recreational boats construction ships repair conversion alteration
336611|Ship Building and Repairing|shipyards fixed facilities drydocks fabrication equipment capable defined watercraft typically suitable intended personal recreational construction ships repair conversion alteration production prefabricated barge
336612|Boat Building|boats defined watercraft built shipyards typically suitable intended personal manufacture heavy-duty inflatable rubber plastic ribs dinghy manufacturing motorboats inboard outboard rigid rowboats
3369|Other Transportation Equipment Manufacturing|
33699|Other Transportation Equipment Manufacturing|motorcycles bicycles metal tricycles complete military armored vehicles tanks self-propelled weapons pulled draft animals motor boats ships railroad rolling stock aerospace parts
336991|Motorcycle, Bicycle, and Parts Manufacturing|motorcycles bicycles tricycles equipment
336992|Military Armored Vehicle, Tank, and Tank Component Manufacturing|complete vehicles combat tanks specialized components self-propelled weapons
336999|All Other Transportation Equipment Manufacturing|motor vehicles vehicle parts boats ships railroad rolling stock aerospace motorcycles bicycles armored tanks all-terrain atvs wheeled tracked animal-drawn gocarts children golf
337|Furniture and Related Product Manufacturing|
3371|Household and Institutional Furniture and Kitchen Cabinet Manufacturing|
33711|Wood Kitchen Cabinet and Countertop Manufacturing|
337110|Wood Kitchen Cabinet and Countertop Manufacturing|plastics laminated cabinets bathroom vanities countertops freestanding counters made stock custom
33712|Household and Institutional Furniture Manufacturing|household-type public building library school theater church manufacture general purpose hospital laboratory dental stools tables benches made stock custom assembled unassembled knockdown
337121|Upholstered Household Furniture Manufacturing|household-type made stock custom
337122|Nonupholstered Wood Household Furniture Manufacturing|household-type freestanding cabinets television stereo sewing machine made stock custom assembled unassembled knockdown
337124|Metal Household Furniture Manufacturing|household-type freestanding cabinets made stock custom assembled unassembled knockdown
337125|Household Furniture (except Wood and Metal) Manufacturing|household-type materials plastics reed rattan wicker fiberglass made stock custom assembled unassembled knockdown
337127|Institutional Furniture Manufacturing|institutional-type library school theater church general purpose hospital laboratory dental tables stools benches made stock custom assembled unassembled knockdown
3372|Office Furniture (including Fixtures) Manufacturing|
33721|Office Furniture (including Fixtures) Manufacturing|store made stock custom assembled unassembled knockdown
337211|Wood Office Furniture Manufacturing|office-type made stock custom assembled unassembled knockdown
337212|Custom Architectural Woodwork and Millwork Manufacturing|designed interiors consisting fixtures utilizing wood plastics laminates output made individual order job shop requires skilled craftsmen labor input display gondolas wall
337214|Office Furniture (except Wood) Manufacturing|nonwood office-type made stock custom assembled unassembled knockdown
337215|Showcase, Partition, Shelving, and Locker Manufacturing|wood nonwood office store fixtures lockers frames partitions fabricated materials plastics laminated fixture tops made stock custom assembled unassembled knockdown exclusively making
3379|Other Furniture Related Product Manufacturing|
33791|Mattress Manufacturing|
337910|Mattress Manufacturing|innerspring box spring noninnerspring mattresses waterbeds
33792|Blind and Shade Manufacturing|
337920|Blind and Shade Manufacturing|venetian blinds window shades curtain drapery rods poles fixtures made stock custom material
339|Miscellaneous Manufacturing|
3391|Medical Equipment and Supplies Manufacturing|
33911|Medical Equipment and Supplies Manufacturing|made surgical instruments appliances dental orthodontic ophthalmic dentures
339112|Surgical and Medical Instrument Manufacturing|ophthalmic veterinary instruments apparatus electrotherapeutic electromedical irradiation made syringes hypodermic needles anesthesia blood transfusion equipment catheters clamps thermometers
339113|Surgical Appliance and Supplies Manufacturing|appliances made orthopedic devices prosthetic dressings crutches sutures personal industrial safety protective eyewear hospital beds room tables
339114|Dental Equipment and Supplies Manufacturing|laboratories offices dentists chairs instrument delivery systems hand instruments impression material cements
339115|Ophthalmic Goods Manufacturing|made prescription eyeglasses manufactured retail setting contact lenses sunglasses eyeglass frames reading glasses standard powers protective eyewear
339116|Dental Laboratories|manufacturing dentures crowns bridges orthodontic appliances customized individual application
3399|Other Miscellaneous Manufacturing|
33991|Jewelry and Silverware Manufacturing|
339910|Jewelry and Silverware Manufacturing|engraving chasing etching metal personal small articles carried about person compacts cigarette cases precious solid clad pewter flatware hollowware stamping coins unassembled
33992|Sporting and Athletic Goods Manufacturing|
339920|Sporting and Athletic Goods Manufacturing|apparel footwear
33993|Doll, Toy, and Game Manufacturing|
339930|Doll, Toy, and Game Manufacturing|complete dolls parts clothes action figures toys games electronic hobby kits children vehicles metal bicycles tricycles
33994|Office Supplies (except Paper) Manufacturing|
339940|Office Supplies (except Paper) Manufacturing|made pens pencils felt tip markers crayons chalk pencil sharpeners staplers modeling clay hand operated stamps stamp pads stencils carbon inked ribbons
33995|Sign Manufacturing|
339950|Sign Manufacturing|signs displays materials printing paper paperboard notices
33999|All Other Miscellaneous Manufacturing|medical equipment supplies jewelry flatware sporting athletic dolls toys games office paper signs artificial christmas trees burial caskets cases candles coin-operated amusement
339991|Gasket, Packing, and Sealing Device Manufacturing|gaskets devices materials
339992|Musical Instrument Manufacturing|instruments toys
339993|Fastener, Button, Needle, and Pin Manufacturing|fasteners buttons needles pins buckles made precious metals semiprecious stones gems
339994|Broom, Brush, and Mop Manufacturing|brooms mops brushes
339995|Burial Casket Manufacturing|caskets cases vaults concrete
339999|All Other Miscellaneous Manufacturing|medical equipment supplies jewelry flatware sporting athletic dolls toys games office paper musical instruments fasteners buttons needles pins brooms brushes mops burial
42|Wholesale Trade|
423|Merchant Wholesalers, Durable Goods|
4231|Motor Vehicle and Motor Vehicle Parts and Supplies Merchant Wholesalers|
42311|Automobile and Other Motor Vehicle Merchant Wholesalers|
423110|Automobile and Other Motor Vehicle Merchant Wholesalers|wholesale distribution passenger automobiles trucks trailers vehicles motorcycles homes snowmobiles
42312|Motor Vehicle Supplies and New Parts Merchant Wholesalers|
423120|Motor Vehicle Supplies and New Parts Merchant Wholesalers|wholesale distribution accessories tools equipment tires tubes
42313|Tire and Tube Merchant Wholesalers|
423130|Tire and Tube Merchant Wholesalers|wholesale distribution tires tubes passenger commercial vehicles
42314|Motor Vehicle Parts (Used) Merchant Wholesalers|
423140|Motor Vehicle Parts (Used) Merchant Wholesalers|wholesale distribution tires tubes dismantling vehicles purpose selling
4232|Furniture and Home Furnishing Merchant Wholesalers|
42321|Furniture Merchant Wholesalers|
423210|Furniture Merchant Wholesalers|wholesale distribution hospital beds medical drafting tables household-type outdoor mattresses public building office religious
42322|Home Furnishing Merchant Wholesalers|
423220|Home Furnishing Merchant Wholesalers|wholesale distribution furnishings housewares carpet glassware household-type chinaware cooking utensils curtains lamps lighting fixtures draperies linens bath bed table floor coverings window
4233|Lumber and Other Construction Materials Merchant Wholesalers|
42331|Lumber, Plywood, Millwork, and Wood Panel Merchant Wholesalers|
423310|Lumber, Plywood, Millwork, and Wood Panel Merchant Wholesalers|wholesale distribution reconstituted fiber fencing doors windows frames materials roofing siding metal
42332|Brick, Stone, and Related Construction Material Merchant Wholesalers|
423320|Brick, Stone, and Related Construction Material Merchant Wholesalers|wholesale distribution cement lime sand gravel asphalt concrete mixtures structural clay
42333|Roofing, Siding, and Insulation Material Merchant Wholesalers|
423330|Roofing, Siding, and Insulation Material Merchant Wholesalers|wholesale distribution nonwood materials
42339|Other Construction Material Merchant Wholesalers|
423390|Other Construction Material Merchant Wholesalers|wholesale distribution manufactured homes mobile prefabricated buildings materials lumber plywood millwork wood panels brick stone roofing siding electrical wiring supplies insulation flat
4234|Professional and Commercial Equipment and Supplies Merchant Wholesalers|
42341|Photographic Equipment and Supplies Merchant Wholesalers|
423410|Photographic Equipment and Supplies Merchant Wholesalers|wholesale distribution office photofinishing television cameras camera video household-type film plates
42342|Office Equipment Merchant Wholesalers|
423420|Office Equipment Merchant Wholesalers|wholesale distribution machines computers computer peripheral accounting mailing calculators calculating cash registers security safes copying microfilm supplies
42343|Computer and Computer Peripheral Equipment and Software Merchant Wholesalers|
423430|Computer and Computer Peripheral Equipment and Software Merchant Wholesalers|wholesale distribution computers loaded boards
42344|Other Commercial Equipment Merchant Wholesalers|
423440|Other Commercial Equipment Merchant Wholesalers|wholesale distribution machines photographic supplies office computers computer peripheral software restaurants stores balances scales laboratory shelving coin-operated merchandising machine electrical signs chinaware
42345|Medical, Dental, and Hospital Equipment and Supplies Merchant Wholesalers|
423450|Medical, Dental, and Hospital Equipment and Supplies Merchant Wholesalers|wholesale distribution professional instruments ophthalmic ophthalmologists optometrists opticians surgical dressings electromedical patient monitoring beds prosthetic appliances furniture apparatus x-ray machines parts
42346|Ophthalmic Goods Merchant Wholesalers|
423460|Ophthalmic Goods Merchant Wholesalers|wholesale distribution professional equipment instruments sold prescribed ophthalmologists optometrists opticians binoculars optometric supplies frames sunglasses lenses
42349|Other Professional Equipment and Supplies Merchant Wholesalers|
423490|Other Professional Equipment and Supplies Merchant Wholesalers|wholesale distribution ophthalmic medical dental hospital church silverware plated ware school books furniture drafting tables instruments scientific laboratory surveying
4235|Metal and Mineral (except Petroleum) Merchant Wholesalers|
42351|Metal Service Centers and Other Metal Merchant Wholesalers|
423510|Metal Service Centers and Other Metal Merchant Wholesalers|wholesale distribution primary metals maintain inventory perform functions sawing shearing bending leveling cleaning edging custom part sales transactions cast iron pipe rods
42352|Coal and Other Mineral and Ore Merchant Wholesalers|
423520|Coal and Other Mineral and Ore Merchant Wholesalers|wholesale distribution coke metal ores nonmetallic minerals precious semiprecious stones construction sand gravel
4236|Household Appliances and Electrical and Electronic Goods Merchant Wholesalers|
42361|Electrical Apparatus and Equipment, Wiring Supplies, and Related Equipment Merchant Wholesalers|
423610|Electrical Apparatus and Equipment, Wiring Supplies, and Related Equipment Merchant Wholesalers|wholesale distribution construction materials electric light fixtures bulbs power generation transmission control energy
42362|Household Appliances, Electric Housewares, and Consumer Electronics Merchant Wholesalers|
423620|Household Appliances, Electric Housewares, and Consumer Electronics Merchant Wholesalers|wholesale distribution household-type gas water heaters heating stoves noncooking room air-conditioners audio video equipment sewing machines radios automotive cameras refrigerators television sets
42369|Other Electronic Parts and Equipment Merchant Wholesalers|
423690|Other Electronic Parts and Equipment Merchant Wholesalers|wholesale distribution electrical apparatus wiring supplies construction materials appliances television sets radios blank audio video tapes communications compact discs cds radar digital
4237|Hardware, and Plumbing and Heating Equipment and Supplies Merchant Wholesalers|
42371|Hardware Merchant Wholesalers|
423710|Hardware Merchant Wholesalers|wholesale distribution knives handtools brads cutlery disposable plastics power drills saws sanders fasteners bolts nuts rivets screws staples motor vehicle machinists precision
42372|Plumbing and Heating Equipment and Supplies (Hydronics) Merchant Wholesalers|
423720|Plumbing and Heating Equipment and Supplies (Hydronics) Merchant Wholesalers|wholesale distribution hydronic household-type water heaters
42373|Warm Air Heating and Air-Conditioning Equipment and Supplies Merchant Wholesalers|
423730|Warm Air Heating and Air-Conditioning Equipment and Supplies Merchant Wholesalers|wholesale distribution air-conditioning pollution control non-portable electric baseboard heaters room units central automotive air-conditioners
42374|Refrigeration Equipment and Supplies Merchant Wholesalers|
423740|Refrigeration Equipment and Supplies Merchant Wholesalers|wholesale distribution household-type refrigerators freezers air-conditioners cold storage machinery refrigerated display cases commercial water coolers
4238|Machinery, Equipment, and Supplies Merchant Wholesalers|
42381|Construction and Mining (except Oil Well) Machinery and Equipment Merchant Wholesalers|
423810|Construction and Mining (except Oil Well) Machinery and Equipment Merchant Wholesalers|wholesale distribution specialized parts logging excavating road maintenance forestry scaffolding cranes
42382|Farm and Garden Machinery and Equipment Merchant Wholesalers|
423820|Farm and Garden Machinery and Equipment Merchant Wholesalers|wholesale distribution specialized parts agricultural lawn animal feeders milking harvesting planting lawnmowers
42383|Industrial Machinery and Equipment Merchant Wholesalers|
423830|Industrial Machinery and Equipment Merchant Wholesalers|wholesale distribution specialized parts manufacturing oil warehousing fluid power transmission metalworking food processing material handling
42384|Industrial Supplies Merchant Wholesalers|
423840|Industrial Supplies Merchant Wholesalers|wholesale distribution machinery equipment manufacturing oil warehousing containers refractory materials brick blocks shapes diamonds welding gases printing inks
42385|Service Establishment Equipment and Supplies Merchant Wholesalers|
423850|Service Establishment Equipment and Supplies Merchant Wholesalers|wholesale distribution specialized offices stores hotels restaurants schools health medical facilities photographic transportation construction amusement park janitorial beauty parlor undertakers car wash
42386|Transportation Equipment and Supplies (except Motor Vehicle) Merchant Wholesalers|
423860|Transportation Equipment and Supplies (except Motor Vehicle) Merchant Wholesalers|wholesale distribution marine pleasure craft vehicles aircraft railroad cars motorized passenger golf carts ships
4239|Miscellaneous Durable Goods Merchant Wholesalers|
42391|Sporting and Recreational Goods and Supplies Merchant Wholesalers|
423910|Sporting and Recreational Goods and Supplies Merchant Wholesalers|wholesale distribution accessories billiard pool firearms ammunition marine pleasure craft equipment
42392|Toy and Hobby Goods and Supplies Merchant Wholesalers|
423920|Toy and Hobby Goods and Supplies Merchant Wholesalers|wholesale distribution games toys fireworks playing cards
42393|Recyclable Material Merchant Wholesalers|
423930|Recyclable Material Merchant Wholesalers|wholesale distribution automotive scrap industrial materials auto wreckers dismantling motor vehicles purpose wholesaling
42394|Jewelry, Watch, Precious Stone, and Precious Metal Merchant Wholesalers|
423940|Jewelry, Watch, Precious Stone, and Precious Metal Merchant Wholesalers|wholesale distribution semiprecious stones metals flatware costume watches clocks silverware jewelers findings
42399|Other Miscellaneous Durable Goods Merchant Wholesalers|
423990|Other Miscellaneous Durable Goods Merchant Wholesalers|wholesale distribution motor vehicles vehicle parts supplies furniture home furnishings lumber construction materials professional commercial equipment metals minerals petroleum electrical hardware plumbing
424|Merchant Wholesalers, Nondurable Goods|
4241|Paper and Paper Product Merchant Wholesalers|
42411|Printing and Writing Paper Merchant Wholesalers|
424110|Printing and Writing Paper Merchant Wholesalers|wholesale distribution bulk rolls further processing envelope fine groundwood newsprint
42412|Stationery and Office Supplies Merchant Wholesalers|
424120|Stationery and Office Supplies Merchant Wholesalers|wholesale distribution gift wrap photocopy envelope social file cards folders paper carbon computer copier typewriter greeting writing pens pencils
42413|Industrial and Personal Service Paper Merchant Wholesalers|
424130|Industrial and Personal Service Paper Merchant Wholesalers|wholesale distribution kraft wrapping coarse paperboard converted stationery office supplies disposable plastics corrugated eating utensils napkins dishes boxes shipping towels bags sanitary
4242|Drugs and Druggists' Sundries Merchant Wholesalers|
42421|Drugs and Druggists' Sundries Merchant Wholesalers|
424210|Drugs and Druggists' Sundries Merchant Wholesalers|wholesale distribution biological medical botanical herbs pharmaceutical intended internal external consumption forms ampoules tablets capsules vials ointments powders solutions suspensions antibiotics endocrine
4243|Apparel, Piece Goods, and Notions Merchant Wholesalers|
42431|Piece Goods, Notions, and Other Dry Goods Merchant Wholesalers|
424310|Piece Goods, Notions, and Other Dry Goods Merchant Wholesalers|wholesale distribution fabrics knitting yarns industrial thread hair accessories
42432|Men's and Boys' Clothing and Furnishings Merchant Wholesalers|
424320|Men's and Boys' Clothing and Furnishings Merchant Wholesalers|wholesale distribution hosiery suits nightwear underwear sportswear work
42433|Women's, Children's, and Infants' Clothing and Accessories Merchant Wholesalers|
424330|Women's, Children's, and Infants' Clothing and Accessories Merchant Wholesalers|wholesale distribution unisex fur dresses millinery hosiery lingerie
42434|Footwear Merchant Wholesalers|
424340|Footwear Merchant Wholesalers|wholesale distribution athletic leather rubber materials
4244|Grocery and Related Product Merchant Wholesalers|
42441|General Line Grocery Merchant Wholesalers|
424410|General Line Grocery Merchant Wholesalers|wholesale distribution wide range groceries
42442|Packaged Frozen Food Merchant Wholesalers|
424420|Packaged Frozen Food Merchant Wholesalers|wholesale distribution foods dairy bakery fish juices meats vegetables poultry
42443|Dairy Product (except Dried or Canned) Merchant Wholesalers|
424430|Dairy Product (except Dried or Canned) Merchant Wholesalers|wholesale distribution butter fluid milk cheese ice cream ices yogurt
42444|Poultry and Poultry Product Merchant Wholesalers|
424440|Poultry and Poultry Product Merchant Wholesalers|wholesale distribution canned packaged frozen
42445|Confectionery Merchant Wholesalers|
424450|Confectionery Merchant Wholesalers|wholesale distribution confectioneries salted roasted nuts popcorn potato corn chips fountain fruits syrups
42446|Fish and Seafood Merchant Wholesalers|
424460|Fish and Seafood Merchant Wholesalers|wholesale distribution canned packaged frozen
42447|Meat and Meat Product Merchant Wholesalers|
424470|Meat and Meat Product Merchant Wholesalers|wholesale distribution meats canned packaged frozen lard
42448|Fresh Fruit and Vegetable Merchant Wholesalers|
424480|Fresh Fruit and Vegetable Merchant Wholesalers|wholesale distribution fruits vegetables
42449|Other Grocery and Related Products Merchant Wholesalers|
424490|Other Grocery and Related Products Merchant Wholesalers|wholesale distribution groceries general line packaged frozen food dairy dried canned poultry confectioneries fish seafood meat fresh fruits vegetables bottling spring mineral
4245|Farm Product Raw Material Merchant Wholesalers|
42451|Grain and Field Bean Merchant Wholesalers|
424510|Grain and Field Bean Merchant Wholesalers|wholesale distribution grains corn wheat oats barley unpolished rice dry beans soybeans inedible country terminal elevators purpose wholesaling
42452|Livestock Merchant Wholesalers|
424520|Livestock Merchant Wholesalers|wholesale distribution horses mules cattle hogs goats sheep
42459|Other Farm Product Raw Material Merchant Wholesalers|
424590|Other Farm Product Raw Material Merchant Wholesalers|wholesale distribution grain field beans livestock milk live poultry fresh fruits vegetables chicks mules hides cotton horses pelts leaf tobacco sod
4246|Chemical and Allied Products Merchant Wholesalers|
42461|Plastics Materials and Basic Forms and Shapes Merchant Wholesalers|
424610|Plastics Materials and Basic Forms and Shapes Merchant Wholesalers|wholesale distribution resins unsupported film sheet sheeting rod tube
42469|Other Chemical and Allied Products Merchant Wholesalers|
424690|Other Chemical and Allied Products Merchant Wholesalers|wholesale distribution chemicals agricultural medicinal paints varnishes fireworks plastics materials basic forms shapes acids industrial automotive lubricating oils greases salts dyestuffs rosins
4247|Petroleum and Petroleum Products Merchant Wholesalers|
42471|Petroleum Bulk Stations and Terminals|
424710|Petroleum Bulk Stations and Terminals|liquid storage facilities merchant wholesale distribution crude liquefied gas
42472|Petroleum and Petroleum Products Merchant Wholesalers (except Bulk Stations and Terminals)|
424720|Petroleum and Petroleum Products Merchant Wholesalers (except Bulk Stations and Terminals)|wholesale distribution liquid storage facilities bottled gas gasoline fuel oil lubricating grease
4248|Beer, Wine, and Distilled Alcoholic Beverage Merchant Wholesalers|
42481|Beer and Ale Merchant Wholesalers|
424810|Beer and Ale Merchant Wholesalers|wholesale distribution porter fermented malt beverages
42482|Wine and Distilled Alcoholic Beverage Merchant Wholesalers|
424820|Wine and Distilled Alcoholic Beverage Merchant Wholesalers|wholesale distribution beverages neutral spirits ethyl alcohol blended wines liquors
4249|Miscellaneous Nondurable Goods Merchant Wholesalers|
42491|Farm Supplies Merchant Wholesalers|
424910|Farm Supplies Merchant Wholesalers|wholesale distribution animal feeds fertilizers agricultural chemicals pesticides plant seeds bulbs
42492|Book, Periodical, and Newspaper Merchant Wholesalers|
424920|Book, Periodical, and Newspaper Merchant Wholesalers|wholesale distribution books periodicals newspapers
42493|Flower, Nursery Stock, and Florists' Supplies Merchant Wholesalers|
424930|Flower, Nursery Stock, and Florists' Supplies Merchant Wholesalers|wholesale distribution flowers plant seeds bulbs
42494|Tobacco and Tobacco Product Merchant Wholesalers|
424940|Tobacco and Tobacco Product Merchant Wholesalers|wholesale distribution cigarettes snuff cigars pipe
42495|Paint, Varnish, and Supplies Merchant Wholesalers|
424950|Paint, Varnish, and Supplies Merchant Wholesalers|wholesale distribution paints varnishes coatings pigments wallpaper paintbrushes rollers
42499|Other Miscellaneous Nondurable Goods Merchant Wholesalers|
424990|Other Miscellaneous Nondurable Goods Merchant Wholesalers|wholesale distribution printing writing paper stationery office supplies industrial personal drugs druggists sundries apparel piece notions grocery farm raw materials chemical allied
425|Wholesale Electronic Markets and Agents and Brokers|
4251|Wholesale Electronic Markets and Agents and Brokers|
42511|Business to Business Electronic Markets|
425110|Business to Business Electronic Markets|business-to-business bringing together buyers sellers internet means receiving commission durable nondurable
42512|Wholesale Trade Agents and Brokers|
425120|Wholesale Trade Agents and Brokers|acting behalf buyers sellers distribution take title sold rather receive commission durable nondurable independent sales representatives manufacturers
44-45|Retail Trade|
441|Motor Vehicle and Parts Dealers|
4411|Automobile Dealers|
44111|New Car Dealers|
441110|New Car Dealers|retailing automobiles light trucks sport utility vehicles passenger cargo vans repair cars selling replacement parts accessories automobile truck
44112|Used Car Dealers|
441120|Used Car Dealers|retailing automobiles light trucks sport utility vehicles passenger cargo vans antique auto truck automobile
4412|Other Motor Vehicle Dealers|
44121|Recreational Vehicle Dealers|
441210|Recreational Vehicle Dealers|retailing vehicles commonly referred rvs repair selling replacement parts accessories motor home stores travel trailer
44122|Motorcycle, Boat, and Other Motor Vehicle Dealers|retailing motorcycles boats vehicles automobiles light trucks recreational repair selling replacement parts accessories aircraft all-terrain atv utility trailer
441222|Boat Dealers|retailing boats repair selling replacement parts accessories outboard motors trailers marine supplies power rowboats sailboats motor supply
441228|Motorcycle, ATV, and All Other Motor Vehicle Dealers|retailing motorcycles scooters motorbikes mopeds off-road all-terrain vehicles personal watercraft utility trailers automobiles light trucks recreational boats repair selling replacement parts accessories
4413|Automotive Parts, Accessories, and Tire Stores|
44131|Automotive Parts and Accessories Stores|
441310|Automotive Parts and Accessories Stores|supply retailing rebuilt repairing automobiles installing truck cap stereo speed shops
44132|Tire Dealers|
441320|Tire Dealers|retailing tires tubes automotive repair
442|Furniture and Home Furnishings Stores|
4421|Furniture Stores|
44211|Furniture Stores|
442110|Furniture Stores|retailing household baby box springs mattresses outdoor office sold supplies equipment appliances home electronics furnishings floor coverings
4422|Home Furnishings Stores|
44221|Floor Covering Stores|
442210|Floor Covering Stores|retailing coverings rugs carpets vinyl tile ceramic wood installation repair
44229|Other Home Furnishings Stores|retailing furniture floor coverings bath shops kitchenware chinaware window treatment glassware
442291|Window Treatment Stores|retailing treatments curtains drapes blinds shades
442299|All Other Home Furnishings Stores|retailing floor coverings furniture window treatments bath shops kitchenware chinaware linen electric lamp picture frame custom glassware wood-burning stove housewares
443|Electronics and Appliance Stores|
4431|Electronics and Appliance Stores|
44314|Electronics and Appliance Stores|retailing array household-type appliances consumer-type electronic televisions computers cameras specializing single line repair support prepackaged computer software prerecorded audio video media cds
443141|Household Appliance Stores|retailing array appliances refrigerators dishwashers ovens irons coffee makers hair dryers electric razors room air-conditioners microwave sewing machines vacuum cleaners repair
443142|Electronics Stores|consumer retailing general line consumer-type electronic televisions computers cameras specializing single repair support prepackaged computer software prerecorded audio video media cds dvds
444|Building Material and Garden Equipment and Supplies Dealers|
4441|Building Material and Supplies Dealers|
44411|Home Centers|
444110|Home Centers|retailing general line repair improvement materials supplies lumber plumbing electrical tools housewares hardware lawn garden merchandise predominating lines normally arranged separate departments
44412|Paint and Wallpaper Stores|
444120|Paint and Wallpaper Stores|retailing supplies
44413|Hardware Stores|
444130|Hardware Stores|retailing general line tools builders
44419|Other Building Material Dealers|
444190|Other Building Material Dealers|home centers paint wallpaper stores hardware retailing specialized lines materials lumber fencing glass doors plumbing fixtures supplies electrical prefabricated buildings kits kitchen
4442|Lawn and Garden Equipment and Supplies Stores|
44421|Outdoor Power Equipment Stores|
444210|Outdoor Power Equipment Stores|retailing repair selling replacement parts
44422|Nursery, Garden Center, and Farm Supply Stores|
444220|Nursery, Garden Center, and Farm Supply Stores|retailing trees shrubs plants seeds bulbs sod predominantly grown sell limited amount grow themselves supplies animal pet feed
445|Food and Beverage Stores|
4451|Grocery Stores|
44511|Supermarkets and Other Grocery (except Convenience) Stores|
445110|Supermarkets and Other Grocery (except Convenience) Stores|retailing general line food canned frozen foods fresh fruits vegetables prepared meats fish poultry delicatessen-type
44512|Convenience Stores|
445120|Convenience Stores|food marts fuel pumps retailing limited line milk bread soda snacks
4452|Specialty Food Stores|
44521|Meat Markets|
445210|Meat Markets|retailing fresh frozen cured meats poultry delicatessen-type baked ham stores butcher shops dealers
44522|Fish and Seafood Markets|
445220|Fish and Seafood Markets|retailing fresh frozen cured
44523|Fruit and Vegetable Markets|
445230|Fruit and Vegetable Markets|retailing fresh fruits vegetables
44529|Other Specialty Food Stores|retailing foods meat fish seafood fruits vegetables immediate consumption made premises baked dairy coffee tea packaged gourmet confectionery nut
445291|Baked Goods Stores|retailing immediate consumption made premises
445292|Confectionery and Nut Stores|retailing candy confections nuts popcorn immediate consumption made premises
445299|All Other Specialty Food Stores|retailing miscellaneous foods meat fish seafood fruit vegetables confections nuts popcorn baked immediate consumption made premises coffee tea packaged soft drink bottled
4453|Beer, Wine, and Liquor Stores|
44531|Beer, Wine, and Liquor Stores|
445310|Beer, Wine, and Liquor Stores|retailing packaged alcoholic beverages ale
446|Health and Personal Care Stores|
4461|Health and Personal Care Stores|
44611|Pharmacies and Drug Stores|
446110|Pharmacies and Drug Stores|retailing prescription nonprescription drugs medicines
44612|Cosmetics, Beauty Supplies, and Perfume Stores|
446120|Cosmetics, Beauty Supplies, and Perfume Stores|cosmetic supply shops retailing perfumes toiletries personal grooming
44613|Optical Goods Stores|
446130|Optical Goods Stores|retailing fitting prescription eyeglasses contact lenses grinding order premises selling nonprescription
44619|Other Health and Personal Care Stores|retailing drugs medicines optical perfumes cosmetics beauty supplies convalescent supply prosthetic food supplement sick room hearing aid
446191|Food (Health) Supplement Stores|retailing vitamins nutrition supplements body enhancing
446199|All Other Health and Personal Care Stores|retailing specialized lines merchandise drugs medicines optical cosmetics beauty supplies perfume food supplement convalescent supply prosthetic hearing aid sick room
447|Gasoline Stations|
4471|Gasoline Stations|
44711|Gasoline Stations with Convenience Stores|
447110|Gasoline Stations with Convenience Stores|retailing automotive fuels diesel fuel gasohol store food mart setting station repair
44719|Other Gasoline Stations|
447190|Other Gasoline Stations|convenience stores retailing automotive fuels diesel fuel gasohol alternative repair selling oils replacement parts accessories food truck stops marine
448|Clothing and Clothing Accessories Stores|
4481|Clothing Stores|
44811|Men's Clothing Stores|
448110|Men's Clothing Stores|retailing general line boys basic alterations hemming taking letting seams lengthening shortening sleeves
44812|Women's Clothing Stores|
448120|Women's Clothing Stores|retailing general line misses juniors maternity wear basic alterations hemming taking letting seams lengthening shortening sleeves
44813|Children's and Infants' Clothing Stores|
448130|Children's and Infants' Clothing Stores|retailing general line basic alterations hemming taking letting seams lengthening shortening sleeves
44814|Family Clothing Stores|
448140|Family Clothing Stores|retailing general line men women children specializing sales individual gender age group basic alterations hemming taking letting seams lengthening shortening sleeves
44815|Clothing Accessories Stores|
448150|Clothing Accessories Stores|retailing single lines hats caps costume jewelry gloves handbags ties wigs toupees belts wig hairpiece neckwear
44819|Other Clothing Stores|
448190|Other Clothing Stores|retailing specialized lines general men women children infants family basic alterations hemming taking letting seams lengthening shortening sleeves bridal gown custom shops
4482|Shoe Stores|
44821|Shoe Stores|
448210|Shoe Stores|retailing footwear hosiery specialty sports golf shoes bowling spiked tennis sneakers
4483|Jewelry, Luggage, and Leather Goods Stores|
44831|Jewelry Stores|
448310|Jewelry Stores|retailing costume sterling plated silverware watches clocks lapidary work repair
44832|Luggage and Leather Goods Stores|
448320|Luggage and Leather Goods Stores|retailing briefcases trunks general line apparel belts gloves handbags
451|Sporting Goods, Hobby, Musical Instrument, and Book Stores|
4511|Sporting Goods, Hobby, and Musical Instrument Stores|
45111|Sporting Goods Stores|
451110|Sporting Goods Stores|retailing bicycles bicycle parts camping equipment exercise fitness athletic uniforms specialty sports footwear accessories uniform supply fishing motorized shops golf pro bowling
45112|Hobby, Toy, and Game Stores|
451120|Hobby, Toy, and Game Stores|retailing toys games craft supplies needlecraft
45113|Sewing, Needlework, and Piece Goods Stores|
451130|Sewing, Needlework, and Piece Goods Stores|retailing supplies fabrics patterns yarns accessories selling machines fabric shops supply needlecraft upholstery materials
45114|Musical Instrument and Supplies Stores|
451140|Musical Instrument and Supplies Stores|retailing instruments sheet music repair rental instruction piano
4512|Book Stores and News Dealers|
45121|Book Stores and News Dealers|retailing books newspapers magazines periodicals
451211|Book Stores|retailing books
451212|News Dealers and Newsstands|retailing current newspapers magazines periodicals
452|General Merchandise Stores|
4522|Department Stores|
45221|Department Stores|
452210|Department Stores|separate departments general lines merchandise apparel jewelry home furnishings toys line predominating sell perishable groceries fresh fruits vegetables dairy sales insignificant customer
4523|General Merchandise Stores, including Warehouse Clubs and Supercenters|
45231|General Merchandise Stores, including Warehouse Clubs and Supercenters|retailing department retail line apparel automotive parts dry hardware groceries housewares home furnishings predominating superstores dollar catalog showrooms mail-order trading posts auto
452311|Warehouse Clubs and Supercenters|superstores retailing general line groceries significant amount fresh fruits vegetables dairy meats perishable merchandise apparel furniture appliances
452319|All Other General Merchandise Stores|retailing department warehouse clubs superstores supercenters retail line apparel automotive parts dry hardware housewares home furnishings lines limited amounts none predominating dollar
453|Miscellaneous Store Retailers|
4531|Florists|
45311|Florists|
453110|Florists|retailing cut flowers floral arrangements potted plants purchased prepare sell
4532|Office Supplies, Stationery, and Gift Stores|
45321|Office Supplies and Stationery Stores|
453210|Office Supplies and Stationery Stores|retailing school equipment furniture selling computers
45322|Gift, Novelty, and Souvenir Stores|
453220|Gift, Novelty, and Souvenir Stores|retailing gifts merchandise souvenirs greeting cards seasonal holiday decorations curios balloon shops card christmas curio fruit basket bouquet
4533|Used Merchandise Stores|
45331|Used Merchandise Stores|
453310|Used Merchandise Stores|retailing antiques secondhand motor vehicles automobiles rvs motorcycles boats vehicle parts tires mobile homes antique shops household-type appliance book thrift clothing sporting
4539|Other Miscellaneous Store Retailers|
45391|Pet and Pet Supplies Stores|
453910|Pet and Pet Supplies Stores|retailing pets foods
45392|Art Dealers|
453920|Art Dealers|retailing original limited edition works displaying retail sale galleries
45393|Manufactured (Mobile) Home Dealers|
453930|Manufactured (Mobile) Home Dealers|retailing homes parts equipment
45399|All Other Miscellaneous Store Retailers|retailing specialized lines merchandise motor vehicle parts dealers furniture home furnishings stores electronics appliance building material garden equipment supplies food beverage health
453991|Tobacco Stores|retailing cigarettes cigars pipes smokers supplies cigar supply cigarette stands permanent
453998|All Other Miscellaneous Store Retailers (except Tobacco Stores)|retailing specialized lines merchandise motor vehicle parts dealers furniture home furnishings electronics appliance building material garden equipment supplies food beverage health personal
454|Nonstore Retailers|
4541|Electronic Shopping and Mail-Order Houses|
45411|Electronic Shopping and Mail-Order Houses|
454110|Electronic Shopping and Mail-Order Houses|retailing merchandise nonstore means catalogs toll free telephone numbers media interactive television internet catalog showrooms mail-order order-taking offices collectors computer software home
4542|Vending Machine Operators|
45421|Vending Machine Operators|
454210|Vending Machine Operators|retailing merchandise machines
4543|Direct Selling Establishments|
45431|Fuel Dealers|
454310|Fuel Dealers|retailing heating oil liquefied petroleum gas fuels via direct selling
45439|Other Direct Selling Establishments|
454390|Other Direct Selling Establishments|retailing merchandise food immediate consumption fuel via sale customer means in-house sales party plan merchandising truck wagon portable stalls street vendors bottled
48-49|Transportation and Warehousing|
481|Air Transportation|
4811|Scheduled Air Transportation|
48111|Scheduled Air Transportation|passengers cargo regular routes schedules operate flights even partially loaded mail commuter carriers passenger couriers helicopter
481111|Scheduled Passenger Air Transportation|passengers freight regular routes schedules operate flights even partially loaded carriers commuter helicopter scenic sightseeing
481112|Scheduled Freight Air Transportation|cargo transporting passengers regular routes schedules operate flights even partially loaded mail
4812|Nonscheduled Air Transportation|
48121|Nonscheduled Air Transportation|passengers cargo regular routes schedules specialty flying general purpose aircraft flexibility respect choice airports hours load factors operational characteristics taxi freight charter
481211|Nonscheduled Chartered Passenger Air Transportation|passengers cargo regular routes schedules
481212|Nonscheduled Chartered Freight Air Transportation|cargo transporting passengers regular routes schedules
481219|Other Nonscheduled Air Transportation|regular routes schedules chartered passenger cargo specialty flying based individual customer needs general purpose aircraft charter aviation clubs public
482|Rail Transportation|
4821|Rail Transportation|
48211|Rail Transportation|railroads street commuter urban rapid transit scenic sightseeing trains line-haul short-line
482111|Line-Haul Railroads|line-haul transport passengers cargo long distance rail network intercity movement trains between terminals stations main branch lines local switching
482112|Short Line Railroads|short-line transport cargo distance local rail lines part network
483|Water Transportation|
4831|Deep Sea, Coastal, and Great Lakes Water Transportation|
48311|Deep Sea, Coastal, and Great Lakes Water Transportation|lawrence seaway marine facilities authority commission considered system
483111|Deep Sea Freight Transportation|cargo foreign ports
483112|Deep Sea Passenger Transportation|passengers foreign ports
483113|Coastal and Great Lakes Freight Transportation|water cargo waters system deep seas between ports united states puerto rico island possessions protectorates marine facilities lawrence seaway authority commission considered
483114|Coastal and Great Lakes Passenger Transportation|water passengers waters system deep seas between ports united states puerto rico island possessions protectorates marine facilities lawrence seaway authority commission considered
4832|Inland Water Transportation|
48321|Inland Water Transportation|passengers cargo lakes rivers intracoastal waterways great system
483211|Inland Water Freight Transportation|cargo lakes rivers intracoastal waterways great system
483212|Inland Water Passenger Transportation|passengers lakes rivers intracoastal waterways great system
484|Truck Transportation|
4841|General Freight Trucking|
48411|General Freight Trucking, Local|
484110|General Freight Trucking, Local|handle wide commodities palletized transported container van trailer metropolitan area cross state lines trips same-day return
48412|General Freight Trucking, Long-Distance|long-distance handle wide commodities palletized transported container van trailer between metropolitan areas cross north american country borders truckload less ltl carriers
484121|General Freight Trucking, Long-Distance, Truckload|long-distance carrier full truck movement origin destination shipment characterized single load combined shipments
484122|General Freight Trucking, Long-Distance, Less Than Truckload|long-distance ltl carriage characterized multiple shipments combined onto single truck deliveries network local pick-up sorting terminal line-haul destination delivery
4842|Specialized Freight Trucking|
48421|Used Household and Office Goods Moving|
484210|Used Household and Office Goods Moving|local long-distance trucking institutional commercial furniture equipment incidental packing storage often
48422|Specialized Freight (except Used Goods) Trucking, Local|
484220|Specialized Freight (except Used Goods) Trucking, Local|metropolitan area cross state lines trips same-day return agricultural dump gravel sand top-soil boat hauling livestock bulk liquids
48423|Specialized Freight (except Used Goods) Trucking, Long-Distance|
484230|Specialized Freight (except Used Goods) Trucking, Long-Distance|long-distance between metropolitan areas cross north american country borders automobile carrier refrigerated bulk liquid waste hazardous material
485|Transit and Ground Passenger Transportation|
4851|Urban Transit Systems|
48511|Urban Transit Systems|local suburban passenger regular routes schedules metropolitan area adjacent nonurban areas transportation involve modes transport light rail commuter subways streetcars buses motor
485111|Mixed Mode Transit Systems|local suburban ground passenger transport regular routes schedules metropolitan area adjacent nonurban areas
485112|Commuter Rail Systems|local suburban regular routes schedule metropolitan area adjacent nonurban areas characterized reduced fares multiple ride commutation tickets mostly passengers during morning evening
485113|Bus and Other Motor Vehicle Transit Systems|local suburban passenger transportation buses vehicles regular routes schedules metropolitan area adjacent nonurban areas
485119|Other Urban Transit Systems|local suburban ground passenger mixed mode commuter rail buses motor vehicles regular routes schedules metropolitan area adjacent nonurban areas cable car stand-alone
4852|Interurban and Rural Bus Transportation|
48521|Interurban and Rural Bus Transportation|
485210|Interurban and Rural Bus Transportation|passenger regular routes schedules outside single metropolitan area adjacent nonurban areas
4853|Taxi and Limousine Service|
48531|Taxi Service|
485310|Taxi Service|passenger transportation automobile van operated regular routes schedules taxicab owner operators fleet organizations
48532|Limousine Service|
485320|Limousine Service|array specialty luxury passenger transportation via sedan reserved operate regular routes schedules
4854|School and Employee Bus Transportation|
48541|School and Employee Bus Transportation|
485410|School and Employee Bus Transportation|buses motor vehicles transport pupils employees work
4855|Charter Bus Industry|
48551|Charter Bus Industry|
485510|Charter Bus Industry|buses meet customers road transportation needs operate fixed routes regular schedules
4859|Other Transit and Ground Passenger Transportation|
48599|Other Transit and Ground Passenger Transportation|urban systems interurban rural bus taxi school employee charter limousine shuttle special needs travel metropolitan area adjacent nonurban areas regular routes schedules
485991|Special Needs Transportation|school work infirm elderly handicapped specially equipped vehicles passenger
485999|All Other Transit and Ground Passenger Transportation|urban systems interurban rural bus taxi limousine shuttle school employee charter special needs vanpools travel regular routes schedules between hotels airports destination
486|Pipeline Transportation|
4861|Pipeline Transportation of Crude Oil|
48611|Pipeline Transportation of Crude Oil|
486110|Pipeline Transportation of Crude Oil|
4862|Pipeline Transportation of Natural Gas|
48621|Pipeline Transportation of Natural Gas|
486210|Pipeline Transportation of Natural Gas|processing plants local distribution systems storage because done inherently network nodes interdependent
4869|Other Pipeline Transportation|
48691|Pipeline Transportation of Refined Petroleum Products|
486910|Pipeline Transportation of Refined Petroleum Products|
48699|All Other Pipeline Transportation|
486990|All Other Pipeline Transportation|crude oil natural gas refined petroleum
487|Scenic and Sightseeing Transportation|
4871|Scenic and Sightseeing Transportation, Land|
48711|Scenic and Sightseeing Transportation, Land|
487110|Scenic and Sightseeing Transportation, Land|buses trolleys steam train excursions horse-drawn rides local involve same-day return place origin
4872|Scenic and Sightseeing Transportation, Water|
48721|Scenic and Sightseeing Transportation, Water|
487210|Scenic and Sightseeing Transportation, Water|local involve same-day return place origin airboat swamp buggy excursion boat charter fishing harbor tours dinner cruises
4879|Scenic and Sightseeing Transportation, Other|
48799|Scenic and Sightseeing Transportation, Other|
487990|Scenic and Sightseeing Transportation, Other|land water local involve same-day return place departure aerial cable cars helicopter rides tramways hot air balloon glider excursions
488|Support Activities for Transportation|
4881|Support Activities for Air Transportation|
48811|Airport Operations|international national civil airports public flying fields supporting special food contractors rental hangar space air traffic control baggage handling cargo
488111|Air Traffic Control|regulate flow
488119|Other Airport Operations|international national civil airports public flying fields supporting rental hangar space baggage handling cargo
48819|Other Support Activities for Air Transportation|
488190|Other Support Activities for Air Transportation|specialized traffic control airport aircraft maintenance repair factory conversions overhauls rebuilding passenger screening security testing
4882|Support Activities for Rail Transportation|
48821|Support Activities for Rail Transportation|
488210|Support Activities for Rail Transportation|specialized railroad servicing routine repairing factory conversion overhaul rebuilding rolling stock maintaining cars loading unloading independent terminals
4883|Support Activities for Water Transportation|
48831|Port and Harbor Operations|
488310|Port and Harbor Operations|ports harbors docking pier facilities canals
48832|Marine Cargo Handling|
488320|Marine Cargo Handling|stevedoring warehousing
48833|Navigational Services to Shipping|
488330|Navigational Services to Shipping|marine salvage docking undocking vessel piloting water transportation traffic reporting tugboat harbor
48839|Other Support Activities for Water Transportation|
488390|Other Support Activities for Water Transportation|port harbor marine cargo handling navigational shipping floating drydocks routine repair maintenance ships ship scaling checkers surveyors
4884|Support Activities for Road Transportation|
48841|Motor Vehicle Towing|
488410|Motor Vehicle Towing|light heavy vehicles local long-distance incidental storage emergency road repair
48849|Other Support Activities for Road Transportation|
488490|Other Support Activities for Road Transportation|motor vehicle towing network users bridge tunnel highway pilot car wide load warning driving automobile truck delivery weighing station
4885|Freight Transportation Arrangement|
48851|Freight Transportation Arrangement|
488510|Freight Transportation Arrangement|arranging between shippers carriers forwarders marine shipping agents customs brokers offer spanning modes
4889|Other Support Activities for Transportation|
48899|Other Support Activities for Transportation|air rail water road freight arrangement vanpools carpools stockyards fattening selling livestock independent pipeline terminal facilities
488991|Packing and Crating|otherwise preparing transportation
488999|All Other Support Activities for Transportation|air rail water road freight arrangement packing crating vanpools carpools stockyards fattening selling livestock independent pipeline terminal facilities
491|Postal Service|
4911|Postal Service|
49111|Postal Service|
491110|Postal Service|mail universal obligation carriage letters printed matter mailable packages acceptance collection processing delivery due infrastructure requirements often parcel express addition performing parts
492|Couriers and Messengers|
4921|Couriers and Express Delivery Services|
49211|Couriers and Express Delivery Services|
492110|Couriers and Express Delivery Services|air surface combined mode courier parcels universal obligation documents part normal mail between metropolitan areas urban centers international form network local pick-up
4922|Local Messengers and Local Delivery|
49221|Local Messengers and Local Delivery|
492210|Local Messengers and Local Delivery|messenger small single metropolitan area urban center point-to-point pick-up operate part intercity courier network alcoholic beverages letters documents parcels grocery independent store
493|Warehousing and Storage|
4931|Warehousing and Storage|
49311|General Warehousing and Storage|
493110|General Warehousing and Storage|merchandise facilities handle containers boxes barrels drums equipment forklifts pallets racks specialized handling bulk particular size quantity
49312|Refrigerated Warehousing and Storage|
493120|Refrigerated Warehousing and Storage|facilities furs trade blast freezing tempering modified atmosphere
49313|Farm Product Warehousing and Storage|
493130|Farm Product Warehousing and Storage|bulk facilities refrigerated grain elevators
49319|Other Warehousing and Storage|
493190|Other Warehousing and Storage|facilities general merchandise refrigerated farm bulk petroleum lumber terminals document whiskey
51|Information|
511|Publishing Industries (except Internet)|
5111|Newspaper, Periodical, Book, and Directory Publishers|
51111|Newspaper Publishers|
511110|Newspaper Publishers|carry necessary producing distributing newspapers gathering news writing columns feature stories editorials selling preparing advertisements publish print electronic form
51112|Periodical Publishers|
511120|Periodical Publishers|magazine carry necessary producing distributing magazines periodicals gathering writing editing articles selling preparing advertisements publish print electronic form comic book exclusive internet
51113|Book Publishers|
511130|Book Publishers|carry design editing marketing necessary producing distributing books publish print electronic audio form atlas exclusive internet publishing religious school textbook encyclopedia technical
51114|Directory and Mailing List Publishers|
511140|Directory and Mailing List Publishers|publishing directories lists collections compilations fact typically protected selection arrangement presentation addresses telephone businesses proprietary drugs legal case results public records publish
51119|Other Publishers|newspaper magazine book directory mailing list music publish works print electronic form art exclusive internet publishing greeting card calendar
511191|Greeting Card Publishers|publishing cards
511199|All Other Publishers|newspaper magazine book directory database music greeting card publish works print electronic form art exclusive internet publishing calendar
5112|Software Publishers|
51121|Software Publishers|
511210|Software Publishers|computer publishing reproduction carry necessary producing distributing designing documentation assisting installation support purchasers design develop publish distribute remotely subscriptions downloads
512|Motion Picture and Sound Recording Industries|
5121|Motion Picture and Video Industries|
51211|Motion Picture and Video Production|
512110|Motion Picture and Video Production|producing distributing pictures videos television programs commercials
51212|Motion Picture and Video Distribution|
512120|Motion Picture and Video Distribution|acquiring rights distributing film productions theaters television networks stations exhibitors
51213|Motion Picture and Video Exhibition|theaters exhibiting pictures videos film festivals forth
512131|Motion Picture Theaters (except Drive-Ins)|drive-ins exhibiting pictures videos film festivals forth
512132|Drive-In Motion Picture Theaters|drive-in
51219|Postproduction Services and Other Motion Picture and Video Industries|specialized editing film tape transfers titling subtitling credits closed captioning computer-produced graphics animation special effects developing processing laboratories stock footage libraries facilities
512191|Teleproduction and Other Postproduction Services|specialized motion picture video editing film tape transfers subtitling credits closed captioning animation special effects
512199|Other Motion Picture and Video Industries|production distribution exhibition teleproduction postproduction film laboratories stock footage libraries preservation
5122|Sound Recording Industries|
51223|Music Publishers|
512230|Music Publishers|acquiring registering copyrights musical compositions accordance law promoting authorizing recordings radio television motion pictures live performances print media represent interests songwriter owners
51224|Sound Recording Studios|
512240|Sound Recording Studios|facilities technical expertise studio audio production postproduction produce master recordings film television video productions
51225|Record Production and Distribution|
512250|Record Production and Distribution|tapes cds releasing promoting distributing sound recordings wholesalers retailers directly public artists arrange finance original master produce themselves audio cassettes compact discs
51229|Other Sound Recording Industries|
512290|Other Sound Recording Industries|record production distribution music publishing studio audio meetings conferences
515|Broadcasting (except Internet)|
5151|Radio and Television Broadcasting|
51511|Radio Broadcasting|audio signals operate studios facilities transmission aural programming public affiliates subscribers programs entertainment news talk shows business data religious
515111|Radio Networks|assembling transmitting aural programming affiliates subscribers via over-the-air broadcasts cable satellite covers wide material news religious weather sports music
515112|Radio Stations|broadcasting aural programs public programming originate studio affiliated network external sources
51512|Television Broadcasting|
515120|Television Broadcasting|images together sound operate studios facilities programming transmission programs public produce transmit visual affiliated broadcast stations turn predetermined schedule originate studio network
5152|Cable and Other Subscription Programming|
51521|Cable and Other Subscription Programming|
515210|Cable and Other Subscription Programming|studios facilities broadcasting programs broadcast typically narrowcast nature limited format news sports education youth-oriented produce acquire external sources material delivered third party
517|Telecommunications|
5173|Wired and Wireless Telecommunications Carriers|
51731|Wired and Wireless Telecommunications Carriers|maintaining access switching transmission facilities infrastructure lease voice data text sound video networks based single technology technologies exception satellite television distribution operate
517311|Wired Telecommunications Carriers|access transmission facilities infrastructure lease voice data text sound video networks based single technology technologies network operate telephony voip cable audio programming
517312|Wireless Telecommunications Carriers (except Satellite)|maintaining switching transmission facilities communications via airwaves spectrum licenses cellular phone paging internet access video telephone providers
5174|Satellite Telecommunications|
51741|Satellite Telecommunications|
517410|Satellite Telecommunications|broadcasting forwarding receiving communications signals via system satellites reselling
5179|Other Telecommunications|
51791|Other Telecommunications|purchasing access network capacity owners operators networks reselling wired wireless satellite businesses households specialized tracking communications telemetry radar station terminal stations associated
517911|Telecommunications Resellers|purchasing access network capacity owners operators networks reselling wired wireless satellite businesses households resell operate transmission facilities infrastructure mobile virtual mvnos
517919|All Other Telecommunications|specialized satellite tracking communications telemetry radar station terminal stations associated facilities connected terrestrial systems capable transmitting receiving internet voice protocol voip via
518|Data Processing, Hosting, and Related Services|
5182|Data Processing, Hosting, and Related Services|
51821|Data Processing, Hosting, and Related Services|
518210|Data Processing, Hosting, and Related Services|infrastructure specialized web streaming application software publishing general time-share mainframe facilities clients complete reports supplied automated entry optical scanning computer storage video
519|Other Information Services|
5191|Other Information Services|
51911|News Syndicates|
519110|News Syndicates|supplying information reports articles pictures features media
51912|Libraries and Archives|
519120|Libraries and Archives|library archive maintaining collections documents books journals newspapers music facilitating recorded information regardless physical form characteristics required meet informational research educational recreational
51913|Internet Publishing and Broadcasting and Web Search Portals|
519130|Internet Publishing and Broadcasting and Web Search Portals|content exclusively sites engine generate maintain extensive databases addresses easily searchable format traditional non-internet versions publish broadcast textual audio video general specific
51919|All Other Information Services|
519190|All Other Information Services|news syndicates libraries archives internet publishing broadcasting web search portals clipping telephone-based recorded stock photo agencies
52|Finance and Insurance|
521|Monetary Authorities-Central Bank|
5211|Monetary Authorities-Central Bank|
52111|Monetary Authorities-Central Bank|
521110|Monetary Authorities-Central Bank|performing banking functions issuing currency managing nation money supply international reserves holding deposits represent banks acting fiscal agent government
522|Credit Intermediation and Related Activities|
5221|Depository Credit Intermediation|
52211|Commercial Banking|
522110|Commercial Banking|accepting demand deposits making industrial consumer loans banks branches foreign
52212|Savings Institutions|
522120|Savings Institutions|accepting time deposits making mortgage real estate loans investing high-grade securities loan associations banks
52213|Credit Unions|
522130|Credit Unions|accepting members share deposits cooperatives organized offer consumer loans
52219|Other Depository Credit Intermediation|
522190|Other Depository Credit Intermediation|accepting deposits lending funds commercial banking savings institutions unions industrial banks morris plans private unincorporated
5222|Nondepository Credit Intermediation|
52221|Credit Card Issuing|
522210|Credit Card Issuing|cards issuance funds required purchase return payment full balance payments installment banks
52222|Sales Financing|
522220|Sales Financing|leasing lending money purpose collateralized contractual installment agreement directly arrangements dealers
52229|Other Nondepository Credit Intermediation|making cash loans extending instruments cards sales finance agreements consumer companies unsecured mortgage international trade financing secondary market
522291|Consumer Lending|making unsecured cash loans consumers finance companies personal credit institutions loan student small
522292|Real Estate Credit|lending funds collateral home equity mortgage companies banking nondepository
522293|International Trade Financing|working capital funds exporters lending foreign buyers domestic imported agreement corporations export-import banks edge act
522294|Secondary Market Financing|buying pooling repackaging loans sale federal home loan mortgage corporation fhlmc government national association gnma fnma student marketing slma
522298|All Other Nondepository Credit Intermediation|card issuing sales financing consumer lending real estate international trade secondary market short-term inventory agricultural cash secured personal property commodity corporation morris
5223|Activities Related to Credit Intermediation|
52231|Mortgage and Nonmortgage Loan Brokers|
522310|Mortgage and Nonmortgage Loan Brokers|arranging loans bringing borrowers lenders together commission
52232|Financial Transactions Processing, Reserve, and Clearinghouse Activities|
522320|Financial Transactions Processing, Reserve, and Clearinghouse Activities|transaction central bank liquidity check instrument automated clearinghouses credit card clearing electronic funds transfer
52239|Other Activities Related to Credit Intermediation|
522390|Other Activities Related to Credit Intermediation|facilitating mortgage loan brokerage financial transactions processing reserve clearinghouse check cashing money order issuance servicing travelers transmission payday lending
523|Securities, Commodity Contracts, and Other Financial Investments and Related Activities|
5231|Securities and Commodity Contracts Intermediation and Brokerage|
52311|Investment Banking and Securities Dealing|
523110|Investment Banking and Securities Dealing|underwriting originating maintaining markets issues bankers act principals investors buy sell account firm commitment transactions agents best effort standby commitments acting buying
52312|Securities Brokerage|
523120|Securities Brokerage|acting agents brokers between buyers sellers buying selling commission transaction mutual fund agencies brokerages stock
52313|Commodity Contracts Dealing|
523130|Commodity Contracts Dealing|acting principals investors buy sell account buying selling spot futures options precious metals foreign currency oil agricultural spread
52314|Commodity Contracts Brokerage|
523140|Commodity Contracts Brokerage|acting agents brokers buying selling spot futures options commission transaction brokerages financial
5232|Securities and Commodity Exchanges|
52321|Securities and Commodity Exchanges|
523210|Securities and Commodity Exchanges|furnishing physical electronic marketplaces purpose facilitating buying selling stocks stock options bonds contracts
5239|Other Financial Investment Activities|
52391|Miscellaneous Intermediation|
523910|Miscellaneous Intermediation|acting principals investment bankers securities dealers commodity contracts buying selling financial spread investors buy sell account clubs tax liens dealing principal mineral
52392|Portfolio Management|
523920|Portfolio Management|managing assets funds commission authority make investment decisions derive fees based size overall performance trusts pension fund mutual
52393|Investment Advice|
523930|Investment Advice|customized clients authority execute trades primary performed financial planning counseling meet goals needs specific fees paid client advisory
52399|All Other Financial Investment Activities|acting agents brokers securities brokerages commodity contracts buying selling exchanges portfolio management advice bank trust offices fiduciary agencies real estate escrow stock
523991|Trust, Fiduciary, and Custody Activities|instructed bank offices escrow agencies real estate
523999|Miscellaneous Financial Investment Activities|acting agents brokers securities brokerages commodity contracts buying selling exchanges portfolio management advice trust fiduciary custody commission exchange clearinghouses commodities stock quotation
524|Insurance Carriers and Related Activities|
5241|Insurance Carriers|
52411|Direct Life, Health, and Medical Insurance Carriers|initially underwriting assuming risk assigning premiums annuities policies disability income accidental death dismemberment
524113|Direct Life Insurance Carriers|initially underwriting assuming risk assigning premiums annuities policies disability income accidental death dismemberment
524114|Direct Health and Medical Insurance Carriers|initially underwriting assuming risk assigning premiums policies group hospitalization plans hmo care
52412|Direct Insurance (except Life, Health, and Medical) Carriers|initially underwriting assuming risk assigning premiums policies disability income accidental death dismemberment automobile property casualty bank deposit title real estate mortgage guaranty
524126|Direct Property and Casualty Insurance Carriers|initially underwriting assuming risk assigning premiums policies protect policyholders against losses occur result damage liability automobile malpractice fidelity mortgage guaranty homeowners surety
524127|Direct Title Insurance Carriers|initially underwriting assuming risk assigning premiums policies protect owners real estate creditors against loss sustained reason defect property
524128|Other Direct Insurance (except Life, Health, and Medical) Carriers|initially underwriting assuming risk assigning premiums policies disability income accidental death dismemberment property casualty title bank deposit warranty share appliance automobile homeowners
52413|Reinsurance Carriers|
524130|Reinsurance Carriers|assuming part risk associated existing insurance policies originally underwritten
5242|Agencies, Brokerages, and Other Insurance Related Activities|
52421|Insurance Agencies and Brokerages|
524210|Insurance Agencies and Brokerages|acting agents brokers selling annuities policies
52429|Other Insurance Related Activities|agencies brokerages claims adjusting plan administrative third party actuarial
524291|Claims Adjusting|investigating appraising settling insurance
524292|Third Party Administration of Insurance and Pension Funds|claims processing administrative carriers employee benefit plans self-insurance
524298|All Other Insurance Related Activities|agencies brokerages claims adjusting third party administration advisory actuarial ratemaking
525|Funds, Trusts, and Other Financial Vehicles|
5251|Insurance and Employee Benefit Funds|
52511|Pension Funds|
525110|Pension Funds|legal entities plans programs organized retirement income benefits exclusively sponsor employees members employee benefit
52512|Health and Welfare Funds|
525120|Health and Welfare Funds|legal entities plans programs organized medical surgical hospital vacation training welfare-related employee benefits exclusively sponsor employees members
52519|Other Insurance Funds|
525190|Other Insurance Funds|legal entities pension health welfare-related employee benefit organized exclusively sponsor firm employees members self-insurance workers compensation
5259|Other Investment Pools and Funds|
52591|Open-End Investment Funds|
525910|Open-End Investment Funds|legal entities open-end organized pool assets consist securities financial instruments shares pools offered public initial offering additional continuously perpetually redeemed specific price
52592|Trusts, Estates, and Agency Accounts|
525920|Trusts, Estates, and Agency Accounts|legal entities administered behalf beneficiaries terms trust agreement bankruptcy private administering personal investment testamentary
52599|Other Financial Vehicles|
525990|Other Financial Vehicles|legal entities funds insurance employee benefit open-end investment trusts estates agency accounts mortgage real estate reits closed-end special purpose collateralized obligations cmos
53|Real Estate and Rental and Leasing|
531|Real Estate|
5311|Lessors of Real Estate|
53111|Lessors of Residential Buildings and Dwellings|
531110|Lessors of Residential Buildings and Dwellings|acting residences single-family homes apartment town owner-lessors renting real estate subleasing manage property themselves another
53112|Lessors of Nonresidential Buildings (except Miniwarehouses)|
531120|Lessors of Nonresidential Buildings (except Miniwarehouses)|acting self-storage units residences dwellings owner-lessors renting real estate subleasing full office space whether lease manage property themselves another
53113|Lessors of Miniwarehouses and Self-Storage Units|
531130|Lessors of Miniwarehouses and Self-Storage Units|renting leasing space self-storage secure rooms compartments lockers containers outdoor clients store retrieve
53119|Lessors of Other Real Estate Property|
531190|Lessors of Other Real Estate Property|acting buildings manufactured home mobile sites vacant lots grazing land
5312|Offices of Real Estate Agents and Brokers|
53121|Offices of Real Estate Agents and Brokers|
531210|Offices of Real Estate Agents and Brokers|acting selling buying renting
5313|Activities Related to Real Estate|
53131|Real Estate Property Managers|managing management ensuring associated overall performed collecting rents overseeing maintenance security trash removal
531311|Residential Property Managers|managing real estate
531312|Nonresidential Property Managers|managing real estate
53132|Offices of Real Estate Appraisers|
531320|Offices of Real Estate Appraisers|estimating fair market value
53139|Other Activities Related to Real Estate|
531390|Other Activities Related to Real Estate|performing lessors offices agents brokers property managers appraisers escrow agencies listing fiduciaries
532|Rental and Leasing Services|
5321|Automotive Equipment Rental and Leasing|
53211|Passenger Car Rental and Leasing|renting cars drivers
532111|Passenger Car Rental|renting cars drivers short periods time
532112|Passenger Car Leasing|cars drivers long periods time
53212|Truck, Utility Trailer, and RV (Recreational Vehicle) Rental and Leasing|
532120|Truck, Utility Trailer, and RV (Recreational Vehicle) Rental and Leasing|renting drivers trucks tractors buses semi-trailers trailers rvs vehicles
5322|Consumer Goods Rental|
53221|Consumer Electronics and Appliances Rental|
532210|Consumer Electronics and Appliances Rental|renting equipment televisions stereos refrigerators appliance centers
53228|Other Consumer Goods Rental|renting electronics appliances costume formal wear furniture residential centers hospital bed leasing home party supply sporting video disc electronic equipment dvd
532281|Formal Wear and Costume Rental|renting clothing costumes theatrical laundered uniforms work apparel
532282|Video Tape and Disc Rental|renting prerecorded tapes discs home electronic equipment
532283|Home Health Equipment Rental|renting home-type invalid wheel chairs hospital beds oxygen tanks walkers crutches
532284|Recreational Goods Rental|renting bicycles canoes motorcycles skis sailboats beach chairs umbrellas
532289|All Other Consumer Goods Rental|renting electronics appliances formal wear costumes prerecorded video tapes discs home electronic equipment health furniture recreational centers party supply
5323|General Rental Centers|
53231|General Rental Centers|
532310|General Rental Centers|renting range consumer commercial industrial equipment typically operate conveniently located facilities maintain inventories rent short periods time often limited audio visual contractors
5324|Commercial and Industrial Machinery and Equipment Rental and Leasing|
53241|Construction, Transportation, Mining, and Forestry Machinery and Equipment Rental and Leasing|renting operators heavy off-highway rent lease aircraft railroad cars steamships tugboats bulldozers earthmoving drilling cranes
532411|Commercial Air, Rail, and Water Transportation Equipment Rental and Leasing|renting off-highway operators aircraft railroad cars steamships tugboats
532412|Construction, Mining, and Forestry Machinery and Equipment Rental and Leasing|renting heavy operators bulldozers earthmoving drilling cranes
53242|Office Machinery and Equipment Rental and Leasing|
532420|Office Machinery and Equipment Rental and Leasing|renting computers furniture duplicating machines copiers facsimile
53249|Other Commercial and Industrial Machinery and Equipment Rental and Leasing|
532490|Other Commercial and Industrial Machinery and Equipment Rental and Leasing|renting nonconsumer-type heavy construction transportation mining forestry operators office rent lease manufacturing metalworking telecommunications motion picture theatrical institutional public building furniture schools
533|Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)|
5331|Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)|
53311|Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)|
533110|Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)|assigning rights patents trademarks brand names franchise agreements royalty payment licensing paid asset holder
54|Professional, Scientific, and Technical Services|
541|Professional, Scientific, and Technical Services|
5411|Legal Services|
54111|Offices of Lawyers|
541110|Offices of Lawyers|legal practitioners attorneys counselors-at-law practice law expertise range specific areas criminal corporate family estate patent real tax
54112|Offices of Notaries|
541120|Offices of Notaries|lawyers attorneys drafting approving executing legal documents real estate transactions wills contracts receiving indexing storing
54119|Other Legal Services|practitioners lawyers attorneys specialized paralegal notary public process serving real estate settlement offices patent agent filing searching title abstract companies
541191|Title Abstract and Settlement Offices|lawyers attorneys researching public land records gather information relating real estate titles preparing documents necessary transfer financing conducting final settlements closings filing
541199|All Other Legal Services|practitioners offices lawyers attorneys settlement title abstract specialized paralegal notary public patent agent filing searching process serving
5412|Accounting, Tax Preparation, Bookkeeping, and Payroll Services|
54121|Accounting, Tax Preparation, Bookkeeping, and Payroll Services|auditing records designing systems preparing financial statements developing budgets returns processing payrolls billing accountants offices return
541211|Offices of Certified Public Accountants|audit accounting records private organizations attest compliance accepted practices cpas auditing financial statements designing systems preparing developing budgets advice matters bookkeeping tax
541213|Tax Preparation Services|offices cpas return accounting bookkeeping billing payroll processing basic knowledge law filing requirements required
541214|Payroll Services|offices cpas accounting bookkeeping billing collecting information hours worked pay rates deductions payroll-related data clients generate paychecks reports tax filings processing tabulating
541219|Other Accounting Services|offices cpas tax return preparation payroll accountant cpa bookkeeper billing
5413|Architectural, Engineering, and Related Services|
54131|Architectural Services|
541310|Architectural Services|planning designing residential institutional leisure commercial industrial buildings structures applying knowledge design construction procedures zoning regulations building codes materials
54132|Landscape Architectural Services|
541320|Landscape Architectural Services|planning designing development land areas projects parks recreational airports highways hospitals schools subdivisions commercial industrial residential applying knowledge characteristics location buildings structures
54133|Engineering Services|
541330|Engineering Services|applying physical laws principles design development utilization machines materials instruments structures processes systems assignments undertaken involve provision advice preparation feasibility studies preliminary
54134|Drafting Services|
541340|Drafting Services|drawing detailed layouts plans illustrations buildings structures systems components engineering architectural specifications
54135|Building Inspection Services|
541350|Building Inspection Services|typically evaluate aspects structure component systems prepare report physical condition property buyers involved real estate transactions bureaus home
54136|Geophysical Surveying and Mapping Services|
541360|Geophysical Surveying and Mapping Services|gathering interpreting data often specialize locating measuring extent subsurface resources oil gas minerals conduct surveys engineering purposes techniques depending purpose survey magnetic
54137|Surveying and Mapping (except Geophysical) Services|
541370|Surveying and Mapping (except Geophysical) Services|performing surface earth sea floor areas above below creation view easements segregating rights parcels land creating underground utility cadastral cartographic topographic geodetic
54138|Testing Laboratories|
541380|Testing Laboratories|performing physical chemical analytical acoustics vibration assaying biological medical veterinary calibration electrical electronic geotechnical mechanical nondestructive thermal occur laboratory on-site
5414|Specialized Design Services|
54141|Interior Design Services|
541410|Interior Design Services|planning designing administering projects spaces meet physical aesthetic needs people taking consideration building codes health safety regulations traffic patterns floor mechanical electrical
54142|Industrial Design Services|
541420|Industrial Design Services|creating developing designs specifications optimize value appearance determination materials construction mechanisms shape color surface finishes taking consideration human characteristics needs safety market
54143|Graphic Design Services|
541430|Graphic Design Services|planning designing managing production visual communication order convey specific messages concepts clarify complex information project identities printed materials packaging advertising signage systems
54149|Other Specialized Design Services|
541490|Other Specialized Design Services|professional architectural landscape architecture engineering interior industrial graphic computer systems costume independent theatrical designers jewelry fashion float shoe fur textile
5415|Computer Systems Design and Related Services|
54151|Computer Systems Design and Related Services|expertise field information technologies writing modifying testing supporting software meet needs particular customer planning designing integrate hardware communication on-site management clients data
541511|Custom Computer Programming Services|writing modifying testing supporting software meet needs particular customer
541512|Computer Systems Design Services|planning designing integrate hardware software communication technologies components system company part integrated third parties vendors often install train support users integration consulting
541513|Computer Facilities Management Services|on-site clients systems data processing support
541519|Other Computer Related Services|custom programming systems integration design facilities management disaster recovery software installation
5416|Management, Scientific, and Technical Consulting Services|
54161|Management Consulting Services|advice assistance businesses organizations issues strategic organizational planning financial budgeting marketing objectives policies human resource practices production scheduling control actuarial benefit compensation
541611|Administrative Management and General Management Consulting Services|advice assistance businesses organizations issues financial planning budgeting equity asset records office strategic organizational site selection business start-up process improvement consultants full
541612|Human Resources Consulting Services|advice assistance businesses organizations areas resource personnel policies practices procedures employee benefits planning communication administration compensation systems wage salary benefit assessment management
541613|Marketing Consulting Services|advice assistance businesses organizations issues developing objectives policies sales forecasting pricing licensing franchise planning strategy customer management development
541614|Process, Physical Distribution, and Logistics Consulting Services|advice assistance businesses organizations manufacturing improvement productivity production planning control quality assurance inventory management networks warehouse utilization transportation shipment materials handling freight
541618|Other Management Consulting Services|administrative general human resources marketing process physical distribution logistics telecommunications utilities
54162|Environmental Consulting Services|
541620|Environmental Consulting Services|advice assistance businesses organizations issues control contamination pollutants toxic substances hazardous materials identify problems inspect buildings measure evaluate risks recommend solutions employ
54169|Other Scientific and Technical Consulting Services|
541690|Other Scientific and Technical Consulting Services|advice assistance businesses organizations issues environmental agricultural motion picture biological physics chemical radio economic safety energy security
5417|Scientific Research and Development Services|
54171|Research and Development in the Physical, Engineering, and Life Sciences|conducting experimental agriculture electronics environmental biology botany biotechnology computers chemistry food fisheries forests geology health mathematics medicine nanotechnology oceanography pharmacy physics veterinary
541713|Research and Development in Nanotechnology|conducting experimental involves study matter nanoscale scale about nanometers result processes prototypes altered materials reproduced utilized implemented
541714|Research and Development in Biotechnology (except Nanobiotechnology)|conducting experimental involves study microorganisms cellular biomolecular processes develop alter living non-living materials result prototypes genetically-altered reproduced utilized implemented cloning laboratories dna
541715|Research and Development in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)|conducting experimental agriculture electronics environmental biology botany computers chemistry food fisheries forests geology health mathematics medicine oceanography pharmacy physics veterinary allied subjects
54172|Research and Development in the Social Sciences and Humanities|
541720|Research and Development in the Social Sciences and Humanities|conducting analyses cognitive sociology psychology language behavior economic science
5418|Advertising, Public Relations, and Related Services|
54181|Advertising Agencies|
541810|Advertising Agencies|creating campaigns placing periodicals newspapers radio television media organized full range in-house capabilities subcontracting advice creative account management production material planning buying
54182|Public Relations Agencies|
541820|Public Relations Agencies|designing implementing campaigns designed promote interests image clients lobbying political consulting
54183|Media Buying Agencies|
541830|Media Buying Agencies|purchasing advertising time space outlets reselling individual companies directly
54184|Media Representatives|
541840|Media Representatives|independent selling time space owners newspaper advertising radio publishers television
54185|Outdoor Advertising|
541850|Outdoor Advertising|creating designing public display campaign materials printed painted electronic displays placing indoor billboards panels transit vehicles facilities shopping malls retail in-store structures
54186|Direct Mail Advertising|
541860|Direct Mail Advertising|creating designing campaigns purpose distributing materials coupons flyers samples specialties keychains magnets pens customized messages imprinted distribution preparing mailing compile maintain sell
54187|Advertising Material Distribution Services|
541870|Advertising Material Distribution Services|direct delivery advertisements circulars coupons handbills samples methods delivering door-to-door placing flyers car windshields parking lots handing retail stores
54189|Other Services Related to Advertising|
541890|Other Services Related to Advertising|agency public relations media buying representative display direct mail material distribution marketing consulting specialties keychains magnets pens sign lettering painting store window
5419|Other Professional, Scientific, and Technical Services|
54191|Marketing Research and Public Opinion Polling|
541910|Marketing Research and Public Opinion Polling|systematically gathering recording tabulating presenting data broadcast media rating political analysis statistical sampling
54192|Photographic Services|still video digital photography specialize particular field commercial industrial portrait special events studios
541921|Photography Studios, Portrait|still video digital home school passport videotaping special events weddings
541922|Commercial Photography|advertising agencies publishers business industrial users
54193|Translation and Interpretation Services|
541930|Translation and Interpretation Services|translating written material interpreting speech language another sign
54194|Veterinary Services|
541940|Veterinary Services|licensed practitioners practice medicine dentistry surgery animals testing animal hospitals clinics veterinarians offices laboratories
54199|All Other Professional, Scientific, and Technical Services|
541990|All Other Professional, Scientific, and Technical Services|provision legal accounting tax preparation bookkeeping architectural engineering specialized design computer systems management consulting research development advertising public relations market opinion polling
55|Management of Companies and Enterprises|
551|Management of Companies and Enterprises|
5511|Management of Companies and Enterprises|
55111|Management of Companies and Enterprises|holding securities equity interests purpose owning controlling interest influencing decisions government administer oversee manage company enterprise normally undertake strategic organizational planning decision-making
551111|Offices of Bank Holding Companies|legal entities securities equity interests enterprises purpose owning controlling interest influencing management decisions firms administer oversee manage company enterprise whose hold
551112|Offices of Other Holding Companies|legal entities bank securities equity interests enterprises purpose owning controlling interest influencing management decisions firms administer oversee manage company enterprise whose hold
551114|Corporate, Subsidiary, and Regional Managing Offices|government administering overseeing company enterprise normally undertake strategic organizational planning decision-making role hold securities centralized administrative head holding companies manage district management
56|Administrative and Support and Waste Management and Remediation Services|
561|Administrative and Support Services|
5611|Office Administrative Services|
56111|Office Administrative Services|
561110|Office Administrative Services|range day-to-day financial planning billing recordkeeping personnel physical distribution logistics staff carry complete business
5612|Facilities Support Services|
56121|Facilities Support Services|
561210|Facilities Support Services|staff perform client typically janitorial maintenance trash disposal guard security mail routing reception laundry carry involved responsible core business computer data processing
5613|Employment Services|
56131|Employment Placement Agencies and Executive Search Services|listing vacancies referring placing applicants recruitment
561311|Employment Placement Agencies|listing vacancies referring placing applicants individuals referred placed employees babysitting bureaus registries casting motion picture theatrical video model
561312|Executive Search Services|recruitment placement clients specific senior management position requirements range developing strategy specification based culture needs client researching identifying screening interviewing candidates verifying
56132|Temporary Help Services|
561320|Temporary Help Services|supplying workers clients businesses limited periods time supplement working force client individuals employees however direct supervision work sites supply model labor farm
56133|Professional Employer Organizations|
561330|Professional Employer Organizations|human resources resource management client businesses households operate co-employment relationship specialized performing wide range personnel duties payroll tax benefits administration workers compensation
5614|Business Support Services|
56141|Document Preparation Services|
561410|Document Preparation Services|letter resume writing editing proofreading typing word processing desktop publishing stenography court reporting stenotype recording transcription secretarial
56142|Telephone Call Centers|answering calls relaying messages clients telemarketing promoting taking orders soliciting contributions information never representing originate receive
561421|Telephone Answering Services|calls relaying messages clients
561422|Telemarketing Bureaus and Other Contact Centers|call initiate receive communications via telephone facsimile email communication modes purposes promoting clients taking orders soliciting contributions client information assistance regarding representing
56143|Business Service Centers|mailbox rental postal mailing direct mail advertising copy shops photocopying duplicating blueprinting document copying printing offset quick digital prepress range office support
561431|Private Mail Centers|mailbox rental postal mailing direct advertising along office support facsimile word processing on-site sales
561439|Other Business Service Centers (including Copy Shops)|photocopying duplicating blueprinting document copying printing offset quick digital prepress private mail range office support facsimile word processing on-site rental sales
56144|Collection Agencies|
561440|Collection Agencies|collecting payments claims remitting collected clients account delinquent tax bill debt
56145|Credit Bureaus|
561450|Credit Bureaus|compiling information employment histories financial institutions retailers need evaluate creditworthiness individuals businesses agencies rating investigation reporting
56149|Other Business Support Services|secretarial document preparation telephone answering telemarketing private mail copying conducted separate conjunction office monetary debt collection credit reporting address bar coding presorting
561491|Repossession Services|repossessing tangible assets automobiles boats equipment planes furniture appliances creditor result delinquent debts
561492|Court Reporting and Stenotype Services|verbatim recording live legal proceedings transcribing subsequent recorded materials real-time simultaneous closed captioning television performances meetings conferences public stenography
561499|All Other Business Support Services|secretarial document preparation telephone answering telemarketing private mail copying conducted separate conjunction office monetary debt collection credit reporting repossession court stenotype recording
5615|Travel Arrangement and Reservation Services|
56151|Travel Agencies|
561510|Travel Agencies|acting agents selling tour accommodation general public commercial clients
56152|Tour Operators|
561520|Tour Operators|arranging assembling tours sold travel agencies wholesale
56159|Other Travel Arrangement and Reservation Services|agencies tour operators condominium time-share exchange road automobile clubs convention visitors bureaus ticket airline bus cruise ship sports theatrical offices car rental
561591|Convention and Visitors Bureaus|marketing promoting communities facilities businesses leisure travelers range assisting organizations locating meeting sites travel information area attractions lodging accommodations restaurants maps organizing
561599|All Other Travel Arrangement and Reservation Services|agencies tour operators convention visitors bureaus condominium time-share exchange ticket airline bus cruise ship sports theatrical offices car rental hotel restaurant amusement
5616|Investigation and Security Services|
56161|Investigation, Guard, and Armored Car Services|detective patrol picking delivering money receipts valuable personnel equipment protect properties transit private bodyguard security polygraph
561611|Investigation Services|detective fingerprinting private polygraph investigative
561612|Security Guards and Patrol Services|guard bodyguard dog parking
561613|Armored Car Services|picking delivering money receipts valuable maintain personnel equipment protect properties transit
56162|Security Systems Services|selling burglar fire alarms locking devices along installation repair monitoring remote electronic alarm
561621|Security Systems Services (except Locksmiths)|selling alarm burglar fire alarms along installation repair monitoring remote electronic
561622|Locksmiths|selling mechanical electronic locking devices safes security vaults along installation repair rebuilding adjusting installing repairing
5617|Services to Buildings and Dwellings|
56171|Exterminating and Pest Control Services|
561710|Exterminating and Pest Control Services|controlling birds mosquitoes rodents termites insects pests crop production forestry fumigation
56172|Janitorial Services|
561720|Janitorial Services|cleaning building interiors transportation equipment aircraft rail cars ships windows custodial station degreasing housekeeping washroom sanitation maid
56173|Landscaping Services|
561730|Landscaping Services|landscape care maintenance installing trees shrubs plants lawns gardens along design plans construction installation walkways retaining walls decks fences ponds structures
56174|Carpet and Upholstery Cleaning Services|
561740|Carpet and Upholstery Cleaning Services|dyeing rugs carpets
56179|Other Services to Buildings and Dwellings|
561790|Other Services to Buildings and Dwellings|exterminating pest control janitorial landscaping care maintenance carpet upholstery cleaning building exterior sandblasting window swimming pool chimney ventilation duct drain gutter
5619|Other Support Services|
56191|Packaging and Labeling Services|
561910|Packaging and Labeling Services|client-owned materials imprinting package apparel textile folding kit assembling blister shrink wrapping gift
56192|Convention and Trade Show Organizers|
561920|Convention and Trade Show Organizers|organizing promoting managing events business shows conventions conferences meetings whether manage staff operate facilities take place
56199|All Other Support Services|
561990|All Other Support Services|day-to-day business organizational office administrative facilities employment travel arrangement reservation security investigation buildings structures packaging labeling convention trade show organizing bartering flagging
562|Waste Management and Remediation Services|
5621|Waste Collection|
56211|Waste Collection|collecting hauling hazardous nonhazardous recyclable materials local area transfer stations responsible identification treatment packaging labeling purposes transport
562111|Solid Waste Collection|collecting hauling nonhazardous garbage local area transfer stations mixed recyclable materials
562112|Hazardous Waste Collection|collecting hauling local area transfer stations responsible identification treatment packaging labeling purposes transport
562119|Other Waste Collection|collecting hauling nonhazardous solid hazardous local area brush rubble removal
5622|Waste Treatment and Disposal|
56221|Waste Treatment and Disposal|facilities sewer systems sewage combined collecting hauling materials local area combustors incinerators produce byproducts electricity solid landfills compost dumps
562211|Hazardous Waste Treatment and Disposal|facilities combined collecting hauling materials local area
562212|Solid Waste Landfill|landfills disposal nonhazardous combined collecting hauling materials local area produce byproducts methane
562213|Solid Waste Combustors and Incinerators|disposal nonhazardous produce byproducts electricity steam
562219|Other Nonhazardous Waste Treatment and Disposal|facilities landfills combustors incinerators sewer systems sewage combined collecting hauling materials local area compost dumps
5629|Remediation and Other Waste Management Services|
56291|Remediation Services|
562910|Remediation Services|cleanup contaminated buildings mine sites soil ground water integrated reclamation demolition waste treatment hazardous material removal contouring land revegetation asbestos lead paint
56292|Materials Recovery Facilities|
562920|Materials Recovery Facilities|separating sorting recyclable nonhazardous waste streams garbage commingled paper plastics beverage cans metals sorted distinct categories
56299|All Other Waste Management Services|collection treatment disposal remediation materials recovery facilities consulting beach cleaning maintenance pumping cesspools portable toilets septic tanks cesspool sewer rodding toilet renting
562991|Septic Tank and Related Services|pumping cleaning tanks cesspools renting servicing portable toilets
562998|All Other Miscellaneous Waste Management Services|collection treatment disposal remediation materials recovery facilities septic tank pumping consulting beach cleaning maintenance sewer storm basin cleanout catch commercial industrial rodding
61|Educational Services|
611|Educational Services|
6111|Elementary and Secondary Schools|
61111|Elementary and Secondary Schools|
611110|Elementary and Secondary Schools|furnishing academic courses associated course work basic preparatory education ordinarily constitutes kindergarten grade school boards districts parochial high primary kindergartens physically disabled
6112|Junior Colleges|
61121|Junior Colleges|
611210|Junior Colleges|furnishing academic technical courses granting associate degrees certificates diplomas below baccalaureate level requirement admission equivalent degree program least high school diploma general
6113|Colleges, Universities, and Professional Schools|
61131|Colleges, Universities, and Professional Schools|
611310|Colleges, Universities, and Professional Schools|furnishing academic courses granting degrees baccalaureate graduate levels requirement admission least high school diploma equivalent general training instruction diverse settings client facilities
6114|Business Schools and Computer and Management Training|
61141|Business and Secretarial Schools|
611410|Business and Secretarial Schools|offering courses office procedures stenographic skills offer basic word processing addition classes machine reception communications designed individuals pursuing clerical career instruction diverse
61142|Computer Training|
611420|Computer Training|conducting repair programming software packages computerized business systems electronics technology local area network management instruction diverse settings client facilities educational institutions workplace
61143|Professional and Management Development Training|
611430|Professional and Management Development Training|offering array short duration courses seminars career directly individuals employers programs customized modified meet special needs customers instruction diverse settings client facilities
6115|Technical and Trade Schools|
61151|Technical and Trade Schools|offering vocational training subjects trades often leads job-specific certification instruction diverse settings client facilities educational institutions workplace home means correspondence television internet
611511|Cosmetology and Barber Schools|offering training barbering hair styling cosmetic arts makeup skin care job-specific certification
611512|Flight Training|offering aviation offer vocational recreational
611513|Apprenticeship Training|offering programs involve applied course work
611519|Other Technical and Trade Schools|offering job career vocational courses cosmetology barber training aviation flight apprenticeship curriculums offered highly structured specialized lead job-specific certification bartending modeling broadcasting
6116|Other Schools and Instruction|
61161|Fine Arts Schools|
611610|Fine Arts Schools|offering instruction dance art drama music commercial graphic piano guitar academic studios performing photography
61162|Sports and Recreation Instruction|
611620|Sports and Recreation Instruction|camps schools offering athletic groups individuals overnight day professional instructors participating sporting events cheerleading riding academies gymnastics baseball basketball football golf martial
61163|Language Schools|
611630|Language Schools|offering foreign instruction sign designed offer ranging conversational skills personal enrichment intensive training courses career educational opportunities
61169|All Other Schools and Instruction|offering business computer management technical trade fine arts athletic language excluded academic colleges universities tutoring public speaking training automobile driving speed reading
611691|Exam Preparation and Tutoring|offering standardized examinations academic learning centers remedial courses college board professional examination review instruction
611692|Automobile Driving Schools|offering instruction
611699|All Other Miscellaneous Schools and Instruction|offering business computer management technical trade fine arts athletic language tutoring automobile driving excluded academic colleges universities public speaking training survival speed
6117|Educational Support Services|
61171|Educational Support Services|
611710|Educational Support Services|non-instructional processes systems consultants testing guidance counseling student exchange programs evaluation
62|Health Care and Social Assistance|
621|Ambulatory Health Care Services|
6211|Offices of Physicians|
62111|Offices of Physicians|health practitioners having degree doctor medicine osteopathy independent practice general specialized anesthesiology oncology ophthalmology psychiatry surgery operate private group practices centers clinics
621111|Offices of Physicians (except Mental Health Specialists)|practitioners having degree doctor medicine osteopathy independent practice general specialized psychiatry psychoanalysis surgery operate private group practices centers clinics facilities hospitals hmo
621112|Offices of Physicians, Mental Health Specialists|practitioners having degree doctor medicine osteopathy independent practice psychiatry psychoanalysis operate private group practices centers clinics facilities hospitals hmo medical
6212|Offices of Dentists|
62121|Offices of Dentists|
621210|Offices of Dentists|health practitioners having degree doctor dental medicine surgery science independent practice general specialized dentistry operate private group practices centers clinics facilities hospitals
6213|Offices of Other Health Practitioners|
62131|Offices of Chiropractors|
621310|Offices of Chiropractors|health practitioners having degree doctor chiropractic independent practice diagnostic therapeutic treatment neuromusculoskeletal disorders manipulation adjustment spinal column extremities operate private group practices
62132|Offices of Optometrists|
621320|Offices of Optometrists|health practitioners having degree doctor optometry independent practice examine diagnose treat manage diseases disorders visual system eye associated structures systemic conditions prescribe
62133|Offices of Mental Health Practitioners (except Physicians)|
621330|Offices of Mental Health Practitioners (except Physicians)|independent diagnosis treatment emotional behavioral disorders individual group social dysfunction brought about causes illness alcohol substance abuse physical trauma stress operate private
62134|Offices of Physical, Occupational and Speech Therapists, and Audiologists|
621340|Offices of Physical, Occupational and Speech Therapists, and Audiologists|independent health practitioners therapy patients impairments functional limitations disabilities changes functions status resulting injury disease causes require prevention wellness fitness planning administering
62139|Offices of All Other Health Practitioners|independent physicians dentists chiropractors optometrists mental specialists physical occupational speech therapists audiologists operate private group practices centers clinics facilities hospitals hmo medical
621391|Offices of Podiatrists|health practitioners having degree doctor podiatric medicine independent practice podiatry diagnose treat diseases deformities foot operate private group practices centers clinics facilities
621399|Offices of All Other Miscellaneous Health Practitioners|independent physicians dentists chiropractors optometrists mental specialists physical occupational speech therapists audiologists podiatrists operate private group practices centers clinics facilities hospitals hmo
6214|Outpatient Care Centers|
62141|Family Planning Centers|
621410|Family Planning Centers|medical staff range outpatient contraceptive genetic prenatal counseling voluntary sterilization therapeutic medically induced termination pregnancy birth control clinics fertility childbirth preparation classes
62142|Outpatient Mental Health and Substance Abuse Centers|
621420|Outpatient Mental Health and Substance Abuse Centers|medical staff diagnosis treatment disorders alcohol treat patients require inpatient counseling information regarding wide range issues refer extensive programs necessary alcoholism clinics
62149|Other Outpatient Care Centers|medical staff general specialized family planning mental health substance abuse clinics practitioners different degrees practicing doctor medicine dental dialysis biofeedback freestanding ambulatory
621491|HMO Medical Centers|physicians staff range outpatient health maintenance organization subscribers focus primary care owned underwrite insurance policies
621492|Kidney Dialysis Centers|medical staff outpatient renal
621493|Freestanding Ambulatory Surgical and Emergency Centers|physicians medical staff orthoscopic cataract surgery outpatient care setting broken bones treating lacerations tending patients suffering injuries result accidents trauma conditions necessitating
621498|All Other Outpatient Care Centers|medical staff general specialized family planning mental health substance abuse hmo kidney dialysis freestanding ambulatory surgical emergency clinics practitioners different degrees practicing
6215|Medical and Diagnostic Laboratories|
62151|Medical and Diagnostic Laboratories|analytic body fluid analysis imaging profession patient referral health practitioner dental x-ray pathology centers testing forensic
621511|Medical Laboratories|analytic diagnostic body fluid analysis profession patient referral health practitioner blood pathology bacteriological testing forensic
621512|Diagnostic Imaging Centers|producing images patient referral health practitioner computer tomography ct-scan medical radiological laboratories dental x-ray ultrasound magnetic resonance mri
6216|Home Health Care Services|
62161|Home Health Care Services|
621610|Home Health Care Services|skilled nursing along range personal homemaker companion physical therapy medical social medications equipment supplies counseling hour occupation vocational dietary nutritional speech audiology
6219|Other Ambulatory Health Care Services|
62191|Ambulance Services|
621910|Ambulance Services|transportation patients ground air along medical care often during emergency restricted emergencies vehicles equipped lifesaving equipment operated medically trained personnel
62199|All Other Ambulatory Health Care Services|offices physicians dentists practitioners outpatient centers medical diagnostic laboratories home providers ambulances blood donor stations pacemaker monitoring body organ banks physical fitness
621991|Blood and Organ Banks|collecting storing distributing body organs
621999|All Other Miscellaneous Ambulatory Health Care Services|offices physicians dentists practitioners outpatient centers medical diagnostic laboratories home providers ambulances blood organ banks screening physical fitness evaluation hearing testing audiologists
622|Hospitals|
6221|General Medical and Surgical Hospitals|
62211|General Medical and Surgical Hospitals|
622110|General Medical and Surgical Hospitals|licensed diagnostic treatment nonsurgical inpatients wide conditions maintain inpatient beds patients food meet nutritional requirements organized staff physicians patient care outpatient anatomical
6222|Psychiatric and Substance Abuse Hospitals|
62221|Psychiatric and Substance Abuse Hospitals|
622210|Psychiatric and Substance Abuse Hospitals|licensed diagnostic medical treatment monitoring inpatients suffer mental illness disorders often requires extended stay hospital maintain inpatient beds patients food meet nutritional
6223|Specialty (except Psychiatric and Substance Abuse) Hospitals|
62231|Specialty (except Psychiatric and Substance Abuse) Hospitals|
622310|Specialty (except Psychiatric and Substance Abuse) Hospitals|licensed diagnostic medical treatment inpatients specific disease condition long-term care chronically ill rehabilitation restorative adjustive physically challenged disabled people maintain inpatient beds
623|Nursing and Residential Care Facilities|
6231|Nursing Care Facilities (Skilled Nursing Facilities)|
62311|Nursing Care Facilities (Skilled Nursing Facilities)|
623110|Nursing Care Facilities (Skilled Nursing Facilities)|inpatient rehabilitative extended period time individuals requiring permanent core staff registered licensed practical nurses along continuous personal convalescent homes hospitals psychiatric assisted
6232|Residential Intellectual and Developmental Disability, Mental Health, and Substance Abuse Facilities|
62321|Residential Intellectual and Developmental Disability Facilities|
623210|Residential Intellectual and Developmental Disability Facilities|group homes hospitals intermediate care persons diagnosed disabilities health though focus room board protective supervision counseling
62322|Residential Mental Health and Substance Abuse Facilities|
623220|Residential Mental Health and Substance Abuse Facilities|care treatment patients illnesses room board supervision counseling although medical available incidental rehabilitation support offered wide range social addition alcoholism drug addiction
6233|Continuing Care Retirement Communities and Assisted Living Facilities for the Elderly|
62331|Continuing Care Retirement Communities and Assisted Living Facilities for the Elderly|residential personal persons unable fully themselves desire live independently typically room board supervision assistance daily housekeeping instances skilled nursing residents separate on-site
623311|Continuing Care Retirement Communities|range residential personal on-site nursing facilities elderly persons unable fully themselves desire live independently individuals settings meals housekeeping social leisure available assist
623312|Assisted Living Facilities for the Elderly|residential personal care on-site nursing persons unable fully themselves desire live independently typically room board supervision assistance daily housekeeping rest homes
6239|Other Residential Care Facilities|
62399|Other Residential Care Facilities|
623990|Other Residential Care Facilities|intellectual developmental disability mental health substance abuse continuing retirement communities assisted living elderly supervision personal boot disciplinary camps correctional delinquent youth group
624|Social Assistance|
6241|Individual and Family Services|
62411|Child and Youth Services|
624110|Child and Youth Services|nonresidential social assistance children welfare areas adoption foster care drug prevention life skills training positive development agencies centers recreational guidance organizations self-help
62412|Services for the Elderly and Persons with Disabilities|
624120|Services for the Elderly and Persons with Disabilities|nonresidential social assistance improve quality life diagnosed intellectual developmental welfare individuals areas day care non-medical home homemaker group support companionship
62419|Other Individual and Family Services|
624190|Other Individual and Family Services|nonresidential social assistance specifically directed toward children elderly persons diagnosed intellectual developmental disabilities community action agencies marriage counseling offices mental health practitioners
6242|Community Food and Housing, and Emergency and Other Relief Services|
62421|Community Food Services|
624210|Community Food Services|collection preparation delivery needy distribute clothing blankets poor prepare deliver meals persons reason age disability illness unable themselves collect salvageable donated fixed
62422|Community Housing Services|short-term emergency shelter victims domestic violence sexual assault child abuse temporary residential homeless runaway youths patients families caught medical crises transitional low-income
624221|Temporary Shelters|short-term emergency shelter victims domestic violence sexual assault child abuse residential homeless individuals families runaway youth patients caught medical crises operate subsidize
624229|Other Community Housing Services|transitional low-income individuals families volunteer construction repair low-cost partnership homeowner assist work homes elderly disabled homeowners subsidize existing apartments hotels motels require
62423|Emergency and Other Relief Services|
624230|Emergency and Other Relief Services|food shelter clothing medical resettlement counseling victims domestic international disasters conflicts wars
6243|Vocational Rehabilitation Services|
62431|Vocational Rehabilitation Services|
624310|Vocational Rehabilitation Services|habilitation job counseling training work experience unemployed underemployed persons disabilities market disadvantage because lack education skill employment facilities schools sheltered workshops centers
6244|Child Day Care Services|
62441|Child Day Care Services|
624410|Child Day Care Services|infants children preschool older school offer pre-kindergarten kindergarten educational programs babysitting nursery schools infant centers
71|Arts, Entertainment, and Recreation|
711|Performing Arts, Spectator Sports, and Related Industries|
7111|Performing Arts Companies|
71111|Theater Companies and Dinner Theaters|
711110|Theater Companies and Dinner Theaters|groups producing live theatrical presentations musicals operas plays comedy improvisational mime puppet shows commonly productions food beverages consumption premises operate facility staging
71112|Dance Companies|
711120|Dance Companies|groups theaters producing live theatrical ballet contemporary folk presentations operate theater facility staging shows
71113|Musical Groups and Artists|
711130|Musical Groups and Artists|producing live entertainment theatrical opera productions independent freelance perform front audience studio operate facilities staging shows bands drum bugle corps drill teams
71119|Other Performing Arts Companies|
711190|Other Performing Arts Companies|groups theater dance musical artists producing live theatrical presentations carnival traveling shows ice skating circuses magic
7112|Spectator Sports|
71121|Spectator Sports|teams clubs participating live sporting events before paying audience racetracks independent athletes racing owners participants cars dogs horses entering trainers specialized support
711211|Sports Teams and Clubs|professional semiprofessional participating live sporting events baseball basketball football hockey soccer jai alai games before paying audience operate arena stadium facility presenting
711212|Racetracks|present promote events auto dog horse races held facilities
711219|Other Spectator Sports|independent athletes professional semiprofessional golfers boxers race car drivers participating live sporting racing events before paying audience owners participants cars dogs horses
7113|Promoters of Performing Arts, Sports, and Similar Events|
71131|Promoters of Performing Arts, Sports, and Similar Events with Facilities|
711310|Promoters of Performing Arts, Sports, and Similar Events with Facilities|organizing promoting managing live productions state fairs county agricultural concerts festivals held manage operate staff arenas stadiums theaters rent
71132|Promoters of Performing Arts, Sports, and Similar Events without Facilities|
711320|Promoters of Performing Arts, Sports, and Similar Events without Facilities|organizing promoting managing live productions state fairs county agricultural concerts festivals managed operated theatrical motion picture booking agencies
7114|Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures|
71141|Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures|
711410|Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures|representing managing creative performing sports representation management clients negotiations organizing financial affairs promoting careers celebrities literary talent modeling
7115|Independent Artists, Writers, and Performers|
71151|Independent Artists, Writers, and Performers|
711510|Independent Artists, Writers, and Performers|freelance individuals performing artistic productions creating cultural works technical expertise necessary athletes celebrities exclusively endorsing making speeches public appearances receive actors actresses
712|Museums, Historical Sites, and Similar Institutions|
7121|Museums, Historical Sites, and Similar Institutions|
71211|Museums|
712110|Museums|preservation exhibition objects historical cultural educational value art galleries retail planetariums science technology halls fame wax
71212|Historical Sites|
712120|Historical Sites|preservation exhibition buildings forts communities describe events persons particular interest archeological battlefields ships pioneer villages
71213|Zoos and Botanical Gardens|
712130|Zoos and Botanical Gardens|preservation exhibition live plant animal life displays aquariums wild parks arboreta zoological aviaries
71219|Nature Parks and Other Similar Institutions|
712190|Nature Parks and Other Similar Institutions|preservation exhibition natural areas settings bird wildlife sanctuaries wonder tourist attractions caverns waterfalls conservation centers preserves national
713|Amusement, Gambling, and Recreation Industries|
7131|Amusement Parks and Arcades|
71311|Amusement and Theme Parks|
713110|Amusement and Theme Parks|attractions mechanical rides water games shows exhibits refreshment stands picnic grounds lease space concession
71312|Amusement Arcades|
713120|Amusement Arcades|gambling billiard pool parlors
7132|Gambling Industries|
71321|Casinos (except Casino Hotels)|
713210|Casinos (except Casino Hotels)|gambling facilities offer table wagering games along slot machines sports betting often food beverage floating cruises riverboat
71329|Other Gambling Industries|
713290|Other Gambling Industries|facilities casinos casino hotels bingo off-track betting slot machine parlors coin-operated device concession operators supplying servicing bookmakers lottery ticket sales agents retail
7139|Other Amusement and Recreation Industries|
71391|Golf Courses and Country Clubs|
713910|Golf Courses and Country Clubs|miniature along dining facilities recreational often food beverage equipment rental instruction
71392|Skiing Facilities|
713920|Skiing Facilities|downhill cross country areas equipment ski lifts tows often food beverage rental instruction season resorts accommodations
71393|Marinas|
713930|Marinas|commonly docking storage facilities pleasure craft owners retailing fuel marine supplies repairing maintaining renting boats
71394|Fitness and Recreational Sports Centers|
713940|Fitness and Recreational Sports Centers|facilities featuring exercise active physical conditioning swimming skating racquet aerobic dance ice roller rinks gymnasiums handball racquetball tennis club wave pools
71395|Bowling Centers|
713950|Bowling Centers|often food beverage
71399|All Other Amusement and Recreation Industries|
713990|All Other Amusement and Recreation Industries|parks arcades gambling golf courses country clubs skiing facilities marinas fitness recreational sports centers bowling ride coin-operated nongambling device concession operators supplying
72|Accommodation and Food Services|
721|Accommodation|
7211|Traveler Accommodation|
72111|Hotels (except Casino Hotels) and Motels|
721110|Hotels (except Casino Hotels) and Motels|short-term lodging facilities motor resort offer food beverage recreational conference rooms convention laundry parking
72112|Casino Hotels|
721120|Casino Hotels|short-term lodging hotel facilities premises table wagering games gambling slot machines sports betting offer range amenities food beverage entertainment valet parking swimming
72119|Other Traveler Accommodation|short-term lodging hotels motels casino bed-and-breakfast inns tourist homes guest houses youth hostels housekeeping cabins cottages
721191|Bed-and-Breakfast Inns|short-term lodging facilities bed-and-breakfast private homes small buildings converted purpose characterized highly personalized inclusion full room rate
721199|All Other Traveler Accommodation|short-term lodging hotels motels casino bed-and-breakfast inns guest houses tourist homes housekeeping cabins cottages youth hostels
7212|RV (Recreational Vehicle) Parks and Recreational Camps|
72121|RV (Recreational Vehicle) Parks and Recreational Camps|campgrounds vacation cater outdoor enthusiasts characterized accommodation nature range facilities clients fishing hunting travel trailer campsites adventure retreats instructional day
721211|RV (Recreational Vehicle) Parks and Campgrounds|sites accommodate campers equipment tents tent trailers travel rvs vehicles access facilities washrooms laundry rooms recreation halls playgrounds stores snack bars
721214|Recreational and Vacation Camps (except Campgrounds)|overnight children family hunting fishing outdoor adventure retreats offer trail riding white water rafting hiking accommodation facilities cabins fixed campsites amenities food
7213|Rooming and Boarding Houses, Dormitories, and Workers' Camps|
72131|Rooming and Boarding Houses, Dormitories, and Workers' Camps|
721310|Rooming and Boarding Houses, Dormitories, and Workers' Camps|facilities fraternity sorority campus residential clubs temporary longer-term accommodations period occupancy serve principal residence complementary housekeeping meals laundry
722|Food Services and Drinking Places|
7223|Special Food Services|
72231|Food Service Contractors|
722310|Food Service Contractors|institutional governmental commercial industrial locations based contractual arrangements organizations specified period time convenience contracting organization customers arrangement vary facility operated cafeteria restaurant
72232|Caterers|
722320|Caterers|single event-based food equipment vehicles transport meals snacks events prepare off-premise site banquet halls catering staff catered graduation parties wedding receptions business
72233|Mobile Food Services|
722330|Mobile Food Services|preparing serving meals snacks immediate consumption motorized vehicles nonmotorized carts central location caterer route serviced vehicle cart hot dog ice cream trucks
7224|Drinking Places (Alcoholic Beverages)|
72241|Drinking Places (Alcoholic Beverages)|
722410|Drinking Places (Alcoholic Beverages)|bars taverns nightclubs preparing serving immediate consumption limited food
7225|Restaurants and Other Eating Places|
72251|Restaurants and Other Eating Places|food patrons order served seated waiter waitress pay after select counter buffet line before preparing serving specialty snack ice cream frozen yogurt
722511|Full-Service Restaurants|food patrons order served seated waiter waitress pay after eating selling alcoholic beverages carryout presenting live nontheatrical entertainment
722513|Limited-Service Restaurants|food snack nonalcoholic beverage bars patrons order select pay before eating drink consumed premises taken delivered customer location selling alcoholic beverages delicatessen
722514|Cafeterias, Grill Buffets, and Buffets|preparing serving meals immediate consumption cafeteria-style buffet equipment steam tables refrigerated areas display grills self-service nonalcoholic beverage dispensing patrons select food drink
722515|Snack and Nonalcoholic Beverage Bars|preparing serving specialty ice cream frozen yogurt cookies popcorn beverages coffee juices sodas consumption near premises carry sell beans mugs makers promote
81|Other Services (except Public Administration)|
811|Repair and Maintenance|
8111|Automotive Repair and Maintenance|
81111|Automotive Mechanical and Electrical Repair and Maintenance|vehicles passenger cars trucks vans trailers specialize single wide range
811111|General Automotive Repair|wide range mechanical electrical maintenance vehicles passenger cars trucks vans trailers engine replacement automobile garages gasoline stations shops
811112|Automotive Exhaust System Repair|replacing repairing systems vehicles passenger cars trucks vans replacement shops muffler
811113|Automotive Transmission Repair|replacing repairing transmissions vehicles passenger cars trucks vans
811118|Other Automotive Mechanical and Electrical Repair and Maintenance|specialized engine replacement exhaust systems transmission vehicles passenger cars trucks vans trailers brake shops radiator tune-up
81112|Automotive Body, Paint, Interior, and Glass Repair|repairing customizing vehicles passenger cars trucks vans trailer bodies interiors painting vehicle replacing tinting automobile truck van physically disabled customers special requirements
811121|Automotive Body, Paint, and Interior Repair and Maintenance|repairing customizing vehicles passenger cars trucks vans trailer bodies interiors painting shops conversion upholstery
811122|Automotive Glass Replacement Shops|replacing repairing tinting vehicle passenger car truck van
81119|Other Automotive Repair and Maintenance|mechanical electrical transmission body paint interior glass vehicles passenger cars trucks vans trailers air-conditioning shops tire retreading oil change lubrication car washes
811191|Automotive Oil Change and Lubrication Shops|changing motor lubricating chassis vehicles passenger cars trucks vans
811192|Car Washes|cleaning washing waxing automotive vehicles passenger cars trucks vans trailers detail shops mobile truck
811198|All Other Automotive Repair and Maintenance|mechanical electrical body paint interior glass motor oil change lubrication car washing vehicles passenger cars trucks vans trailers air-conditioning shops tire retreading
8112|Electronic and Precision Equipment Repair and Maintenance|
81121|Electronic and Precision Equipment Repair and Maintenance|repairing maintaining consumer computers office machines communication instruments retailing microscopes radar sonar televisions stereos video recorders fax photocopying two-way radios communications scientific
811211|Consumer Electronics Repair and Maintenance|repairing maintaining televisions stereos speakers video recorders dvd players radios cameras retailing
811212|Computer and Office Machine Repair and Maintenance|repairing maintaining computers machines retailing photocopying terminals storage devices printers cd-rom drives
811213|Communication Equipment Repair and Maintenance|repairing maintaining retailing telephones fax machines communications transmission two-way radios
811219|Other Electronic and Precision Equipment Repair and Maintenance|repairing maintaining retailing consumer electronics computers office machines communications maintain medical diagnostic imaging measuring surveying instruments laboratory radar sonar
8113|Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance|
81131|Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance|
811310|Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance|sharpen install blades saws welding general agricultural heavy forklifts material handling machine tools refrigeration construction mining
8114|Personal and Household Goods Repair and Maintenance|
81141|Home and Garden Equipment and Appliance Repair and Maintenance|repairing servicing household-type appliances retailing maintain lawnmowers edgers snowblowers leaf blowers washing machines clothes dryers refrigerators
811411|Home and Garden Equipment Repair and Maintenance|repairing servicing retailing lawnmowers handheld power tools edgers snowblowers leaf blowers trimmers
811412|Appliance Repair and Maintenance|repairing servicing household appliances retailing refrigerators stoves washing machines clothes dryers room air-conditioners
81142|Reupholstery and Furniture Repair|
811420|Reupholstery and Furniture Repair|reupholstering refinishing repairing restoring
81143|Footwear and Leather Goods Repair|
811430|Footwear and Leather Goods Repair|repairing leather-like retailing handbags briefcases
81149|Other Personal and Household Goods Repair and Maintenance|
811490|Other Personal and Household Goods Repair and Maintenance|repairing servicing household-type retailing home garden equipment appliances furniture footwear leather garments watches jewelry musical instruments bicycles motorcycles motorboats canoes sailboats recreational
812|Personal and Laundry Services|
8121|Personal Care Services|
81211|Hair, Nail, and Skin Care Services|facials applying makeup permanent barber shops stylist beauty salons cosmetology
812111|Barber Shops|men hair stylist cutting trimming styling boys shaving beards
812112|Beauty Salons|barber shops men hair stylist cutting trimming shampooing coloring waving styling facials applying makeup permanent parlors facial combined hairdressing cosmetology unisex women
812113|Nail Salons|care manicures pedicures extensions
81219|Other Personal Care Services|hair nail facial nonpermanent makeup day spas depilatory electrolysis removal salons permanent ear piercing steam turkish baths replacement offices physicians weaving tanning
812191|Diet and Weight Reducing Centers|non-medical assist clients attaining maintaining desired sale reduction food supplements integral component program typically individual group counseling menu exercise planning body measurement
812199|Other Personal Care Services|hair nail facial nonpermanent makeup non-medical diet weight reducing day spas depilatory electrolysis removal salons saunas ear piercing steam turkish baths replacement
8122|Death Care Services|
81221|Funeral Homes and Funeral Services|
812210|Funeral Homes and Funeral Services|preparing dead burial interment conducting funerals facilities wakes arranging transportation selling caskets merchandise combined crematories
81222|Cemeteries and Crematories|
812220|Cemeteries and Crematories|sites structures reserved interment human animal remains cremating dead cemetery associations operators memorial gardens burial places combined funeral homes pet mausoleums
8123|Drycleaning and Laundry Services|
81231|Coin-Operated Laundries and Drycleaners|
812310|Coin-Operated Laundries and Drycleaners|facilities coin-operated self-service laundry drycleaning equipment customer premises supplying servicing places business apartments dormitories
81232|Drycleaning and Laundry Services (except Coin-Operated)|
812320|Drycleaning and Laundry Services (except Coin-Operated)|coin-operated laundering linen uniform supply drop-off pick-up sites laundries drycleaners specialty cleaning specific garments textile carpets upholstery fur leather suede wedding gowns
81233|Linen and Uniform Supply|supplying rental laundered uniforms gowns coats table linens bed towels clean room apparel treated mops shop
812331|Linen Supply|supplying rental laundered table bed linens towels diapers uniforms gowns coats doctors nurses barbers beauticians waitresses
812332|Industrial Launderers|supplying rental laundered work uniforms clothing protective apparel flame heat resistant clean room dust control treated mops rugs mats tool covers cloths
8129|Other Personal Services|
81291|Pet Care (except Veterinary) Services|
812910|Pet Care (except Veterinary) Services|boarding grooming sitting training pets
81292|Photofinishing|developing film making photographic slides prints enlargements
812921|Photofinishing Laboratories (except One-Hour)|one-hour labs developing film making photographic slides prints enlargements
812922|One-Hour Photofinishing|one-hour labs developing film making photographic slides prints enlargements short turnaround while-you-wait
81293|Parking Lots and Garages|
812930|Parking Lots and Garages|space motor vehicles hourly daily monthly valet
81299|All Other Personal Services|
812990|All Other Personal Services|care death drycleaning laundry pet photofinishing parking space valet bail bonding bondsperson shoeshine coin-operated machine blood pressure locker photographic scale concession operators
813|Religious, Grantmaking, Civic, Professional, and Similar Organizations|
8131|Religious Organizations|
81311|Religious Organizations|
813110|Religious Organizations|churches temples monasteries administering organized religion promoting shrines schools synagogues mosques
8132|Grantmaking and Giving Services|
81321|Grantmaking and Giving Services|foundations charitable trusts raising funds wide range social welfare health educational scientific cultural
813211|Grantmaking Foundations|charitable trusts award grants trust funds based competitive selection process preferences foundation managers grantors fund single entity museum university community philanthropic corporate
813212|Voluntary Health Organizations|raising funds research disease heart cancer diabetes prevention education patient awareness fundraising
813219|Other Grantmaking and Giving Services|voluntary health organizations raising funds wide range social welfare educational scientific cultural community chests united fund councils federated charities colleges
8133|Social Advocacy Organizations|
81331|Social Advocacy Organizations|promoting particular cause working realization specific political goal benefit broad constituency solicit contributions offer memberships support goals community action firearms conservation human
813311|Human Rights Organizations|promoting causes associated broad specific constituency address issues protecting constitutional civil liberties individuals suffering neglect abuse exploitation interests groups children women senior
813312|Environment, Conservation and Wildlife Organizations|promoting preservation protection address issues clean air water global warming conserving developing natural resources land plant energy protecting preserving endangered species solicit
813319|Other Social Advocacy Organizations|human rights environmental protection conservation wildlife preservation address issues peace international understanding community action excluding civic advancing causes firearms safety drunk driving
8134|Civic and Social Organizations|
81341|Civic and Social Organizations|
813410|Civic and Social Organizations|promoting interests members operate bars restaurants alumni associations granges automobile clubs travel parent-teacher booster scouting ethnic fraternal lodges veterans membership
8139|Business, Professional, Labor, Political, and Similar Organizations|
81391|Business Associations|
813910|Business Associations|promoting interests members conduct research develop market statistics sponsor quality certification standards lobby public officials publish newsletters books periodicals distribution agricultural organizations
81392|Professional Organizations|
813920|Professional Organizations|promoting interests members profession whole conduct research develop statistics sponsor quality certification standards lobby public officials publish newsletters books periodicals distribution bar
81393|Labor Unions and Similar Labor Organizations|
813930|Labor Unions and Similar Labor Organizations|promoting interests organized union employees
81394|Political Organizations|
813940|Political Organizations|promoting interests national state local parties candidates groups organized raise funds party individual campaign clubs action committees pacs
81399|Other Similar Organizations (except Business, Professional, Labor, and Political Organizations)|
813990|Other Similar Organizations (except Business, Professional, Labor, and Political Organizations)|religious social advocacy civic associations unions promoting interests members athletic leagues regulatory property owners condominium homeowners tenants cooperative
814|Private Households|
8141|Private Households|
81411|Private Households|
814110|Private Households|employing workers about premises concerned household employ individuals cooks maids nannies butlers outside gardeners caretakers maintenance
92|Public Administration|
921|Executive, Legislative, and Other General Government Support|
9211|Executive, Legislative, and Other General Government Support|
92111|Executive Offices|
921110|Executive Offices|government serving chief executives advisory committees commissions president governors mayors addition
92112|Legislative Bodies|
921120|Legislative Bodies|government serving advisory committees commissions congress state legislatures study
92113|Public Finance Activities|
921130|Public Finance Activities|government taxation monetary policy financial administration tax collection custody disbursement funds debt investment auditing employee retirement trust fund
92114|Executive and Legislative Offices, Combined|
921140|Executive and Legislative Offices, Combined|government serving councils boards commissioners supervisors bodies chief county city mayor member body council itself
92115|American Indian and Alaska Native Tribal Governments|
921150|American Indian and Alaska Native Tribal Governments|governing bodies perform legislative judicial administrative functions lands councils courts law enforcement
92119|Other General Government Support|
921190|Other General Government Support|personnel election boards public administration civil rights commissions offices supply agencies departments
922|Justice, Public Order, and Safety Activities|
9221|Justice, Public Order, and Safety Activities|
92211|Courts|
922110|Courts|civilian law american indian alaska native tribal sheriffs offices conducting court functions
92212|Police Protection|
922120|Police Protection|government criminal civil law enforcement traffic safety preservation order combined fire departments
92213|Legal Counsel and Prosecution|
922130|Legal Counsel and Prosecution|government attorney generals offices public defenders district attorneys prosecutors
92214|Correctional Institutions|
922140|Correctional Institutions|government managing facility designed confinement correction rehabilitation adult juvenile offenders sentenced court public administration penitentiaries detention centers prisons jails
92215|Parole Offices and Probation Offices|
922150|Parole Offices and Probation Offices|government judicially administering boards pardon
92216|Fire Protection|
922160|Fire Protection|government firefighting combined ambulance rescue
92219|Other Justice, Public Order, and Safety Activities|
922190|Other Justice, Public Order, and Safety Activities|government courts police protection legal counsel prosecution correctional institutions parole offices probation pardon boards fire general administration programs responsible collection statistics consumer
923|Administration of Human Resource Programs|
9231|Administration of Human Resource Programs|
92311|Administration of Education Programs|
923110|Administration of Education Programs|government central coordination planning supervision funds policies intergovernmental statistical reports data collection centralized educational scholarship offices nonoperating public state departments statistics centers
92312|Administration of Public Health Programs|
923120|Administration of Public Health Programs|government planning coordination environmental mental categorical statistics immunization conducting health-related inspections communicable disease program coroners offices nonoperating
92313|Administration of Human Resource Programs (except Education, Public Health, and Veterans' Affairs Programs)|
923130|Administration of Human Resource Programs (except Education, Public Health, and Veterans' Affairs Programs)|government planning coordination assistance social work welfare security disability insurance medicare unemployment workers compensation
92314|Administration of Veterans' Affairs|
923140|Administration of Veterans' Affairs|government programs assistance training counseling dependents heirs survivors offices maintain liaison coordinate organizations governmental agencies
924|Administration of Environmental Quality Programs|
9241|Administration of Environmental Quality Programs|
92411|Administration of Air and Water Resource and Solid Waste Management Programs|
924110|Administration of Air and Water Resource and Solid Waste Management Programs|government regulation enforcement pollution control prevention flood drainage development consumption toxic removal cleanup coordination intergovernmental levels environmental protection program public sanitation districts
92412|Administration of Conservation Programs|
924120|Administration of Conservation Programs|government regulation supervision control land recreational areas preservation natural resources erosion geological survey program weather forecasting protection publicly privately owned forest lands
925|Administration of Housing Programs, Urban Planning, and Community Development|
9251|Administration of Housing Programs, Urban Planning, and Community Development|
92511|Administration of Housing Programs|
925110|Administration of Housing Programs|government planning
92512|Administration of Urban Planning and Community and Rural Development|
925120|Administration of Urban Planning and Community and Rural Development|government areas zoning boards commissions land redevelopment agencies regional program public
926|Administration of Economic Programs|
9261|Administration of Economic Programs|
92611|Administration of General Economic Programs|
926110|Administration of General Economic Programs|government promotion development resources business tourism responsible statistical data analyses well-being governed area consumer protection offices public small agencies trade commissions economics
92612|Regulation and Administration of Transportation Programs|
926120|Regulation and Administration of Transportation Programs|government licensing planning inspection investigation facilities responsible motor vehicle operator coast guard academy parking authorities
92613|Regulation and Administration of Communications, Electric, Gas, and Other Utilities|
926130|Regulation and Administration of Communications, Electric, Gas, and Other Utilities|government licensing inspection power fossil nuclear solar water wind supply sewerage
92614|Regulation of Agricultural Marketing and Commodities|
926140|Regulation of Agricultural Marketing and Commodities|government planning administration coordination programs production utilization educational promotional responsible regulating controlling grading inspection food plants animals
92615|Regulation, Licensing, and Inspection of Miscellaneous Commercial Sectors|
926150|Regulation, Licensing, and Inspection of Miscellaneous Commercial Sectors|government retail trade professional occupations manufacturing mining construction maintaining physical standards regulating hazardous conditions enforcing alcoholic beverage control regulations boards public administration
927|Space Research and Technology|
9271|Space Research and Technology|
92711|Space Research and Technology|
927110|Space Research and Technology|government administration flights exploration flight centers
928|National Security and International Affairs|
9281|National Security and International Affairs|
92811|National Security|
928110|National Security|government armed forces guard air force military police army training schools academies marine corps courts navy
92812|International Affairs|
928120|International Affairs|foreign governments programs relating nations peoples`;

export interface NaicsTitle {
  code: string;
  title: string;
  keywords: string;
}

const ROWS: NaicsTitle[] = DATA.split("\n").map((l) => {
  const [code, title, keywords] = l.split("|");
  return { code, title, keywords: keywords ?? "" };
});
const BY_CODE = new Map(ROWS.map((r) => [r.code, r]));

/** Census title for a code, or undefined. */
export const naicsTitle = (code: string) => BY_CODE.get(code)?.title;

/** Light stemming so "fishing", "fish" and "fisheries" meet, and "restaurants" finds "restaurant". */
export function stem(w: string): string {
  w = w.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length > 5 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && /(ss|x|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  else if (w.length > 5 && w.endsWith("ed")) w = w.slice(0, -2);
  if (w.length > 4 && w.endsWith("er")) w = w.slice(0, -2);
  if (w.length > 3 && /(.)\1$/.test(w) && !/(ss|ll)$/.test(w)) w = w.slice(0, -1);
  return w;
}

/** Everyday words people type that Census titles don't use. A phrase means all its words must match. */
const SYNONYMS: Record<string, string[]> = {
  restaurant: ["restaurant", "eating places"], cafe: ["coffee", "snack bars", "restaurant"], diner: ["restaurant"], bar: ["drinking places"], brewery: ["breweries"],
  truck: ["truck transportation", "freight trucking"], trucking: ["truck transportation", "freight trucking"], fleet: ["freight trucking"], delivery: ["courier", "local delivery"], courier: ["courier"], moving: ["used household moving"],
  landlord: ["lessors"], apartment: ["lessors residential"], rental: ["lessors", "rental leasing"], hoa: ["property managers"], realtor: ["real estate agents"], property: ["property", "real estate"],
  hotel: ["hotels"], motel: ["motels"], resort: ["hotels", "resort"], casino: ["casino"],
  hvac: ["heating air-conditioning contractors", "heating air-conditioning"], plumber: ["plumbing contractors", "plumbing"], electrician: ["electrical contractors", "electrical"], roofer: ["roofing contractors"], painter: ["painting contractors"], carpenter: ["carpentry contractors", "framing contractors"],
  builder: ["building construction"], homebuilder: ["residential building construction"], excavation: ["site preparation contractors"], concrete: ["concrete contractors", "concrete"],
  landscaper: ["landscaping"], lawn: ["landscaping", "lawn"], gardener: ["landscaping"], janitor: ["janitorial"], cleaning: ["janitorial", "cleaning"], maid: ["janitorial"],
  daycare: ["child day care"], preschool: ["child day care"], nursing: ["nursing care", "nursing"], senior: ["elderly", "retirement communities"], assisted: ["assisted living"],
  gym: ["fitness"], school: ["schools"], college: ["colleges"], hospital: ["hospitals"], clinic: ["outpatient care", "offices physicians"], doctor: ["offices physicians"], dentist: ["dentists"], vet: ["veterinary"],
  warehouse: ["warehousing storage"], distribution: ["warehousing", "wholesalers"], farm: ["farming", "crop production", "animal production"], ranch: ["ranching"], fisherman: ["fishing"], fish: ["fishing", "fish"],
  uber: ["taxi"], rideshare: ["taxi"], limo: ["limousine"], bus: ["bus"], software: ["software"], tech: ["computer"], church: ["religious organizations"], nonprofit: ["civic social"],
  security: ["security guards", "security"], staffing: ["temporary help", "employment"], peo: ["professional employer"], grocery: ["grocery", "supermarkets"], store: ["stores"], retail: ["retail", "stores"],
  factory: ["manufacturing"], mechanic: ["automotive repair"], towing: ["towing"], trash: ["waste collection"], garbage: ["waste collection"],
};

const tokens = (s: string) => s.toLowerCase().replace(/\(except[^)]*\)/g, " ").split(/[^a-z]+/).filter(Boolean).map(stem);

export interface IndustryHit {
  code: string;
  title: string;
  /** The BLS rate row the dashboard will compare against, and how it was picked. */
  bls: NaicsMatch | null;
  score: number;
}

/**
 * Find industries for what the user typed: a NAICS code (or the start of one) or plain words.
 * Title words count more than description words. Results are deduplicated by title, keeping
 * the most specific code.
 */
export function findIndustries(query: string, ownership: Ownership = "private", limit = 8): IndustryHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const withBls = (r: NaicsTitle, score: number): IndustryHit => ({ code: r.code, title: r.title, bls: lookupNaics(r.code, ownership), score });
  const digits = q.replace(/[^\d-]/g, "");
  if (/^\d/.test(q) && digits.length >= 2) {
    const c = digits.replace(/-.*/, "");
    return ROWS.filter((r) => r.code.replace(/-.*/, "").startsWith(c.slice(0, 6)) || (c.length === 2 && r.code.startsWith(c) && r.code.includes("-")))
      .sort((a, b) => Number(b.code === c) - Number(a.code === c) || a.code.length - b.code.length || a.code.localeCompare(b.code))
      .slice(0, limit)
      .map((r) => withBls(r, 10));
  }
  const words = q.split(/[^a-z]+/).filter((w) => w.length >= 2 && !["and", "the", "for", "of", "a", "an", "company", "business", "inc", "llc", "services", "service"].includes(w));
  if (!words.length) return [];
  // Each word you type can match itself or one of its everyday phrases; a phrase needs all its words.
  const alts: string[][][] = words.map((w) => [[stem(w)], ...(SYNONYMS[w] ?? SYNONYMS[stem(w)] ?? []).map((p) => p.split(" ").map(stem))]);
  const weigh = (o: string, t: string[], k: string[]): number => (t.includes(o) ? 3 : o.length >= 5 && t.some((x) => x.length >= 5 && (x.startsWith(o) || o.startsWith(x))) ? 2 : k.includes(o) ? 1 : 0);
  const scored: { r: NaicsTitle; score: number; cover: number; focus: number }[] = [];
  for (const r of ROWS) {
    const t = tokens(r.title);
    const k = r.keywords ? r.keywords.split(" ").map(stem) : [];
    let score = 0;
    let cover = 0;
    const hitT = new Set<string>();
    for (const options of alts) {
      let best = 0;
      for (const phrase of options) {
        const ws = phrase.map((o) => weigh(o, t, k));
        if (ws.every((x) => x > 0)) {
          const sc = ws.reduce((a, b) => a + b, 0);
          if (sc > best) best = sc;
          phrase.forEach((o) => t.forEach((x) => (x === o || (o.length >= 5 && x.length >= 5 && (x.startsWith(o) || o.startsWith(x)))) && hitT.add(x)));
        }
      }
      if (best) cover++;
      score += best;
    }
    if (!cover || cover < Math.ceil(alts.length / 2)) continue;
    const focus = t.length ? hitT.size / new Set(t).size : 0;
    scored.push({ r, score, cover, focus });
  }
  // If some industries match every word, don't pad the list with half matches.
  if (scored.some((x) => x.cover === alts.length)) for (let i = scored.length - 1; i >= 0; i--) if (scored[i].cover < alts.length) scored.splice(i, 1);
  scored.sort((a, b) => b.cover - a.cover || b.score - a.score || b.focus - a.focus || a.r.code.length - b.r.code.length || a.r.code.localeCompare(b.r.code));
  const seen = new Map<string, number>();
  const out: { r: NaicsTitle; score: number; cover: number; focus: number }[] = [];
  for (const s of scored) {
    const i = seen.get(s.r.title);
    if (i != null) {
      // Same title at a deeper level: keep the more specific code in the same spot.
      if (s.r.code.length > out[i].r.code.length && s.r.code.startsWith(out[i].r.code)) out[i] = s;
      continue;
    }
    seen.set(s.r.title, out.length);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out.map((s) => withBls(s.r, s.score));
}
