"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateProfileName } from "@/lib/actions/profile";
import { ProfileSubpageBack } from "@/components/profile/profile-subpage-back";
import { PageHeader } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { USER_STATUS_LABELS } from "@/lib/constants";
import { User, Mail, ShieldCheck, ChevronRight } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function ProfileAccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) return;
      const prof = p as Profile;
      setProfile(prof);
      setName(prof.name);
    }
    load();
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await updateProfileName(name);
    setLoading(false);
    if (result.error) setMessage(result.error);
    else {
      setMessage(result.message ?? "Saved.");
      if (profile) setProfile({ ...profile, name: name.trim() });
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const statusLabel = USER_STATUS_LABELS[profile.status] ?? profile.status.replace(/_/g, " ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfileSubpageBack />
      <PageHeader title="Account" subtitle="Your name, email, and account status" />

      <GroupedSection title="Display name">
        <form onSubmit={handleSaveName} className="space-y-4 p-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          {message && (
            <p
              className={`text-[13px] ${
                message.includes("updated") || message.includes("Saved")
                  ? "text-[var(--success)]"
                  : "text-[var(--accent)]"
              }`}
            >
              {message}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save name"}
          </Button>
        </form>
      </GroupedSection>

      <GroupedSection title="Email">
        <GroupedRow href="/profile/security/email" showChevron>
          <GroupedRowIcon color="gray">
            <Mail className="h-4 w-4" />
          </GroupedRowIcon>
          <div>
            <p className="text-[15px] font-medium text-[var(--label)]">{profile.email}</p>
            <p className="text-[13px] text-[var(--label-secondary)]">Change email address</p>
          </div>
        </GroupedRow>
      </GroupedSection>

      <GroupedSection title="Status">
        <GroupedRow>
          <GroupedRowIcon color="green">
            <ShieldCheck className="h-4 w-4" />
          </GroupedRowIcon>
          <div>
            <p className="text-[15px] font-medium text-[var(--label)]">{statusLabel}</p>
            <p className="text-[13px] text-[var(--label-secondary)]">
              {profile.status === "active"
                ? "Your account is approved and can use BloodLink."
                : profile.status === "pending_approval"
                  ? "An administrator is reviewing your registration."
                  : "Contact support if you need help with your account."}
            </p>
          </div>
        </GroupedRow>
      </GroupedSection>

      <p className="px-1 text-[13px] text-[var(--label-secondary)]">
        <User className="mr-1 inline h-3.5 w-3.5" />
        Need to update your password?{" "}
        <Link href="/profile/security/password" className="font-medium text-[var(--accent)] hover:underline">
          Change password
          <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
        </Link>
      </p>
    </div>
  );
}
