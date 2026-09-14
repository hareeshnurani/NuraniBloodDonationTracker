"use client";

import { useState } from "react";
import { completeProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { LocationPicker } from "@/components/location-picker";
import { Switch } from "@/components/ui/switch";
import { BLOOD_GROUPS } from "@/lib/constants";
import { Droplets } from "lucide-react";

export default function OnboardingPage() {
  const [willingToDonate, setWillingToDonate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("willing_to_donate", willingToDonate ? "true" : "false");
    const result = await completeProfile(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = "/pending-approval";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-8">
      <div className="w-full max-w-lg animate-scale-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Droplets className="h-7 w-7" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Complete your profile</h1>
          <p className="mt-1.5 text-[15px] text-[var(--label-secondary)]">
            Tell us about yourself. An admin will review your account.
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
              <LocationPicker onLocation={() => {}} />
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
                        <option key={bg} value={bg}>{bg}</option>
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
              {loading ? "Submitting..." : "Submit for approval"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
