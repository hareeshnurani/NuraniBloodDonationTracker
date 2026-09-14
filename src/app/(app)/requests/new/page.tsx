"use client";

import { useState } from "react";
import { createBloodRequest } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FacilityPicker } from "@/components/facility-picker";
import { PageHeader } from "@/components/ui/page-header";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { Facility } from "@/lib/facilities";

export default function NewRequestPage() {
  const [acceptsReplacement, setAcceptsReplacement] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [facility, setFacility] = useState<Facility | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, publish: boolean) {
    e.preventDefault();
    if (!facility) {
      setError("Please select a hospital or blood bank.");
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
        subtitle="Select a hospital or blood bank. Donors within 50 km of that location will be notified."
      />

      <Card>
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
            <Label>Hospital / Blood bank location</Label>
            <p className="mb-2 text-[13px] text-[var(--label-secondary)]">
              Search and select where blood is needed. Donor matching uses this location.
            </p>
            <FacilityPicker onSelect={setFacility} required />
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
