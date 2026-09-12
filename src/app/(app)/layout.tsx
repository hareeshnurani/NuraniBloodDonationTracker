import { requireActiveProfile } from "@/lib/auth";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireActiveProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav isAdmin={profile.role === "admin"} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
