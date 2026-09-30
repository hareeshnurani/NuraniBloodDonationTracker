import { getAppShellContext } from "@/lib/auth";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, unreadAlerts } = await getAppShellContext();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNav isAdmin={profile.role === "admin"} unreadAlerts={unreadAlerts} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:px-5 lg:py-6 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
