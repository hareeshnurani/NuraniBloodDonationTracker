"use client";

import { useState } from "react";
import {
  Droplets,
  MapPin,
  Users,
  MessageCircle,
  ShieldCheck,
  Heart,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OnboardingIntroProps = {
  onContinue: () => void;
  onSkip: () => void;
};

const SLIDES = [
  {
    id: "purpose",
    title: "Blood help, close to home",
    subtitle:
      "BloodLink connects people who need blood with willing donors in their communities—fast, coordinated, and human.",
    visual: "purpose" as const,
  },
  {
    id: "flow",
    title: "How it works",
    subtitle:
      "From signup to donation, each step is clear. You can post requests, join groups, or respond when someone nearby needs help.",
    visual: "flow" as const,
  },
  {
    id: "data",
    title: "Why we ask for your details",
    subtitle:
      "We only collect what matching and safety need. You stay in control of donor mode and when you appear as available.",
    visual: "data" as const,
  },
];

function PurposeVisual() {
  return (
    <div className="relative mx-auto flex h-[200px] w-full max-w-[320px] items-center justify-center">
      <div className="absolute inset-0 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--accent-soft)] via-[var(--surface-secondary)] to-[var(--purple-soft)]" />
      <div className="relative flex flex-col items-center gap-4 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--accent)] text-white shadow-[var(--shadow-md)]">
          <Droplets className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-3">
          <MiniPill icon={<Users className="h-3.5 w-3.5" />} label="Groups" />
          <span className="text-[var(--label-tertiary)]">→</span>
          <MiniPill icon={<Heart className="h-3.5 w-3.5" />} label="Requests" />
          <span className="text-[var(--label-tertiary)]">→</span>
          <MiniPill icon={<MessageCircle className="h-3.5 w-3.5" />} label="Chat" />
        </div>
        <p className="text-center text-[13px] leading-snug text-[var(--label-secondary)]">
          One place to see urgent needs, coordinate with requesters, and share updates with your community.
        </p>
      </div>
    </div>
  );
}

function FlowVisual() {
  const steps = [
    { n: 1, label: "Create account", detail: "Email sign-up" },
    { n: 2, label: "Your profile", detail: "Name & location" },
    { n: 3, label: "Explore", detail: "Home, groups, donate" },
    { n: 4, label: "Respond", detail: "Accept, chat, donate" },
  ];

  return (
    <div className="mx-auto w-full max-w-[340px] space-y-0">
      {steps.map((step, i) => (
        <div key={step.n} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">
              {step.n}
            </div>
            {i < steps.length - 1 && (
              <div className="my-1 w-0.5 flex-1 min-h-[28px] rounded-full bg-[var(--separator-opaque)]" />
            )}
          </div>
          <div className={cn("pb-4", i === steps.length - 1 && "pb-0")}>
            <p className="text-[15px] font-semibold text-[var(--label)]">{step.label}</p>
            <p className="text-[13px] text-[var(--label-secondary)]">{step.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataVisual() {
  const items = [
    {
      icon: MapPin,
      color: "red" as const,
      title: "Location",
      body: "Match you with requests near you. GPS or PIN—your choice.",
    },
    {
      icon: ClipboardList,
      color: "purple" as const,
      title: "Donor details (optional)",
      body: "Blood group and last donation date for safe matching and the 90-day rule.",
    },
    {
      icon: ShieldCheck,
      color: "green" as const,
      title: "Your control",
      body: "Turn donor availability on only when you are ready. Chat stays in-app.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[340px] space-y-2.5">
      {items.map(({ icon: Icon, color, title, body }) => (
        <div
          key={title}
          className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--separator)] bg-[var(--surface-secondary)] p-3.5"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
              color === "red" && "bg-[var(--accent-soft)] text-[var(--accent)]",
              color === "purple" && "bg-[var(--purple-soft)] text-[var(--purple)]",
              color === "green" && "bg-[var(--success-soft)] text-[var(--success)]"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--label)]">{title}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-[var(--label-secondary)]">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--label)] shadow-[var(--shadow-sm)]">
      <span className="text-[var(--accent)]">{icon}</span>
      {label}
    </div>
  );
}

export function OnboardingIntro({ onContinue, onSkip }: OnboardingIntroProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function goNext() {
    if (isLast) onContinue();
    else setIndex((i) => i + 1);
  }

  return (
    <div className="w-full max-w-lg animate-scale-in">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-[var(--separator-opaque)]"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="text-[15px] font-medium text-[var(--accent)] hover:opacity-80"
        >
          Skip
        </button>
      </div>

      <div className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--accent)] text-white">
            <Droplets className="h-7 w-7" />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--label)] sm:text-[28px]">
            {slide.title}
          </h1>
          <p className="mx-auto mt-2 max-w-[340px] text-[15px] leading-relaxed text-[var(--label-secondary)]">
            {slide.subtitle}
          </p>
        </div>

        <div className="mb-8 min-h-[200px]">
          {slide.visual === "purpose" && <PurposeVisual />}
          {slide.visual === "flow" && <FlowVisual />}
          {slide.visual === "data" && <DataVisual />}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {index > 0 ? (
            <Button
              type="button"
              variant="ghost"
              className="order-2 sm:order-1"
              onClick={() => setIndex((i) => i - 1)}
            >
              Back
            </Button>
          ) : (
            <span className="hidden sm:block sm:flex-1" />
          )}
          <Button type="button" size="lg" className="order-1 w-full sm:order-2 sm:w-auto sm:min-w-[200px]" onClick={goNext}>
            {isLast ? "Set up my profile" : "Next"}
            {!isLast && <ChevronRight className="ml-1 h-5 w-5" />}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-[12px] text-[var(--label-tertiary)]">
        In a hurry? Tap Skip to go straight to your profile.
      </p>
    </div>
  );
}
