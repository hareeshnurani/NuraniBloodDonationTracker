"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileSubpageBack } from "@/components/profile/profile-subpage-back";
import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { PageHeader } from "@/components/ui/page-header";

export default function ChangeEmailPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    }
    load();
  }, []);

  if (!email) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfileSubpageBack />
      <PageHeader
        title="Change email"
        subtitle="We will send a confirmation link to your new address"
      />
      <ChangeEmailForm currentEmail={email} />
    </div>
  );
}
