import Link from "next/link";
import { format } from "date-fns";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { PageHeader, SectionHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection, GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Badge } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants";
import {
  AlertTriangle,
  Droplets,
  Heart,
  Shield,
  Users,
  ChevronRight,
  CircleCheckBig,
} from "lucide-react";

function profileName(profiles: { name: string } | { name: string }[] | null | undefined) {
  if (!profiles) return undefined;
  if (Array.isArray(profiles)) return profiles[0]?.name;
  return profiles.name;
}

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const [
    openRequestsRes,
    emergencyOpenRes,
    availableDonorsRes,
    confirmedDonationsRes,
    activeUsersRes,
    emergencyListRes,
    reportsRes,
    auditRes,
  ] = await Promise.all([
    supabase
      .from("blood_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "partially_filled"]),
    supabase
      .from("blood_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "partially_filled"])
      .eq("priority", "emergency"),
    supabase
      .from("donor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_available", true)
      .eq("willing_to_donate", true),
    supabase
      .from("donation_confirmations")
      .select("*", { count: "exact", head: true })
      .eq("status", "donated"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("blood_requests")
      .select("id, patient_name, primary_blood_group, units_filled, units_needed, deadline, priority")
      .in("status", ["open", "partially_filled"])
      .eq("priority", "emergency")
      .order("deadline", { ascending: true })
      .limit(5),
    supabase
      .from("content_reports")
      .select("id, entity_type, reason, created_at, profiles:reporter_id(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("audit_logs")
      .select("id, action, entity_type, created_at, profiles:actor_id(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const emergencyList = emergencyListRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const auditLogs = auditRes.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin"
        subtitle="Pilot overview — active needs, donor supply, trust queue, and impact."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard
          href="/admin/requests?filter=open"
          label="Open requests"
          value={openRequestsRes.count ?? 0}
          icon={Droplets}
          iconColor="red"
        />
        <AdminStatCard
          href="/admin/requests?filter=emergency"
          label="Emergency now"
          value={emergencyOpenRes.count ?? 0}
          icon={AlertTriangle}
          iconColor="orange"
        />
        <AdminStatCard
          href="/admin/users?filter=available"
          label="Available donors"
          value={availableDonorsRes.count ?? 0}
          subtitle="Willing + availability on"
          icon={Heart}
          iconColor="green"
        />
        <AdminStatCard
          href="/admin/requests?filter=fulfilled"
          label="Confirmed donations"
          value={confirmedDonationsRes.count ?? 0}
          subtitle="Pilot impact"
          icon={CircleCheckBig}
          iconColor="green"
        />
        <AdminStatCard
          href="/admin/users"
          label="Active users"
          value={activeUsersRes.count ?? 0}
          icon={Users}
          iconColor="blue"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeader
            title="Needs attention"
            action={
              <Link
                href="/admin/requests?filter=emergency"
                className="text-[15px] font-medium text-[var(--accent)] flex items-center gap-0.5"
              >
                All emergency <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {emergencyList.length > 0 ? (
            <GroupedSection>
              {emergencyList.map((req) => (
                <GroupedRow key={req.id} href={`/requests/${req.id}`} showChevron>
                  <GroupedRowIcon color="red">
                    <Droplets className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-medium text-[var(--label)]">
                        {req.patient_name}
                      </span>
                      <Badge variant="emergency">{PRIORITY_LABELS.emergency}</Badge>
                    </div>
                    <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                      {req.primary_blood_group} · {req.units_filled}/{req.units_needed} units ·
                      Deadline {format(new Date(req.deadline), "MMM d, h:mm a")}
                    </p>
                  </div>
                </GroupedRow>
              ))}
            </GroupedSection>
          ) : (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6" />}
              title="No emergency open requests"
              description="When an emergency is posted, it will appear here first."
            />
          )}
        </section>

        <section>
          <SectionHeader
            title="Moderation inbox"
            action={
              <Link
                href="/admin/reports"
                className="text-[15px] font-medium text-[var(--accent)] flex items-center gap-0.5"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {reports.length > 0 ? (
            <GroupedSection>
              {reports.map((r) => (
                <GroupedRow key={r.id} href="/admin/reports" showChevron>
                  <GroupedRowIcon color="orange">
                    <Shield className="h-4 w-4" />
                  </GroupedRowIcon>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-[var(--label)] capitalize">
                      {r.entity_type.replace("_", " ")} · {r.reason}
                    </p>
                    <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                      {profileName(r.profiles) ?? "Unknown"} ·{" "}
                      {format(new Date(r.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </GroupedRow>
              ))}
            </GroupedSection>
          ) : (
            <EmptyState
              icon={<Shield className="h-6 w-6" />}
              title="No open reports"
              description="User reports on chat or communities will show here."
            />
          )}
        </section>
      </div>

      <section>
        <SectionHeader
          title="Recent audit"
          action={
            <Link
              href="/admin/audit"
              className="text-[15px] font-medium text-[var(--accent)] flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        {auditLogs.length > 0 ? (
          <GroupedSection>
            {auditLogs.map((log) => (
              <GroupedRow key={log.id} href="/admin/audit">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-[var(--label)]">{log.action}</p>
                    <p className="text-[13px] text-[var(--label-secondary)]">
                      {log.entity_type} ·{" "}
                      {profileName(log.profiles) ?? "System"}
                    </p>
                  </div>
                  <time className="shrink-0 text-[12px] text-[var(--label-tertiary)]">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </time>
                </div>
              </GroupedRow>
            ))}
          </GroupedSection>
        ) : (
          <EmptyState title="No audit entries yet" description="Admin actions will be logged here." />
        )}
      </section>
    </div>
  );
}
