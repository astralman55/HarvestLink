import { groupRegionsByState, GRAPE_VARIETIES_BY_COLOR } from "@/lib/constants/viticulture";

/** Renders <optgroup> blocks of AVA regions grouped by state — drop inside a <Select>. */
export function RegionOptionGroups() {
  return (
    <>
      {groupRegionsByState().map((group) => (
        <optgroup key={group.state} label={group.state}>
          {group.regions.map((region) => (
            <option key={region.name} value={region.name}>
              {region.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

/** Renders <optgroup> blocks of grape varieties grouped by color — drop inside a <Select>. */
export function GrapeVarietyOptionGroups() {
  return (
    <>
      {Object.entries(GRAPE_VARIETIES_BY_COLOR).map(([color, varieties]) => (
        <optgroup key={color} label={`${color} Varieties`}>
          {varieties.map((variety) => (
            <option key={variety} value={variety}>
              {variety}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
