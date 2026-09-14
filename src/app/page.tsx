import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Droplets, Shield, MapPin, MessageCircle, Heart, Users } from "lucide-react";

const features = [
  {
    icon: MapPin,
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent-soft)]",
    title: "GPS matching",
    description:
      "All eligible donors within 50 km are notified automatically when you publish a request.",
  },
  {
    icon: Shield,
    color: "text-[#007aff]",
    bg: "bg-[#007aff1a]",
    title: "Privacy first",
    description:
      "Donor phone numbers stay hidden. All communication happens inside the app.",
  },
  {
    icon: MessageCircle,
    color: "text-[var(--success)]",
    bg: "bg-[var(--success-soft)]",
    title: "In-app coordination",
    description:
      "Chat with confirmed donors, track responses, and manage requests end to end.",
  },
];

const stats = [
  { icon: Heart, label: "Lives saved", value: "Every donation counts" },
  { icon: Users, label: "Community", value: "Connect with nearby donors" },
  { icon: Droplets, label: "Smart matching", value: "Blood group compatibility" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="glass sticky top-0 z-50 border-b border-[var(--separator)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[var(--accent)] text-white">
              <Droplets className="h-5 w-5" />
            </div>
            <span className="text-[17px] font-semibold text-[var(--label)]">BloodLink</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pt-16 pb-20 text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--accent-soft)]">
            <Droplets className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h1 className="text-[48px] sm:text-[56px] font-bold tracking-tight text-[var(--label)] leading-[1.08]">
            Blood donation,
            <br />
            <span className="text-[var(--accent)]">made simple.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[19px] text-[var(--label-secondary)] leading-relaxed">
            Raise blood requests, get matched with nearby donors within 50 km, and coordinate
            securely — without exposing personal contact details.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="min-w-[180px]">Get started</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="min-w-[180px]">Log in</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[12px] ${feature.bg}`}>
                  <feature.icon className={`h-5.5 w-5.5 ${feature.color}`} />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[var(--label)]">{feature.title}</h3>
                <p className="mt-2 text-[15px] text-[var(--label-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--separator)] bg-[var(--surface)]">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
                    <stat.icon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <p className="text-[13px] font-medium text-[var(--label-secondary)] uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-[17px] font-semibold text-[var(--label)]">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--separator)] py-8 text-center">
        <p className="text-[13px] text-[var(--label-secondary)]">
          BloodLink — Blood donation request management
        </p>
      </footer>
    </div>
  );
}
