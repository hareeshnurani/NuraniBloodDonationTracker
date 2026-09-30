import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { AppNav } from "@/components/layout/app-nav";
import { AdminSubNav } from "@/components/layout/admin-sub-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const supabase = createServiceClient();
  const { count: moderationOpenCount } = await supabase
    .from("content_reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNav isAdmin />
      <AdminSubNav moderationOpenCount={moderationOpenCount ?? 0} />
      <main className="mx-auto max-w-5xl px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:px-5 lg:py-6 lg:pb-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
