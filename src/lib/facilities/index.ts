import { PALAKKAD_FACILITIES } from "./palakkad";
import { COIMBATORE_FACILITIES } from "./coimbatore";
import { KOCHI_FACILITIES } from "./kochi";
import { CHENNAI_FACILITIES } from "./chennai";
import { BANGALORE_FACILITIES } from "./bangalore";
import { MUMBAI_FACILITIES } from "./mumbai";
import { PUNE_FACILITIES } from "./pune";
import { DELHI_FACILITIES } from "./delhi";
import { FACILITY_TYPE_LABELS, type Facility, type FacilityType } from "./types";

export type { Facility, FacilityType };
export { FACILITY_TYPE_LABELS };

/**
 * Hospitals and blood banks used for request location selection.
 * Donor matching uses the selected facility's coordinates.
 */
export const FACILITIES: Facility[] = [
  ...PALAKKAD_FACILITIES,
  ...COIMBATORE_FACILITIES,
  ...KOCHI_FACILITIES,
  ...CHENNAI_FACILITIES,
  ...BANGALORE_FACILITIES,
  ...MUMBAI_FACILITIES,
  ...PUNE_FACILITIES,
  ...DELHI_FACILITIES,
];

export const FACILITY_CITIES = [
  "Palakkad",
  "Coimbatore",
  "Kochi",
  "Chennai",
  "Bangalore",
  "Mumbai",
  "Pune",
  "Delhi",
] as const;

export function getFacilityById(id: string): Facility | undefined {
  return FACILITIES.find((f) => f.id === id);
}

export function searchFacilities(query: string): Facility[] {
  const q = query.trim().toLowerCase();
  if (!q) return FACILITIES;

  return FACILITIES.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q) ||
      FACILITY_TYPE_LABELS[f.type].toLowerCase().includes(q)
  );
}

export function getFacilitiesByCity(city: string): Facility[] {
  return FACILITIES.filter((f) => f.city.toLowerCase() === city.toLowerCase());
}
