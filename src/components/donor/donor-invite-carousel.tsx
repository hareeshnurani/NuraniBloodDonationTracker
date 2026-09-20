"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DonorHomeCard } from "@/lib/donor-feed";
import { DonorInviteCard } from "@/components/donor/donor-invite-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DonorInviteCarousel({ cards }: { cards: DonorHomeCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || cards.length === 0) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? el.clientWidth;
    const gap = 16;
    const idx = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(Math.max(0, idx), cards.length - 1));
  }, [cards.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateIndexFromScroll, { passive: true });
    return () => el.removeEventListener("scroll", updateIndexFromScroll);
  }, [updateIndexFromScroll]);

  function scrollTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(index);
  }

  if (cards.length === 0) return null;

  return (
    <div className="relative">
      {cards.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous request"
            onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-[var(--separator)] bg-[var(--surface)]/95 p-2 shadow-[var(--shadow-sm)] disabled:opacity-30 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next request"
            onClick={() => scrollTo(Math.min(cards.length - 1, activeIndex + 1))}
            disabled={activeIndex === cards.length - 1}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-[var(--separator)] bg-[var(--surface)]/95 p-2 shadow-[var(--shadow-sm)] disabled:opacity-30 sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={scrollerRef}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-1 pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {cards.map((card) => (
          <div
            key={card.invitationId}
            className="w-[min(100%,340px)] shrink-0 snap-center sm:w-[360px]"
          >
            <DonorInviteCard card={card} />
          </div>
        ))}
      </div>

      {cards.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to request ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                i === activeIndex
                  ? "w-6 bg-[var(--accent)]"
                  : "w-2 bg-[var(--label-tertiary)]/40 hover:bg-[var(--label-tertiary)]"
              )}
            />
          ))}
          <p className="ml-2 text-[12px] text-[var(--label-tertiary)]">Swipe for more</p>
        </div>
      )}
    </div>
  );
}
