import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <Clock className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold">Awaiting admin approval</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your profile has been submitted. An administrator will review your details and approve
          your account. You will be notified once approved.
        </p>
      </Card>
    </div>
  );
}
