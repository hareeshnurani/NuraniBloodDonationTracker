export interface PincodePostOffice {
  name: string;
  district: string;
  state: string;
  block: string;
  region: string;
}

export interface PincodeLookupResult {
  pincode: string;
  postOffices: PincodePostOffice[];
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  displayLocation: string;
}

interface PostalApiPostOffice {
  Name: string;
  District: string;
  State: string;
  Block: string;
  Region: string;
  Pincode: string;
}

interface PostalApiResponse {
  Status: string;
  Message: string;
  PostOffice: PostalApiPostOffice[] | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

export async function lookupPincode(
  pincode: string
): Promise<{ data: PincodeLookupResult } | { error: string }> {
  const cleaned = pincode.trim();
  if (!isValidPincode(cleaned)) {
    return { error: "Please enter a valid 6-digit PIN code." };
  }

  let postalData: PostalApiResponse;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { error: "Unable to verify PIN code. Please try again." };
    postalData = await res.json();
  } catch {
    return { error: "Unable to verify PIN code. Check your connection and try again." };
  }

  const entry = Array.isArray(postalData) ? postalData[0] : postalData;
  if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
    return { error: "PIN code not found. Please check and try again." };
  }

  const first = entry.PostOffice[0];
  const district = first.District;
  const state = first.State;

  const coords = await geocodePincode(cleaned, district, state);
  if (!coords) {
    return { error: "Could not determine location for this PIN code. Try a nearby PIN code." };
  }

  const postOffices = entry.PostOffice.map((po: PostalApiPostOffice) => ({
    name: po.Name,
    district: po.District,
    state: po.State,
    block: po.Block,
    region: po.Region,
  }));

  const displayLocation = `${district}, ${state} (${cleaned})`;

  return {
    data: {
      pincode: cleaned,
      postOffices,
      district,
      state,
      latitude: coords.latitude,
      longitude: coords.longitude,
      displayLocation,
    },
  };
}

async function geocodePincode(
  pincode: string,
  district: string,
  state: string
): Promise<{ latitude: number; longitude: number } | null> {
  const queries = [
    `${pincode}, ${district}, ${state}, India`,
    `${district}, ${state}, ${pincode}, India`,
  ];

  for (const q of queries) {
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "in");

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "BloodLink/1.0 (blood donation app)" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;

      const results = (await res.json()) as NominatimResult[];
      if (results.length > 0) {
        return {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}
