"use client";

import { ProfileSubpageBack } from "@/components/profile/profile-subpage-back";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { PageHeader } from "@/components/ui/page-header";

export default function ChangePasswordPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ProfileSubpageBack />
      <PageHeader title="Change password" subtitle="Choose a new password for your BloodLink account" />
      <ChangePasswordForm />
    </div>
  );
}
