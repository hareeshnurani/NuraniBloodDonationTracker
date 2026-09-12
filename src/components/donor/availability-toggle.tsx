"use client";

import { useState } from "react";
import { updateDonorProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";

interface Props {
  isAvailable: boolean;
  eligible: boolean;
  hasDonationDate: boolean;
}

export function DonorAvailabilityToggle({ isAvailable, eligible, hasDonationDate }: Props) {
  const [available, setAvailable] = useState(isAvailable);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!eligible || !hasDonationDate) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("is_available", (!available).toString());
    await updateDonorProfile(formData);
    setAvailable(!available);
    setLoading(false);
  }

  if (!hasDonationDate) {
    return (
      <p className="text-sm text-amber-600">
        Set your last donation date in Profile to enable availability.
      </p>
    );
  }

  if (!eligible) {
    return <p className="text-sm text-amber-600">Not eligible to donate yet (90-day cooldown).</p>;
  }

  return (
    <Button
      variant={available ? "primary" : "secondary"}
      onClick={toggle}
      disabled={loading}
    >
      {loading ? "..." : available ? "Available ✓" : "Mark as Available"}
    </Button>
  );
}
