"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateDonorProfile, updateLocation, updateLocationFromPincode } from "@/lib/actions/profile";
import { Switch } from "@/components/ui/switch";
import { DonationHistory } from "@/components/donor/donation-history";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { UserLocationEditor, type UserLocationValue } from "@/components/user-location-editor";
import { BLOOD_GROUPS } from "@/lib/constants";
import { getEligibleDate, isDonorEligible } from "@/lib/utils";
import { User, Mail, Droplets, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Profile, DonorProfile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [donor, setDonor] = useState<DonorProfile | null>(null);
  const [location, setLocation] = useState<UserLocationValue>({
    latitude: null,
    longitude: null,
    homePincode: null,
    locationLabel: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const prof = p as Profile;
      setProfile(prof);
      setLocation({
        latitude: prof.latitude,
        longitude: prof.longitude,
        homePincode: prof.home_pincode ?? null,
        locationLabel: prof.location_label ?? null,
      });
      const { data: d } = await supabase.from("donor_profiles").select("*").eq("user_id", user.id).maybeSingle();
      setDonor(d as DonorProfile | null);
    }
    load();
  }, []);

  async function handleNotifyPreference(checked: boolean) {
    const formData = new FormData();
    formData.set("notify_community_only", checked ? "true" : "false");
    await updateDonorProfile(formData);
    if (donor) setDonor({ ...donor, notify_community_only: checked });
  }

  async function handleDonorUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(e.currentTarget);
    const result = await updateDonorProfile(formData);
    if (result.error) setMessage(result.error);
    else setMessage("Profile updated successfully.");
    setLoading(false);
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const eligible = donor ? isDonorEligible(donor.last_donation_date) : false;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Profile" subtitle="Manage your account and donor settings" />

      <GroupedSection title="Account">
        <GroupedRow>
          <GroupedRowIcon color="blue">
            <User className="h-4 w-4" />
          </GroupedRowIcon>
          <div>
            <p className="text-[13px] text-[var(--label-secondary)]">Name</p>
            <p className="text-[15px] font-medium text-[var(--label)]">{profile.name}</p>
          </div>
        </GroupedRow>
        <GroupedRow>
          <GroupedRowIcon color="gray">
            <Mail className="h-4 w-4" />
          </GroupedRowIcon>
          <div>
            <p className="text-[13px] text-[var(--label-secondary)]">Email</p>
            <p className="text-[15px] font-medium text-[var(--label)]">{profile.email}</p>
          </div>
        </GroupedRow>
        <GroupedRow>
          <GroupedRowIcon color="green">
            <User className="h-4 w-4" />
          </GroupedRowIcon>
          <div>
            <p className="text-[13px] text-[var(--label-secondary)]">Status</p>
            <p className="text-[15px] font-medium text-[var(--label)] capitalize">
              {profile.status.replace("_", " ")}
            </p>
          </div>
        </GroupedRow>
      </GroupedSection>

      <GroupedSection
        title="Location"
        footer="GPS or PIN code helps match you with nearby blood requests and show distance to hospitals."
      >
        <div className="p-4">
          <UserLocationEditor
            value={location}
            onChange={setLocation}
            onSaveGps={async (lat, lng) => {
              const result = await updateLocation(lat, lng);
              if (result.error) return { error: result.error };
              setProfile({
                ...profile,
                latitude: lat,
                longitude: lng,
                home_pincode: null,
                location_label: `GPS · ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
              });
            }}
            onSavePincode={async (pincode) => {
              const result = await updateLocationFromPincode(pincode);
              if (result.error) return { error: result.error };
              if (result.data) {
                setProfile({
                  ...profile,
                  latitude: result.data.latitude,
                  longitude: result.data.longitude,
                  home_pincode: result.data.homePincode,
                  location_label: result.data.locationLabel,
                });
                return { data: result.data };
              }
            }}
          />
        </div>
      </GroupedSection>

      {donor && <DonationHistory />}

      {donor && (
        <GroupedSection title="Notification Preferences">
          <div className="p-4">
            <Switch
              checked={donor.notify_community_only ?? false}
              onChange={handleNotifyPreference}
              label="Community-only notifications"
              description="Only get notified for requests in your communities. You can still browse and accept all active requests."
            />
          </div>
        </GroupedSection>
      )}

      {donor && (
        <GroupedSection title="Donor Profile">
          <form onSubmit={handleDonorUpdate} className="p-4 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-[var(--accent)]" />
                <Label htmlFor="blood_group" className="!mb-0 normal-case tracking-normal text-[15px] text-[var(--label)]">
                  Blood group
                </Label>
              </div>
              <Select id="blood_group" name="blood_group" defaultValue={donor.blood_group}>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-[var(--accent)]" />
                <Label htmlFor="last_donation_date" className="!mb-0 normal-case tracking-normal text-[15px] text-[var(--label)]">
                  Last donation date
                </Label>
              </div>
              <Input
                id="last_donation_date"
                name="last_donation_date"
                type="date"
                defaultValue={donor.last_donation_date ?? ""}
              />
              {donor.last_donation_date && !eligible && (
                <p className="mt-2 text-[13px] text-[var(--warning)]">
                  Eligible again on {format(getEligibleDate(donor.last_donation_date), "MMM d, yyyy")}
                </p>
              )}
              {donor.last_donation_date && eligible && (
                <p className="mt-2 text-[13px] text-[var(--success)]">You are eligible to donate</p>
              )}
            </div>
            {message && (
              <div className={`rounded-[var(--radius-md)] px-4 py-3 text-[14px] ${
                message.includes("error") || message.includes("Error")
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--success-soft)] text-[var(--success)]"
              }`}>
                {message}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save donor profile"}
            </Button>
          </form>
        </GroupedSection>
      )}
    </div>
  );
}
