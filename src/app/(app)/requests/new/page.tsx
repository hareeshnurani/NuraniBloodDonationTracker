"use client";

import { useState } from "react";
import { createBloodRequest } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LocationPicker } from "@/components/location-picker";
import { BLOOD_GROUPS } from "@/lib/constants";

export default function NewRequestPage() {
  const [acceptsReplacement, setAcceptsReplacement] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, publish: boolean) {
    e.preventDefault();
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
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Create blood request</h1>
      <p className="mt-1 text-sm text-gray-500">
        All matching donors within 50 km will be notified when you publish.
      </p>
      <Card className="mt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e, true);
          }}
          className="space-y-4"
          id="request-form"
        >
          <div>
            <Label htmlFor="patient_name">Patient name *</Label>
            <Input id="patient_name" name="patient_name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="primary_blood_group">Blood group needed *</Label>
              <Select id="primary_blood_group" name="primary_blood_group" required>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="units_needed">Units needed *</Label>
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
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={acceptsReplacement}
                onChange={(e) => setAcceptsReplacement(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600"
              />
              <span className="text-sm font-medium">Other groups accepted as replacement?</span>
            </label>
            {acceptsReplacement && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <label key={bg} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="replacement_groups" value={bg} />
                    {bg}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select id="priority" name="priority" required defaultValue="routine">
                <option value="emergency">Emergency</option>
                <option value="routine">Routine</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline *</Label>
              <Input id="deadline" name="deadline" type="datetime-local" required />
            </div>
          </div>
          <div>
            <Label>Request location (GPS) *</Label>
            <LocationPicker onLocation={() => {}} />
          </div>
          <div>
            <Label htmlFor="hospital_notes">Hospital / additional notes</Label>
            <Textarea id="hospital_notes" name="hospital_notes" rows={3} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Publishing..." : "Publish request"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={(e) => {
                const form = document.getElementById("request-form") as HTMLFormElement;
                handleSubmit({ preventDefault: () => {}, currentTarget: form } as React.FormEvent<HTMLFormElement>, false);
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
