"use client";

import { DonorAvailabilityToggle } from "@/components/donor/availability-toggle";
import { UseMyLocationToggle } from "@/components/donor/use-my-location-toggle";

type Props = {
  isAvailable: boolean;
  eligible: boolean;
  hasDonationDate: boolean;
  hasEffectiveLocation: boolean;
  useMyLocation: boolean;
  gpsNeedsRefresh: boolean;
};

export function DonorHomeStatusControls({
  isAvailable,
  eligible,
  hasDonationDate,
  hasEffectiveLocation,
  useMyLocation,
  gpsNeedsRefresh,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface-secondary)]">
      <div className="border-b border-[var(--separator)] px-4 py-3.5">
        <DonorAvailabilityToggle
          variant="home"
          isAvailable={isAvailable}
          eligible={eligible}
          hasDonationDate={hasDonationDate}
          hasEffectiveLocation={hasEffectiveLocation}
        />
      </div>
      <div className="px-4 py-3.5">
        <UseMyLocationToggle
          variant="home"
          enabled={useMyLocation}
          needsRefresh={gpsNeedsRefresh}
        />
      </div>
    </div>
  );
}
