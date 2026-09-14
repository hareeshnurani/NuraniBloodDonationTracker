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

/**
 * Hospitals and blood banks used for request location selection.
 * Donor matching uses the selected facility's coordinates.
 * Add or edit entries here as needed.
 */
export const FACILITIES: Facility[] = [
  // Coimbatore — Hospitals
  { id: "psg-hospital", name: "PSG Hospitals", type: "hospital", city: "Coimbatore", address: "Peelamedu, Coimbatore", latitude: 11.0286, longitude: 76.9103 },
  { id: "kovai-medical", name: "Kovai Medical Center & Hospital", type: "hospital", city: "Coimbatore", address: "Avinashi Road, Coimbatore", latitude: 11.0245, longitude: 76.9662 },
  { id: "ganga-hospital", name: "Ganga Hospital", type: "hospital", city: "Coimbatore", address: "Mettupalayam Road, Coimbatore", latitude: 11.0352, longitude: 76.9361 },
  { id: "sri-ramakrishna", name: "Sri Ramakrishna Hospital", type: "hospital", city: "Coimbatore", address: "Siddhapudur, Coimbatore", latitude: 11.0089, longitude: 76.9668 },
  { id: "kg-hospital", name: "KG Hospital", type: "hospital", city: "Coimbatore", address: "Govt Arts College Road, Coimbatore", latitude: 11.0012, longitude: 76.9662 },
  { id: "gem-hospital", name: "GEM Hospital & Research Centre", type: "hospital", city: "Coimbatore", address: "Ramanathapuram, Coimbatore", latitude: 11.0054, longitude: 76.9789 },
  { id: "royal-care", name: "Royal Care Super Speciality Hospital", type: "hospital", city: "Coimbatore", address: "Neelambur, Coimbatore", latitude: 11.0621, longitude: 77.0432 },
  { id: "kongunad-hospital", name: "Kongunad Hospital", type: "hospital", city: "Coimbatore", address: "Tatabad, Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { id: "sakthi-hospital", name: "Sakthi Hospital", type: "hospital", city: "Coimbatore", address: "Gandhipuram, Coimbatore", latitude: 11.0183, longitude: 76.9687 },
  { id: "coimbatore-medical-college", name: "Coimbatore Medical College Hospital", type: "hospital", city: "Coimbatore", address: "Avinashi Road, Coimbatore", latitude: 11.0123, longitude: 76.9812 },

  // Coimbatore — Blood Banks
  { id: "imc-blood-bank-cbe", name: "IMC Blood Bank", type: "blood_bank", city: "Coimbatore", address: "Gandhipuram, Coimbatore", latitude: 11.0178, longitude: 76.9695 },
  { id: "red-cross-cbe", name: "Indian Red Cross Society Blood Bank", type: "blood_bank", city: "Coimbatore", address: "Race Course, Coimbatore", latitude: 11.0089, longitude: 76.9712 },
  { id: "psg-blood-bank", name: "PSG Blood Bank", type: "blood_bank", city: "Coimbatore", address: "Peelamedu, Coimbatore", latitude: 11.0289, longitude: 76.9108 },
  { id: "govt-blood-bank-cbe", name: "Government Hospital Blood Bank", type: "blood_bank", city: "Coimbatore", address: "Coimbatore GH, Coimbatore", latitude: 11.0125, longitude: 76.9815 },

  // Pollachi / Nurani area
  { id: "pollachi-govt-hospital", name: "Government Hospital Pollachi", type: "hospital", city: "Pollachi", address: "Pollachi Main Road", latitude: 10.6574, longitude: 77.0103 },
  { id: "kumaran-hospital-pollachi", name: "Kumaran Hospital", type: "hospital", city: "Pollachi", address: "Pollachi", latitude: 10.6601, longitude: 77.0089 },
  { id: "sri-vinayaga-pollachi", name: "Sri Vinayaga Hospital", type: "hospital", city: "Pollachi", address: "Pollachi", latitude: 10.6552, longitude: 77.0121 },
  { id: "pollachi-blood-bank", name: "Pollachi Government Blood Bank", type: "blood_bank", city: "Pollachi", address: "Government Hospital, Pollachi", latitude: 10.6578, longitude: 77.0108 },
  { id: "nurani-primary-health", name: "Nurani Primary Health Centre", type: "hospital", city: "Nurani", address: "Nurani, Pollachi Taluk", latitude: 10.6489, longitude: 77.0234 },

  // Chennai — Major Hospitals
  { id: "apollo-chennai", name: "Apollo Hospitals", type: "hospital", city: "Chennai", address: "Greams Road, Chennai", latitude: 13.0604, longitude: 80.2496 },
  { id: "fortis-malar", name: "Fortis Malar Hospital", type: "hospital", city: "Chennai", address: "Adyar, Chennai", latitude: 13.0067, longitude: 80.2546 },
  { id: "miot-hospital", name: "MIOT International", type: "hospital", city: "Chennai", address: "Manapakkam, Chennai", latitude: 13.0189, longitude: 80.1623 },
  { id: "sri-ramachandra", name: "Sri Ramachandra Medical Centre", type: "hospital", city: "Chennai", address: "Porur, Chennai", latitude: 13.0356, longitude: 80.1567 },
  { id: "govt-general-chennai", name: "Rajiv Gandhi Government General Hospital", type: "hospital", city: "Chennai", address: "Park Town, Chennai", latitude: 13.0827, longitude: 80.2707 },
  { id: "stanley-hospital", name: "Government Stanley Medical College Hospital", type: "hospital", city: "Chennai", address: "Royapuram, Chennai", latitude: 13.1045, longitude: 80.2891 },

  // Chennai — Blood Banks
  { id: "red-cross-chennai", name: "Indian Red Cross Society Blood Bank", type: "blood_bank", city: "Chennai", address: "Montieth Road, Chennai", latitude: 13.0734, longitude: 80.2601 },
  { id: "jipmer-blood-bank", name: "JIPMER Blood Bank", type: "blood_bank", city: "Chennai", address: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { id: "apollo-blood-bank", name: "Apollo Blood Bank", type: "blood_bank", city: "Chennai", address: "Greams Road, Chennai", latitude: 13.0608, longitude: 80.2501 },
  { id: "lifeline-blood-bank", name: "Lifeline Blood Bank", type: "blood_bank", city: "Chennai", address: "Kilpauk, Chennai", latitude: 13.0789, longitude: 80.2345 },

  // Madurai
  { id: "meenakshi-mission", name: "Meenakshi Mission Hospital", type: "hospital", city: "Madurai", address: "Lake Area, Madurai", latitude: 9.9252, longitude: 78.1198 },
  { id: "apollo-madurai", name: "Apollo Speciality Hospitals Madurai", type: "hospital", city: "Madurai", address: "Mattuthavani, Madurai", latitude: 9.9456, longitude: 78.1301 },
  { id: "govt-rajaji-madurai", name: "Government Rajaji Hospital", type: "hospital", city: "Madurai", address: "Palanganatham, Madurai", latitude: 9.9189, longitude: 78.1098 },
  { id: "madurai-blood-bank", name: "Government Hospital Blood Bank Madurai", type: "blood_bank", city: "Madurai", address: "Palanganatham, Madurai", latitude: 9.9192, longitude: 78.1102 },

  // Salem
  { id: "manipal-salem", name: "Manipal Hospital Salem", type: "hospital", city: "Salem", address: "Salem", latitude: 11.6643, longitude: 78.1460 },
  { id: "govt-mohan-kumaramangalam", name: "Government Mohan Kumaramangalam Hospital", type: "hospital", city: "Salem", address: "Salem", latitude: 11.6538, longitude: 78.1589 },
  { id: "salem-blood-bank", name: "Government Hospital Blood Bank Salem", type: "blood_bank", city: "Salem", address: "Salem", latitude: 11.6541, longitude: 78.1592 },

  // Tiruppur
  { id: "tiruppur-govt-hospital", name: "Government Hospital Tiruppur", type: "hospital", city: "Tiruppur", address: "Tiruppur", latitude: 11.1085, longitude: 77.3411 },
  { id: "tiruppur-blood-bank", name: "Tiruppur Blood Bank", type: "blood_bank", city: "Tiruppur", address: "Tiruppur", latitude: 11.1089, longitude: 77.3415 },

  // Erode
  { id: "erode-govt-hospital", name: "Government Hospital Erode", type: "hospital", city: "Erode", address: "Erode", latitude: 11.3410, longitude: 77.7172 },
  { id: "erode-blood-bank", name: "Erode Blood Bank", type: "blood_bank", city: "Erode", address: "Erode", latitude: 11.3414, longitude: 77.7176 },
];

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
