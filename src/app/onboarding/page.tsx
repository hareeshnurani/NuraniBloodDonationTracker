"use client";

import { useState } from "react";
import { completeProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LocationPicker } from "@/components/location-picker";
import { BLOOD_GROUPS } from "@/lib/constants";

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tell us a bit about yourself. An admin will review your account before you can use the
          app.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label>Your location (GPS)</Label>
            <LocationPicker onLocation={() => {}} />
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={willingToDonate}
                onChange={(e) => setWillingToDonate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <span className="text-sm font-medium text-gray-900">
                I am willing to donate blood
              </span>
            </label>
            {willingToDonate && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
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
                  <p className="mt-1 text-xs text-gray-500">
                    You must wait 90 days between donations.
                  </p>
                </div>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit for approval"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
