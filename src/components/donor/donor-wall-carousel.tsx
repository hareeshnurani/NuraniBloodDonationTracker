"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DonorActiveRequestRow } from "@/lib/donor-donate-feed";
import { DonorWallRequestCard } from "@/components/donor/donor-wall-request-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DonorWallCarousel({
  rows,
  donorAvailable,
}: {
  rows: DonorActiveRequestRow[];
  donorAvailable: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || rows.length === 0) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? el.clientWidth;
    const gap = 16;
    const idx = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(Math.max(0, idx), rows.length - 1));
  }, [rows.length]);

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

  if (rows.length === 0) return null;

  return (
    <div className="relative">
      {rows.length > 1 && (
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
            onClick={() => scrollTo(Math.min(rows.length - 1, activeIndex + 1))}
            disabled={activeIndex === rows.length - 1}
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
        {rows.map((row) => (
          <div
            key={row.requestId}
            className="w-[min(100%,340px)] shrink-0 snap-center sm:w-[360px]"
          >
            <DonorWallRequestCard row={row} donorAvailable={donorAvailable} />
          </div>
        ))}
      </div>

      {rows.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {rows.map((_, i) => (
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
