export type FacilityType = "hospital" | "blood_bank";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  hospital: "Hospital",
  blood_bank: "Blood Bank",
};
