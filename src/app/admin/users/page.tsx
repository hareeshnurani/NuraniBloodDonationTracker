import Link from "next/link";
import { Suspense } from "react";
import { createServiceClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/card";
import { USER_STATUS_LABELS } from "@/lib/constants";
import { AdminFilterPills } from "@/components/admin/admin-filter-pills";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Users } from "lucide-react";

const USER_FILTERS = [
  { id: "all", label: "All" },
  { id: "donors", label: "Donors" },
  { id: "available", label: "Available" },
  { id: "suspended", label: "Suspended" },
] as const;

type FilterId = (typeof USER_FILTERS)[number]["id"];

function parseFilter(raw: string | undefined): FilterId {
  if (raw && USER_FILTERS.some((f) => f.id === raw)) return raw as FilterId;
  return "all";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const supabase = createServiceClient();

  let query = supabase.from("profiles").select("*, donor_profiles(blood_group, is_available, willing_to_donate)");

  if (filter === "donors") {
    query = supabase
      .from("profiles")
      .select("*, donor_profiles!inner(blood_group, is_available, willing_to_donate)");
  } else if (filter === "available") {
    query = supabase
      .from("profiles")
      .select("*, donor_profiles!inner(blood_group, is_available, willing_to_donate)")
      .eq("donor_profiles.is_available", true)
      .eq("donor_profiles.willing_to_donate", true);
  } else if (filter === "suspended") {
    query = query.eq("status", "suspended");
  }

  const { data: users } = await query.order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Pilot accounts, donors, availability, and suspensions." />

      <Suspense fallback={<div className="h-10" aria-hidden />}>
        <AdminFilterPills basePath="/admin/users" paramName="filter" pills={[...USER_FILTERS]} />
      </Suspense>

      {!users?.length ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No users in this view"
          description="Adjust the filter or wait for new sign-ups."
        />
      ) : (
        <GroupedSection>
          {users.map((user) => {
            const donor = user.donor_profiles as
              | { blood_group: string; is_available: boolean; willing_to_donate: boolean }
              | { blood_group: string; is_available: boolean; willing_to_donate: boolean }[]
              | null;
            const donorRow = Array.isArray(donor) ? donor[0] : donor;

            return (
              <GroupedRow key={user.id} href={`/admin/users/${user.id}`} showChevron>
                <GroupedRowIcon color="blue">
                  <Users className="h-4 w-4" />
                </GroupedRowIcon>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium text-[var(--label)]">{user.name}</span>
                    {user.role === "admin" && <Badge variant="emergency">Admin</Badge>}
                    <Badge variant={user.status === "suspended" ? "warning" : "default"}>
                      {USER_STATUS_LABELS[user.status]}
                    </Badge>
                    {donorRow?.is_available && donorRow.willing_to_donate && (
                      <Badge variant="success">Available donor</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--label-secondary)]">
                    {user.email}
                    {donorRow?.blood_group ? ` · ${donorRow.blood_group}` : ""}
                  </p>
                </div>
              </GroupedRow>
            );
          })}
        </GroupedSection>
      )}
    </div>
  );
}
