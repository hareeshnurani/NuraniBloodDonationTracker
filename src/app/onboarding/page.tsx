"use client";

import { useState } from "react";
import { completeProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { UserLocationEditor, type UserLocationValue } from "@/components/user-location-editor";
import { lookupPincode } from "@/lib/pincode";
import { Switch } from "@/components/ui/switch";
import { BLOOD_GROUPS } from "@/lib/constants";
import { Droplets, ChevronLeft } from "lucide-react";
import { OnboardingIntro } from "@/components/onboarding/onboarding-intro";

type OnboardingStep = "intro" | "profile";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("intro");
  const [willingToDonate, setWillingToDonate] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [location, setLocation] = useState<UserLocationValue>({
    latitude: null,
    longitude: null,
    homePincode: null,
    locationLabel: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (location.latitude == null || location.longitude == null) {
      setError("Please set your location using GPS or your 6-digit PIN code.");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("willing_to_donate", willingToDonate ? "true" : "false");
    formData.set("use_my_location", useMyLocation ? "true" : "false");
    formData.set("latitude", String(location.latitude));
    formData.set("longitude", String(location.longitude));
    if (location.homePincode) formData.set("home_pincode", location.homePincode);
    if (location.locationLabel) formData.set("location_label", location.locationLabel);
    const result = await completeProfile(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = "/home";
  }

  if (step === "intro") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-8">
        <OnboardingIntro onContinue={() => setStep("profile")} onSkip={() => setStep("profile")} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-8">
      <div className="w-full max-w-lg animate-scale-in">
        <button
          type="button"
          onClick={() => setStep("intro")}
          className="mb-4 inline-flex items-center gap-1 text-[15px] font-medium text-[var(--accent)] hover:opacity-80"
        >
          <ChevronLeft className="h-4 w-4" />
          How BloodLink works
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Droplets className="h-7 w-7" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Complete your profile</h1>
          <p className="mt-1.5 text-[15px] text-[var(--label-secondary)]">
            Add your name and location so we can show relevant requests and communities. Donor details are optional.
          </p>
        </div>

        <div className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Your full name" required />
            </div>
            <div>
              <Label>Your location</Label>
              <p className="mb-2 text-[12px] text-[var(--label-secondary)]">
                Used to estimate distance to patients—never shown as your exact address on public lists.
              </p>
              <div className="mb-3 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-3">
                <Switch
                  checked={useMyLocation}
                  onChange={setUseMyLocation}
                  label="Use my location"
                  description="When off, use your PIN code instead (valid for 3 days)"
                />
              </div>
              <UserLocationEditor
                value={location}
                useMyLocation={useMyLocation}
                onChange={setLocation}
                onSaveGps={async (lat, lng) => {
                  setUseMyLocation(true);
                  setLocation({
                    latitude: lat,
                    longitude: lng,
                    homePincode: null,
                    locationLabel: `GPS · ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
                  });
                }}
                onSavePincode={async (pincode) => {
                  setUseMyLocation(false);
                  const result = await lookupPincode(pincode);
                  if ("error" in result) return { error: result.error };
                  const d = result.data;
                  return {
                    data: {
                      latitude: d.latitude,
                      longitude: d.longitude,
                      homePincode: d.pincode,
                      locationLabel: d.displayLocation,
                    },
                  };
                }}
                showProfileLink={false}
              />
            </div>

            <div className="rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-4">
              <Switch
                checked={willingToDonate}
                onChange={setWillingToDonate}
                label="I am willing to donate blood"
                description="Register as a donor to help patients nearby"
              />
              {willingToDonate && (
                <div className="mt-4 space-y-4 border-t border-[var(--separator)] pt-4">
                  <div>
                    <Label htmlFor="blood_group">Blood group</Label>
                    <Select id="blood_group" name="blood_group" required>
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="last_donation_date">Last donation date</Label>
                    <Input id="last_donation_date" name="last_donation_date" type="date" required />
                    <p className="mt-1.5 text-[12px] text-[var(--label-secondary)]">
                      You must wait 90 days between donations.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[var(--accent)]">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Saving..." : "Continue to BloodLink"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
