"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2, Navigation } from "lucide-react";
import { isValidPincode } from "@/lib/pincode";
import { GPS_LOCATION_TTL_HOURS, PIN_LOCATION_TTL_DAYS } from "@/lib/profile-location";

export type UserLocationValue = {
  latitude: number | null;
  longitude: number | null;
  homePincode: string | null;
  locationLabel: string | null;
};

type UserLocationEditorProps = {
  value: UserLocationValue;
  useMyLocation: boolean;
  onChange: (next: UserLocationValue) => void;
  onSaveGps?: (lat: number, lng: number) => Promise<{ error?: string } | void>;
  onSavePincode?: (pincode: string) => Promise<{ error?: string; data?: UserLocationValue } | void>;
  showProfileLink?: boolean;
};

export function UserLocationEditor({
  value,
  useMyLocation,
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

  const hasCoords = value.latitude != null && value.longitude != null;

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
          homePincode: value.homePincode,
          locationLabel: `GPS · ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        };
        onChange(next);
        if (onSaveGps) {
          const result = await onSaveGps(latitude, longitude);
          if (result?.error) setError(result.error);
          else setSavedHint("GPS location saved.");
        }
        setGpsLoading(false);
      },
      () => {
        setError("Could not access GPS. Check permissions or use your PIN code below.");
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
        setSavedHint("PIN location saved.");
      }
    }
    setPinLoading(false);
  }

  return (
    <div className="space-y-4">
      {useMyLocation ? (
        <>
          <p className="text-[13px] text-[var(--label-secondary)]">
            With “Use my location” on, we refresh GPS about every {GPS_LOCATION_TTL_HOURS} hours for
            matching nearby requests.
          </p>
          <Button type="button" variant="tinted" onClick={detectLocation} disabled={gpsLoading}>
            <Navigation className="mr-2 h-4 w-4" />
            {gpsLoading ? "Detecting…" : "Refresh GPS location"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-[13px] text-[var(--label-secondary)]">
            GPS is off. Save a PIN code below — it stays valid for {PIN_LOCATION_TTL_DAYS} days, then
            you need to save it again.
          </p>
          <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--label)]">PIN code location</p>
                <p className="text-[12px] text-[var(--label-secondary)]">
                  6-digit Indian postal PIN
                </p>
              </div>
            </div>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g. 682001"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-label="PIN code"
              className="border border-[var(--separator)] bg-[var(--surface-secondary)] text-center text-[17px] font-medium tracking-[0.2em] tabular-nums"
            />
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={savePincode}
              disabled={pinLoading || !isValidPincode(pinInput)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {pinLoading ? "Saving…" : "Save PIN"}
            </Button>
          </div>
        </>
      )}

      {error && <p className="text-[13px] text-[var(--accent)]">{error}</p>}
      {savedHint && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedHint}
        </div>
      )}
      {hasCoords && value.locationLabel && !savedHint && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] px-3 py-2.5 text-[13px] text-[var(--label-secondary)]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span>{value.locationLabel}</span>
        </div>
      )}

      {!hasCoords && (
        <p className="text-[13px] leading-snug text-[var(--label-secondary)]">
          Location unavailable for matching until GPS is refreshed or a PIN is saved.
          {showProfileLink && (
            <>
              {" "}
              Update in{" "}
              <Link href="/profile" className="font-medium text-[var(--accent)] hover:underline">
                Profile
              </Link>
              .
            </>
          )}
        </p>
      )}

      {hasCoords && (
        <>
          <input type="hidden" name="latitude" value={value.latitude ?? ""} />
          <input type="hidden" name="longitude" value={value.longitude ?? ""} />
        </>
      )}
      <input type="hidden" name="use_my_location" value={useMyLocation ? "true" : "false"} />
      {value.homePincode && (
        <input type="hidden" name="home_pincode" value={value.homePincode} />
      )}
      {value.locationLabel && (
        <input type="hidden" name="location_label" value={value.locationLabel} />
      )}
    </div>
  );
}
