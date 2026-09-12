import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Droplets } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <Card className="w-full max-w-md text-center">
        <Droplets className="mx-auto h-10 w-10 text-red-600" />
        <h1 className="mt-4 text-xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-gray-500">
          Please check your inbox and click the verification link before continuing.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-red-600 hover:underline">
          Back to login
        </Link>
      </Card>
    </div>
  );
}
