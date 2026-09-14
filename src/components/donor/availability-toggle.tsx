"use client";

import { useState } from "react";
import { updateDonorProfile } from "@/lib/actions/profile";
import { Switch } from "@/components/ui/switch";

interface Props {
  isAvailable: boolean;
  eligible: boolean;
  hasDonationDate: boolean;
}

export function DonorAvailabilityToggle({ isAvailable, eligible, hasDonationDate }: Props) {
  const [available, setAvailable] = useState(isAvailable);
  const [loading, setLoading] = useState(false);

  async function toggle(checked: boolean) {
    if (!eligible || !hasDonationDate) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("is_available", checked.toString());
    await updateDonorProfile(formData);
    setAvailable(checked);
    setLoading(false);
  }

  if (!hasDonationDate) {
    return (
      <p className="text-[13px] text-[var(--warning)] text-right max-w-[200px]">
        Set last donation date in Profile
      </p>
    );
  }

  if (!eligible) {
    return (
      <p className="text-[13px] text-[var(--warning)] text-right max-w-[200px]">
        90-day cooldown active
      </p>
    );
  }

  return (
    <Switch
      checked={available}
      onChange={toggle}
      disabled={loading}
      label={available ? "Available" : "Unavailable"}
    />
  );
}
