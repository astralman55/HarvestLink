// Scope addendum Requirement 4: bulk wine reference data.

// WINE-6: bulk wine's own multi-select vocabulary -- deliberately separate
// from grapes' single-select FARMING_PRACTICES enum (see
// docs/scope-addendum-decisions.md, Decision 2). Values must match the
// `farming_practices` lookup table seeded in migration 0003.
export const BULK_WINE_FARMING_PRACTICES = [
  { value: "organic", label: "Organic" },
  { value: "biodynamic", label: "Biodynamic" },
  { value: "natural", label: "Natural" },
  { value: "sustainable", label: "Sustainable" },
  { value: "regenerative_organic", label: "Regenerative Organic" },
  { value: "demeter_certified_biodynamic", label: "Demeter Certified Biodynamic" },
] as const;

// WINE-4: "where the wine is stored/available for pickup," independent of
// grape origin (which reuses the existing AVA region control). Unlike AVA
// regions, this isn't limited to wine-producing states -- bonded storage
// can be anywhere -- so it's the full USPS state list rather than a
// wine-specific subset.
export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
] as const;

export function currentVintageYearOptions(yearsBack = 30) {
  const current = new Date().getFullYear();
  return Array.from({ length: yearsBack + 1 }, (_, i) => current - i);
}

export const NON_VINTAGE_VALUE = "NV";
