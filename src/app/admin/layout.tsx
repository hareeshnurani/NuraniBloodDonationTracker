import { requireAdmin } from "@/lib/auth";
import { AppNav } from "@/components/layout/app-nav";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav isAdmin />
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-4 px-4 py-2 text-sm">
          <Link href="/admin" className="text-gray-600 hover:text-red-600">Dashboard</Link>
          <Link href="/admin/users" className="text-gray-600 hover:text-red-600">Users</Link>
          <Link href="/admin/requests" className="text-gray-600 hover:text-red-600">Requests</Link>
          <Link href="/admin/audit" className="text-gray-600 hover:text-red-600">Audit logs</Link>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
