import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Droplets, Shield, MapPin, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2 font-bold text-red-600">
          <Droplets className="h-7 w-7" />
          BloodLink
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Blood donation requests,
          <br />
          <span className="text-red-600">managed professionally</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Raise blood requests, get matched with nearby donors within 50 km, and coordinate
          securely through in-app chat — without exposing personal contact details.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Log in</Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-left">
            <MapPin className="h-8 w-8 text-red-500" />
            <h3 className="mt-4 font-semibold text-gray-900">GPS matching</h3>
            <p className="mt-2 text-sm text-gray-500">
              All eligible donors within 50 km are notified automatically when you publish a request.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-left">
            <Shield className="h-8 w-8 text-red-500" />
            <h3 className="mt-4 font-semibold text-gray-900">Privacy first</h3>
            <p className="mt-2 text-sm text-gray-500">
              Donor phone numbers stay hidden. All communication happens inside the app.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-left">
            <MessageCircle className="h-8 w-8 text-red-500" />
            <h3 className="mt-4 font-semibold text-gray-900">In-app coordination</h3>
            <p className="mt-2 text-sm text-gray-500">
              Chat with confirmed donors, track responses, and manage requests end to end.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        BloodLink — Blood donation request management system
      </footer>
    </div>
  );
}
