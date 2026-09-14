"use server";

import { lookupPincode } from "@/lib/pincode";

export async function verifyPincode(pincode: string) {
  return lookupPincode(pincode);
}
