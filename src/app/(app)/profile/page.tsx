"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateDonorProfile } from "@/lib/actions/profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { LocationPicker } from "@/components/location-picker";
import { BLOOD_GROUPS } from "@/lib/constants";
import { getEligibleDate, isDonorEligible } from "@/lib/utils";
import { format } from "date-fns";
import type { Profile, DonorProfile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p as Profile);
      const { data: d } = await supabase.from("donor_profiles").select("*").eq("user_id", user.id).maybeSingle();
      setDonor(d as DonorProfile | null);
    }
    load();
  }, []);

  async function handleDonorUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const result = await updateDonorProfile(formData);
    if (result.error) setMessage(result.error);
    else setMessage("Profile updated.");
    setLoading(false);
  }

  if (!profile) return <p className="text-gray-500">Loading...</p>;

  const eligible = donor ? isDonorEligible(donor.last_donation_date) : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <Card>
        <h2 className="font-semibold text-gray-900">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{profile.name}</dd></div>
          <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{profile.email}</dd></div>
          <div><dt className="text-gray-500">Status</dt><dd className="font-medium capitalize">{profile.status.replace("_", " ")}</dd></div>
        </dl>
        <div className="mt-4">
          <Label>Update location</Label>
          <LocationPicker
            defaultLat={profile.latitude}
            defaultLng={profile.longitude}
            onLocation={async (lat, lng) => {
              const supabase = createClient();
              await supabase.from("profiles").update({ latitude: lat, longitude: lng }).eq("id", profile.id);
            }}
          />
        </div>
      </Card>
      {donor && (
        <Card>
          <h2 className="font-semibold text-gray-900">Donor profile</h2>
          <form onSubmit={handleDonorUpdate} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="blood_group">Blood group</Label>
              <Select id="blood_group" name="blood_group" defaultValue={donor.blood_group}>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="last_donation_date">Last donation date</Label>
              <Input
                id="last_donation_date"
                name="last_donation_date"
                type="date"
                defaultValue={donor.last_donation_date ?? ""}
              />
              {donor.last_donation_date && !eligible && (
                <p className="mt-1 text-xs text-amber-600">
                  Eligible again on {format(getEligibleDate(donor.last_donation_date), "MMM d, yyyy")}
                </p>
              )}
            </div>
            {message && <p className="text-sm text-green-600">{message}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save donor profile"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
