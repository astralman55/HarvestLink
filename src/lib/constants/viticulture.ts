export interface RegionOption {
  /** A county — what buyers filter/search by and what growers pick as their region. */
  name: string;
  state: string;
}

// Region picker is county-based, not AVA-based (per the project owner's own
// request) -- growers pick the county the fruit/wine comes from, and can
// optionally add a specific area/AVA as free text alongside it (see
// ListingForm.tsx / BulkWineForm.tsx's "Specific Area" field). Covers every
// county with meaningful wine grape acreage in the four states this app
// has always covered (California, Washington, Oregon, New York) -- not
// just the boutique/AVA-famous ones, since bulk wine in particular often
// comes from high-volume Central Valley-style counties.
export const REGIONS: readonly RegionOption[] = [
  // ---------------------------------------------------------------------
  // California — North Coast
  // ---------------------------------------------------------------------
  { name: "Napa County", state: "California" },
  { name: "Sonoma County", state: "California" },
  { name: "Mendocino County", state: "California" },
  { name: "Lake County", state: "California" },
  { name: "Marin County", state: "California" },
  { name: "Solano County", state: "California" },

  // ---------------------------------------------------------------------
  // California — Central Valley & Sacramento Valley
  // ---------------------------------------------------------------------
  { name: "Yolo County", state: "California" },
  { name: "Sacramento County", state: "California" },
  { name: "San Joaquin County", state: "California" },
  { name: "Stanislaus County", state: "California" },
  { name: "Merced County", state: "California" },
  { name: "Madera County", state: "California" },
  { name: "Fresno County", state: "California" },
  { name: "Kings County", state: "California" },
  { name: "Tulare County", state: "California" },
  { name: "Kern County", state: "California" },
  { name: "Butte County", state: "California" },
  { name: "Glenn County", state: "California" },
  { name: "Colusa County", state: "California" },
  { name: "Sutter County", state: "California" },
  { name: "Yuba County", state: "California" },
  { name: "Tehama County", state: "California" },

  // ---------------------------------------------------------------------
  // California — Sierra Foothills
  // ---------------------------------------------------------------------
  { name: "Amador County", state: "California" },
  { name: "Calaveras County", state: "California" },
  { name: "El Dorado County", state: "California" },
  { name: "Tuolumne County", state: "California" },
  { name: "Nevada County", state: "California" },
  { name: "Placer County", state: "California" },

  // ---------------------------------------------------------------------
  // California — Central Coast
  // ---------------------------------------------------------------------
  { name: "San Luis Obispo County", state: "California" },
  { name: "Santa Barbara County", state: "California" },
  { name: "Ventura County", state: "California" },
  { name: "Monterey County", state: "California" },
  { name: "San Benito County", state: "California" },
  { name: "Santa Clara County", state: "California" },
  { name: "Santa Cruz County", state: "California" },
  { name: "Alameda County", state: "California" },
  { name: "Contra Costa County", state: "California" },

  // ---------------------------------------------------------------------
  // California — South Coast & Southern California
  // ---------------------------------------------------------------------
  { name: "Los Angeles County", state: "California" },
  { name: "Riverside County", state: "California" },
  { name: "San Diego County", state: "California" },
  { name: "San Bernardino County", state: "California" },

  // ---------------------------------------------------------------------
  // California — North coast & mountains
  // ---------------------------------------------------------------------
  { name: "Humboldt County", state: "California" },
  { name: "Trinity County", state: "California" },
  { name: "Siskiyou County", state: "California" },

  // ---------------------------------------------------------------------
  // Washington
  // ---------------------------------------------------------------------
  { name: "Yakima County", state: "Washington" },
  { name: "Benton County", state: "Washington" },
  { name: "Franklin County", state: "Washington" },
  { name: "Walla Walla County", state: "Washington" },
  { name: "Columbia County", state: "Washington" },
  { name: "Chelan County", state: "Washington" },
  { name: "Klickitat County", state: "Washington" },
  { name: "Okanogan County", state: "Washington" },
  { name: "Whatcom County", state: "Washington" },
  { name: "Skagit County", state: "Washington" },
  { name: "King County", state: "Washington" },

  // ---------------------------------------------------------------------
  // Oregon
  // ---------------------------------------------------------------------
  { name: "Yamhill County", state: "Oregon" },
  { name: "Washington County", state: "Oregon" },
  { name: "Polk County", state: "Oregon" },
  { name: "Marion County", state: "Oregon" },
  { name: "Jackson County", state: "Oregon" },
  { name: "Josephine County", state: "Oregon" },
  { name: "Douglas County", state: "Oregon" },
  { name: "Deschutes County", state: "Oregon" },
  { name: "Umatilla County", state: "Oregon" },

  // ---------------------------------------------------------------------
  // New York
  // ---------------------------------------------------------------------
  { name: "Ontario County", state: "New York" },
  { name: "Seneca County", state: "New York" },
  { name: "Yates County", state: "New York" },
  { name: "Steuben County", state: "New York" },
  { name: "Suffolk County", state: "New York" },
  { name: "Niagara County", state: "New York" },
  { name: "Erie County", state: "New York" },
  { name: "Chautauqua County", state: "New York" },
] as const;

/** Flat list of just the region names, for simple `.map()` rendering. */
export const REGION_NAMES: readonly string[] = REGIONS.map((r) => r.name);

/** A handful of widely-recognized regions for homepage "browse by region" tiles. */
export const FEATURED_REGIONS = [
  "Napa County",
  "Sonoma County",
  "Mendocino County",
  "San Luis Obispo County",
  "Santa Barbara County",
  "San Joaquin County",
  "Yamhill County",
  "Yakima County",
  "Walla Walla County",
  "Suffolk County",
] as const;

/**
 * NDA-3/WINE-5: grapes listings have no county/state columns, only
 * region_ava/sub_ava. When an NDA listing's location precision is "state",
 * the public serializer generalizes down to the state this county sits in.
 */
export function getStateForRegion(regionName: string | undefined): string | null {
  if (!regionName) return null;
  return REGIONS.find((r) => r.name === regionName)?.state ?? null;
}

/** Groups regions by state, in the order states first appear, for <optgroup> rendering. */
export function groupRegionsByState(): { state: string; regions: RegionOption[] }[] {
  const groups: { state: string; regions: RegionOption[] }[] = [];
  for (const region of REGIONS) {
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
