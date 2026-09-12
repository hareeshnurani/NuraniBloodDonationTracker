import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDays, differenceInHours, isBefore, parseISO } from "date-fns";
import { DONOR_COOLDOWN_DAYS, DEADLINE_WARNING_HOURS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.asin(Math.sqrt(a));
}

export function isDonorEligible(lastDonationDate: string | null): boolean {
  if (!lastDonationDate) return false;
  const eligibleFrom = addDays(parseISO(lastDonationDate), DONOR_COOLDOWN_DAYS);
  return !isBefore(new Date(), eligibleFrom);
}

export function getEligibleDate(lastDonationDate: string): Date {
  return addDays(parseISO(lastDonationDate), DONOR_COOLDOWN_DAYS);
}

export function shouldPromptDeadlineExtension(deadline: string): boolean {
  const hoursLeft = differenceInHours(parseISO(deadline), new Date());
  return hoursLeft <= DEADLINE_WARNING_HOURS && hoursLeft > 0;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
