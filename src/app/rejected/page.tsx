import { getProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default async function RejectedPage() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-bold">Account not approved</h1>
        <p className="mt-2 text-sm text-gray-500">
          {profile?.rejection_reason || "Your registration was not approved by an administrator."}
        </p>
      </Card>
    </div>
  );
}
