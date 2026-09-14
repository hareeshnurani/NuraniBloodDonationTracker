"use client";

import { useState } from "react";
import { createBloodRequest } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  HospitalLocationPicker,
  isHospitalLocationValid,
  type HospitalLocationValue,
} from "@/components/hospital-location-picker";
import { PageHeader } from "@/components/ui/page-header";
import { BLOOD_GROUPS } from "@/lib/constants";
import { CommunitySelector } from "@/components/communities/community-selector";

const initialLocation: HospitalLocationValue = {
  mode: "list",
  facility: null,
  customHospitalName: "",
  pincodeInfo: null,
};

export default function NewRequestPage() {
  const [acceptsReplacement, setAcceptsReplacement] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<HospitalLocationValue>(initialLocation);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, publish: boolean) {
    e.preventDefault();
    if (!isHospitalLocationValid(location)) {
      setError(
        location.mode === "custom"
          ? "Please enter the hospital name and a valid PIN code."
          : "Please select a hospital or blood bank from the list."
      );
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("publish", publish ? "true" : "false");
    formData.set("accepts_replacement", acceptsReplacement ? "true" : "false");
    const result = await createBloodRequest(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = `/requests/${result.id}`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Create Request"
        subtitle="Select a hospital or enter its name and PIN code. Nearby donors and community members will be notified."
      />

      <Card className="overflow-visible">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e, true);
          }}
          className="space-y-5"
          id="request-form"
        >
          <div>
            <Label htmlFor="patient_name">Patient name</Label>
            <Input id="patient_name" name="patient_name" placeholder="Patient's full name" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="primary_blood_group">Blood group needed</Label>
              <Select id="primary_blood_group" name="primary_blood_group" required>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="units_needed">Units needed</Label>
              <Input
                id="units_needed"
                name="units_needed"
                type="number"
                min={1}
                max={10}
                defaultValue={1}
                required
              />
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={acceptsReplacement}
                onChange={(e) => setAcceptsReplacement(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[var(--accent)]"
              />
              <span className="text-[15px] font-medium text-[var(--label)]">
                Other blood groups accepted as replacement?
              </span>
            </label>
            {acceptsReplacement && (
              <div className="mt-3 grid grid-cols-4 gap-2 border-t border-[var(--separator)] pt-3">
                {BLOOD_GROUPS.map((bg) => (
                  <label key={bg} className="flex items-center gap-1.5 text-[14px]">
                    <input type="checkbox" name="replacement_groups" value={bg} />
                    {bg}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" name="priority" required defaultValue="routine">
                <option value="emergency">Emergency</option>
                <option value="routine">Routine</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="datetime-local" required />
            </div>
          </div>

          <div>
            <Label>Share with communities (optional)</Label>
            <div className="mt-2">
              <CommunitySelector selected={selectedCommunities} onChange={setSelectedCommunities} />
            </div>
          </div>

          <div className="relative z-20 overflow-visible">
            <Label>Hospital / Blood bank location</Label>
            <p className="mb-3 text-[13px] text-[var(--label-secondary)]">
              Choose from our list of 230+ hospitals and blood banks, or enter manually using the hospital PIN code.
            </p>
            <HospitalLocationPicker value={location} onChange={setLocation} />
          </div>

          <div>
            <Label htmlFor="hospital_notes">Additional notes</Label>
            <Textarea
              id="hospital_notes"
              name="hospital_notes"
              rows={3}
              placeholder="Ward number, contact person, or other details (optional)"
            />
          </div>

          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[var(--accent)]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={loading} className="sm:flex-1">
              {loading ? "Publishing..." : "Publish request"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              className="sm:flex-1"
              onClick={() => {
                const form = document.getElementById("request-form") as HTMLFormElement;
                handleSubmit(
                  { preventDefault: () => {}, currentTarget: form } as React.FormEvent<HTMLFormElement>,
                  false
                );
              }}
            >
              Save as draft
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
