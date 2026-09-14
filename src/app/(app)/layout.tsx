import { requireActiveProfile } from "@/lib/auth";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireActiveProfile();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppNav isAdmin={profile.role === "admin"} />
      <main className="mx-auto max-w-5xl px-5 py-6 pb-24 md:pb-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
