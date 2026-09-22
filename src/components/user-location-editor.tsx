"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, Navigation } from "lucide-react";
import { isValidPincode } from "@/lib/pincode";

export type UserLocationValue = {
  latitude: number | null;
  longitude: number | null;
  homePincode: string | null;
  locationLabel: string | null;
};

type UserLocationEditorProps = {
  value: UserLocationValue;
  onChange: (next: UserLocationValue) => void;
  onSaveGps?: (lat: number, lng: number) => Promise<{ error?: string } | void>;
  onSavePincode?: (pincode: string) => Promise<{ error?: string; data?: UserLocationValue } | void>;
  showProfileLink?: boolean;
};

export function UserLocationEditor({
  value,
  onChange,
  onSaveGps,
  onSavePincode,
  showProfileLink = false,
}: UserLocationEditorProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pinInput, setPinInput] = useState(value.homePincode ?? "");
  const [pinLoading, setPinLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedHint, setSavedHint] = useState("");

  useEffect(() => {
    setPinInput(value.homePincode ?? "");
  }, [value.homePincode]);

  const hasLocation = value.latitude != null && value.longitude != null;

  async function detectLocation() {
    setGpsLoading(true);
    setError("");
    setSavedHint("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const next: UserLocationValue = {
          latitude,
          longitude,
          homePincode: null,
          locationLabel: `GPS · ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        };
        onChange(next);
        if (onSaveGps) {
          const result = await onSaveGps(latitude, longitude);
          if (result?.error) setError(result.error);
          else setSavedHint("Location saved from GPS.");
        }
        setGpsLoading(false);
      },
      () => {
        setError("Could not access GPS. Enter your 6-digit PIN code below instead.");
        setGpsLoading(false);
      }
    );
  }

  async function savePincode() {
    setError("");
    setSavedHint("");
    if (!isValidPincode(pinInput)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }
    setPinLoading(true);
    if (onSavePincode) {
      const result = await onSavePincode(pinInput.trim());
      if (result?.error) {
        setError(result.error);
        setPinLoading(false);
        return;
      }
      if (result?.data) {
        onChange(result.data);
        setSavedHint("Location saved from PIN code.");
      }
    }
    setPinLoading(false);
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="tinted" onClick={detectLocation} disabled={gpsLoading}>
        <Navigation className="mr-2 h-4 w-4" />
        {gpsLoading ? "Detecting…" : "Use my current location"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[var(--separator)]" />
        </div>
        <p className="relative mx-auto w-fit bg-[var(--surface)] px-2 text-[12px] uppercase tracking-wide text-[var(--label-tertiary)]">
          or use PIN code
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit PIN code"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-label="PIN code"
          className="flex-1"
        />
        <Button type="button" variant="secondary" onClick={savePincode} disabled={pinLoading}>
          {pinLoading ? "…" : "Save"}
        </Button>
      </div>

      {error && <p className="text-[13px] text-[var(--accent)]">{error}</p>}
      {savedHint && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedHint}
        </div>
      )}
      {hasLocation && value.locationLabel && !savedHint && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-3 py-2.5 text-[13px] text-[var(--label-secondary)]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>{value.locationLabel}</span>
        </div>
      )}

      {!hasLocation && (
        <p className="text-[13px] leading-snug text-[var(--label-secondary)]">
          Without a location, BloodLink cannot match you to nearby requests or calculate distance to hospitals.
          {showProfileLink && (
            <>
              {" "}
              You can update this anytime in{" "}
              <Link href="/profile" className="font-medium text-[var(--accent)] hover:underline">
                Profile
              </Link>
              .
            </>
          )}
        </p>
      )}

      {/* Onboarding form posts coordinates when set via parent hidden fields */}
      {hasLocation && (
        <>
          <input type="hidden" name="latitude" value={value.latitude ?? ""} />
          <input type="hidden" name="longitude" value={value.longitude ?? ""} />
        </>
      )}
    </div>
  );
}

export function profileHasLocation(profile: {
  latitude: number | null;
  longitude: number | null;
}): boolean {
  return profile.latitude != null && profile.longitude != null;
}
