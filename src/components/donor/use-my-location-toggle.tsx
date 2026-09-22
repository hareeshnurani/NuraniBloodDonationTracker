"use client";

import { useState } from "react";
import { setUseMyLocation, updateGpsLocation } from "@/lib/actions/profile";
import { Switch } from "@/components/ui/switch";

type Props = {
  enabled: boolean;
  /** When true, GPS timestamp is older than 3 days or missing while enabled. */
  needsRefresh?: boolean;
};

async function captureGps(): Promise<{ lat: number; lng: number } | { error: string }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { error: "Geolocation is not supported in this browser." };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ error: "Could not access GPS. Check browser permissions." }),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

export function UseMyLocationToggle({ enabled: initialEnabled, needsRefresh }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshGps() {
    const coords = await captureGps();
    if ("error" in coords) {
      setError(coords.error);
      return false;
    }
    const result = await updateGpsLocation(coords.lat, coords.lng);
    if (result.error) {
      setError(result.error);
      return false;
    }
    setError("");
    return true;
  }

  async function toggle(checked: boolean) {
    setLoading(true);
    setError("");
    const result = await setUseMyLocation(checked);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setEnabled(checked);
    if (checked && result.needsGpsRefresh) {
      await refreshGps();
    }
    setLoading(false);
    if (checked || result.success) {
      window.location.reload();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Switch
        checked={enabled}
        onChange={toggle}
        disabled={loading}
        label={enabled ? "Use my location" : "Use my location off"}
        description={
          enabled
            ? needsRefresh
              ? "GPS refresh needed (every 3 days)"
              : "GPS active for matching"
            : "Using PIN code when saved"
        }
      />
      {error && (
        <p className="max-w-[220px] text-right text-[12px] text-[var(--accent)]">{error}</p>
      )}
    </div>
  );
}
