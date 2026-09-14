"use client";

import { useState } from "react";
import Link from "next/link";
import { createCommunity } from "@/lib/actions/communities";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function NewCommunityPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await createCommunity(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = `/communities/${result.id}`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/communities" className="text-sm text-[var(--accent)] hover:underline">
        ← Back to communities
      </Link>
      <PageHeader
        title="Create Community"
        subtitle="Build a group for your organization, college, or neighborhood"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">Community name</Label>
            <Input id="name" name="name" placeholder="e.g. Palakkad Blood Donors" required />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What is this community about?"
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select id="visibility" name="visibility" defaultValue="public">
              <option value="public">Public — anyone can join</option>
              <option value="private">Private — invite only</option>
            </Select>
            <p className="mt-1.5 text-[13px] text-[var(--label-secondary)]">
              Private communities require an invite link or admin approval to join.
            </p>
          </div>

          {error && (
            <div className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-4 py-3 text-[14px] text-[var(--accent)]">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create community"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
