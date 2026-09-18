export interface AvaRegion {
  /** The "big region" AVA — what buyers filter/search by. */
  name: string;
  state: string;
  /**
   * Sub-AVAs (AVAs nested entirely within this region) — optional detail a
   * grower can add on top of the big region; not a separate buyer filter.
   *
   * Compiled from the TTB-recognized AVA list (via Wikipedia's "List of
   * American Viticultural Areas" and per-state cross-checks) for
   * California, Washington, Oregon, and New York. Nesting reflects the
   * most specific commonly-used parent for each sub-AVA rather than every
   * legal level of containment (e.g. Rutherford is filed under Napa Valley,
   * not under the broader North Coast AVA it also technically sits inside).
   * Treat this as a thorough working reference, not a certified TTB filing
   * — worth spot-checking before relying on it for compliance purposes.
   */
  subAvas: readonly string[];
}

export const AVA_REGIONS: readonly AvaRegion[] = [
  // ---------------------------------------------------------------------
  // California — North Coast
  // ---------------------------------------------------------------------
  {
    name: "Napa Valley",
    state: "California",
    subAvas: [
      "Atlas Peak",
      "Calistoga",
      "Chiles Valley",
      "Coombsville",
      "Crystal Springs of Napa Valley",
      "Diamond Mountain District",
      "Howell Mountain",
      "Mt. Veeder",
      "Oak Knoll District of Napa Valley",
      "Oakville",
      "Rutherford",
      "Spring Mountain District",
      "St. Helena",
      "Stags Leap District",
      "Wild Horse Valley",
      "Yountville",
    ],
  },
  { name: "Sonoma Valley", state: "California", subAvas: [] },
  { name: "Sonoma Coast", state: "California", subAvas: ["Fort Ross-Seaview", "West Sonoma Coast"] },
  { name: "Russian River Valley", state: "California", subAvas: ["Green Valley of Russian River Valley"] },
  { name: "Dry Creek Valley", state: "California", subAvas: [] },
  { name: "Alexander Valley", state: "California", subAvas: [] },
  { name: "Knights Valley", state: "California", subAvas: [] },
  { name: "Chalk Hill", state: "California", subAvas: [] },
  { name: "Bennett Valley", state: "California", subAvas: [] },
  { name: "Moon Mountain District Sonoma County", state: "California", subAvas: [] },
  { name: "Fountaingrove District", state: "California", subAvas: [] },
  { name: "Petaluma Gap", state: "California", subAvas: [] },
  { name: "Rockpile", state: "California", subAvas: [] },
  { name: "Northern Sonoma", state: "California", subAvas: [] },
  { name: "Los Carneros", state: "California", subAvas: [] },
  {
    name: "Mendocino",
    state: "California",
    subAvas: [
      "Anderson Valley",
      "Cole Ranch",
      "Comptche",
      "Covelo",
      "Dos Rios",
      "Eagle Peak Mendocino County",
      "McDowell Valley",
      "Mendocino Ridge",
      "Potter Valley",
      "Redwood Valley",
      "Yorkville Highlands",
    ],
  },
  {
    name: "Clear Lake",
    state: "California",
    subAvas: [
      "Benmore Valley",
      "Big Valley District-Lake County",
      "Guenoc Valley",
      "High Valley",
      "Kelsey Bench-Lake County",
      "Long Valley-Lake County",
      "Red Hills Lake County",
      "Upper Lake Valley",
    ],
  },
  { name: "Suisun Valley", state: "California", subAvas: [] },
  { name: "Solano County Green Valley", state: "California", subAvas: [] },
  { name: "North Coast", state: "California", subAvas: [] },

  // ---------------------------------------------------------------------
  // California — Central Coast
  // ---------------------------------------------------------------------
  {
    name: "Paso Robles",
    state: "California",
    subAvas: [
      "Adelaida District",
      "Creston District",
      "El Pomar District",
      "Paso Robles Estrella District",
      "Paso Robles Geneseo District",
      "Paso Robles Highlands District",
      "Paso Robles Willow Creek District",
      "San Juan Creek",
      "San Miguel District",
      "Santa Margarita Ranch",
      "Templeton Gap District",
    ],
  },
  {
    name: "Santa Ynez Valley",
    state: "California",
    subAvas: ["Alisos Canyon", "Ballard Canyon", "Happy Canyon of Santa Barbara", "Los Olivos District", "Sta. Rita Hills"],
  },
  { name: "Santa Maria Valley", state: "California", subAvas: [] },
  { name: "Carmel Valley", state: "California", subAvas: [] },
  { name: "Monterey", state: "California", subAvas: [] },
  { name: "Santa Lucia Highlands", state: "California", subAvas: [] },
  { name: "Arroyo Seco", state: "California", subAvas: [] },
  { name: "Santa Cruz Mountains", state: "California", subAvas: [] },
  { name: "Santa Clara Valley", state: "California", subAvas: [] },
  { name: "San Francisco Bay", state: "California", subAvas: [] },
  { name: "Livermore Valley", state: "California", subAvas: [] },
  { name: "Lamorinda", state: "California", subAvas: [] },
  { name: "Contra Costa", state: "California", subAvas: [] },
  { name: "Ben Lomond Mountain", state: "California", subAvas: [] },
  { name: "Edna Valley", state: "California", subAvas: [] },
  { name: "Arroyo Grande Valley", state: "California", subAvas: [] },
  { name: "San Luis Obispo Coast", state: "California", subAvas: [] },
  { name: "York Mountain", state: "California", subAvas: [] },
  { name: "Hames Valley", state: "California", subAvas: [] },
  { name: "San Antonio Valley", state: "California", subAvas: [] },
  { name: "San Bernabe", state: "California", subAvas: [] },
  { name: "San Lucas", state: "California", subAvas: [] },
  { name: "Gabilan Mountains", state: "California", subAvas: [] },
  { name: "Pacheco Pass", state: "California", subAvas: [] },
  {
    name: "San Benito",
    state: "California",
    subAvas: ["Chalone", "Cienega Valley", "Lime Kiln Valley", "Mt. Harlan", "Paicines"],
  },
  { name: "Central Coast", state: "California", subAvas: [] },

  // ---------------------------------------------------------------------
  // California — Central Valley & Sierra Foothills
  // ---------------------------------------------------------------------
  {
    name: "Lodi",
    state: "California",
    subAvas: ["Alta Mesa", "Borden Ranch", "Clements Hills", "Cosumnes River", "Jahant", "Mokelumne River", "Sloughhouse"],
  },
  { name: "Clarksburg", state: "California", subAvas: ["Merritt Island"] },
  { name: "Capay Valley", state: "California", subAvas: [] },
  { name: "Diablo Grande", state: "California", subAvas: [] },
  { name: "Dunnigan Hills", state: "California", subAvas: [] },
  { name: "Madera", state: "California", subAvas: [] },
  { name: "Paulsell Valley", state: "California", subAvas: [] },
  { name: "River Junction", state: "California", subAvas: [] },
  { name: "Salado Creek", state: "California", subAvas: [] },
  { name: "Squaw Valley-Miramonte", state: "California", subAvas: [] },
  { name: "Tracy Hills", state: "California", subAvas: [] },
  { name: "Winters Highlands", state: "California", subAvas: [] },
  {
    name: "Sierra Foothills",
    state: "California",
    subAvas: ["California Shenandoah Valley", "El Dorado", "Fair Play", "Fiddletown", "North Yuba"],
  },

  // ---------------------------------------------------------------------
  // California — South Coast & Northern mountains
  // ---------------------------------------------------------------------
  { name: "Temecula Valley", state: "California", subAvas: [] },
  { name: "Cucamonga Valley", state: "California", subAvas: [] },
  { name: "Malibu Coast", state: "California", subAvas: ["Malibu-Newton Canyon", "Saddle Rock-Malibu"] },
  { name: "Palos Verdes Peninsula", state: "California", subAvas: [] },
  { name: "Antelope Valley of the California High Desert", state: "California", subAvas: [] },
  { name: "Leona Valley", state: "California", subAvas: [] },
  { name: "Sierra Pelona Valley", state: "California", subAvas: [] },
  { name: "Tehachapi Mountains", state: "California", subAvas: [] },
  { name: "Ramona Valley", state: "California", subAvas: [] },
  { name: "San Pasqual Valley", state: "California", subAvas: [] },
  { name: "San Luis Rey", state: "California", subAvas: [] },
  { name: "Yucaipa Valley", state: "California", subAvas: [] },
  { name: "South Coast", state: "California", subAvas: [] },
  { name: "Inwood Valley", state: "California", subAvas: [] },
  { name: "Manton Valley", state: "California", subAvas: [] },
  { name: "Seiad Valley", state: "California", subAvas: [] },
  { name: "Trinity Lakes", state: "California", subAvas: [] },
  { name: "Willow Creek", state: "California", subAvas: [] },

  // ---------------------------------------------------------------------
  // Washington
  // ---------------------------------------------------------------------
  { name: "Columbia Valley", state: "Washington & Oregon", subAvas: [] },
  {
    name: "Yakima Valley",
    state: "Washington",
    subAvas: ["Rattlesnake Hills", "Snipes Mountain", "Red Mountain", "Goose Gap", "Candy Mountain"],
  },
  { name: "Walla Walla Valley", state: "Washington & Oregon", subAvas: ["The Rocks District of Milton-Freewater"] },
  { name: "Horse Heaven Hills", state: "Washington", subAvas: [] },
  { name: "Wahluke Slope", state: "Washington", subAvas: [] },
  { name: "Royal Slope", state: "Washington", subAvas: [] },
  { name: "Ancient Lakes of the Columbia Valley", state: "Washington", subAvas: [] },
  { name: "Naches Heights", state: "Washington", subAvas: [] },
  { name: "Lake Chelan", state: "Washington", subAvas: [] },
  { name: "White Bluffs", state: "Washington", subAvas: [] },
  { name: "Rocky Reach", state: "Washington", subAvas: [] },
  { name: "Beverly", state: "Washington", subAvas: [] },
  { name: "The Burn of Columbia Valley", state: "Washington", subAvas: [] },
  { name: "Puget Sound", state: "Washington", subAvas: [] },
  { name: "Lewis-Clark Valley", state: "Washington & Idaho", subAvas: [] },
  { name: "Columbia Gorge", state: "Washington & Oregon", subAvas: [] },

  // ---------------------------------------------------------------------
  // Oregon
  // ---------------------------------------------------------------------
  {
    name: "Willamette Valley",
    state: "Oregon",
    subAvas: [
      "Chehalem Mountains",
      "Dundee Hills",
      "Eola-Amity Hills",
      "Laurelwood District",
      "Lower Long Tom",
      "McMinnville",
      "Mount Pisgah, Polk County",
      "Ribbon Ridge",
      "Tualatin Hills",
      "Van Duzer Corridor",
      "Yamhill-Carlton",
    ],
  },
  { name: "Rogue Valley", state: "Oregon", subAvas: ["Applegate Valley"] },
  { name: "Umpqua Valley", state: "Oregon", subAvas: ["Elkton Oregon", "Red Hill Douglas County"] },
  { name: "Southern Oregon", state: "Oregon", subAvas: [] },
  { name: "Snake River Valley", state: "Oregon & Idaho", subAvas: [] },

  // ---------------------------------------------------------------------
  // New York
  // ---------------------------------------------------------------------
  { name: "Finger Lakes", state: "New York", subAvas: ["Cayuga Lake", "Seneca Lake"] },
  { name: "Long Island", state: "New York", subAvas: ["North Fork of Long Island", "The Hamptons, Long Island"] },
  { name: "Hudson River Region", state: "New York", subAvas: [] },
  { name: "Upper Hudson", state: "New York", subAvas: [] },
  { name: "Champlain Valley of New York", state: "New York", subAvas: [] },
  { name: "Niagara Escarpment", state: "New York", subAvas: [] },
  { name: "Lake Erie", state: "New York, Pennsylvania & Ohio", subAvas: [] },
] as const;

/** Flat list of just the big-region names, for simple `.map()` rendering. */
export const AVA_REGION_NAMES: readonly string[] = AVA_REGIONS.map((r) => r.name);

/** A handful of widely-recognized regions for homepage "browse by region" tiles. */
export const FEATURED_AVA_REGIONS = [
  "Napa Valley",
  "Sonoma Coast",
  "Russian River Valley",
  "Paso Robles",
  "Santa Ynez Valley",
  "Sierra Foothills",
  "Willamette Valley",
  "Yakima Valley",
  "Walla Walla Valley",
  "Finger Lakes",
  "Long Island",
] as const;

export function getSubAvasForRegion(regionName: string | undefined): readonly string[] {
  if (!regionName) return [];
  return AVA_REGIONS.find((r) => r.name === regionName)?.subAvas ?? [];
}

/** Groups regions by state, in the order states first appear, for <optgroup> rendering. */
export function groupRegionsByState(): { state: string; regions: AvaRegion[] }[] {
  const groups: { state: string; regions: AvaRegion[] }[] = [];
  for (const region of AVA_REGIONS) {
    let group = groups.find((g) => g.state === region.state);
    if (!group) {
      group = { state: region.state, regions: [] };
      groups.push(group);
    }
    group.regions.push(region);
  }
  return groups;
}

export const GRAPE_VARIETIES_BY_COLOR = {
  Red: [
    "Cabernet Sauvignon",
    "Merlot",
    "Pinot Noir",
    "Syrah",
    "Zinfandel",
    "Grenache",
    "Malbec",
    "Petite Sirah",
    "Tempranillo",
    "Sangiovese",
    "Barbera",
    "Nebbiolo",
    "Cabernet Franc",
    "Mourvèdre (Mataro)",
    "Carignane",
    "Counoise",
    "Cinsaut",
    "Gamay",
    "Dolcetto",
    "Montepulciano",
    "Aglianico",
    "Touriga Nacional",
    "Tannat",
    "Lagrein",
    "Petit Verdot",
    "Charbono",
    "Refosco",
    "Poulsard",
    "Trousseau",
    "Blaufränkisch (Lemberger)",
    "Zweigelt",
    "Pinotage",
    "Carménère",
    "Primitivo",
    "Négrette",
    "Valdiguié",
    "Alicante Bouschet",
    "Ruby Cabernet",
    "Souzão",
    "Baco Noir",
    "Marquette",
    "Frontenac",
    "Chambourcin",
    "Noiret",
    "Corot Noir",
    "Concord",
    "Léon Millot",
    "De Chaunac",
    "Catawba",
  ],
  White: [
    "Chardonnay",
    "Sauvignon Blanc",
    "Riesling",
    "Pinot Gris",
    "Viognier",
    "Gewürztraminer",
    "Traminer",
    "Chenin Blanc",
    "Vermentino",
    "Picpoul",
    "Albariño",
    "Grüner Veltliner",
    "Sémillon",
    "Marsanne",
    "Roussanne",
    "Muscat Blanc",
    "Muscat of Alexandria",
    "Pinot Blanc",
    "Trebbiano (Ugni Blanc)",
    "Vernaccia",
    "Verdelho",
    "Torrontés",
    "Fiano",
    "Grenache Blanc",
    "French Colombard",
    "Malvasia Bianca",
    "Melon (Melon de Bourgogne)",
    "Symphony",
    "Arneis",
    "Falanghina",
    "Assyrtiko",
    "Sylvaner",
    "Kerner",
    "Orange Muscat",
    "Verdejo",
    "Viura (Macabeo)",
    "Godello",
    "Vidal Blanc",
    "Vignoles",
    "Cayuga White",
    "Traminette",
    "Seyval Blanc",
    "La Crescent",
    "Niagara",
    "Delaware",
  ],
} as const;

export const GRAPE_VARIETIES: readonly string[] = [
  ...GRAPE_VARIETIES_BY_COLOR.Red,
  ...GRAPE_VARIETIES_BY_COLOR.White,
];

export const FARMING_PRACTICES = [
  { value: "conventional", label: "Conventional" },
  { value: "sustainable", label: "Sustainable (Certified)" },
  { value: "organic", label: "Organic (Certified)" },
  { value: "biodynamic", label: "Biodynamic (Certified)" },
] as const;

export const TRELLIS_SYSTEMS = [
  "Vertical Shoot Positioning (VSP)",
  "Guyot",
  "Head-Trained / Gobelet",
  "Sprawl",
  "Geneva Double Curtain (GDC)",
  "Scott Henry",
  "Smart-Dyson",
  "Lyre / U-Trellis",
] as const;

export const SOIL_TYPES = [
  "Clay Loam",
  "Sandy Loam",
  "Volcanic",
  "Alluvial",
  "Gravelly",
  "Limestone",
  "Granite",
  "Rocky / Shallow",
  "Silt Loam",
] as const;

export const SUN_EXPOSURES = [
  "North",
  "Northeast",
  "East",
  "Southeast",
  "South",
  "Southwest",
  "West",
  "Northwest",
] as const;

export const SLOPE_BANDS = [
  { value: "flat", label: "Flat (0–3%)", min: 0, max: 3 },
  { value: "gentle", label: "Gentle (3–8%)", min: 3, max: 8 },
  { value: "moderate", label: "Moderate (8–15%)", min: 8, max: 15 },
  { value: "steep", label: "Steep (15–30%)", min: 15, max: 30 },
  { value: "very-steep", label: "Very Steep (30%+)", min: 30, max: 100 },
] as const;

export const CROP_STATUSES = [
  "dormant",
  "flowering",
  "veraison",
  "harvested",
] as const;

export function currentHarvestYearOptions(count = 4) {
  const start = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => start + i);
}
