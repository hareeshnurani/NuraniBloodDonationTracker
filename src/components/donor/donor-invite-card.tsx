import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatDistance } from "@/lib/utils";
import type { DonorHomeCard } from "@/lib/donor-feed";
import { InviteCardActions } from "@/components/donor/invite-card-actions";
import { AlertTriangle, ArrowUpRight, Clock, MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function UnitsProgress({ filled, needed }: { filled: number; needed: number }) {
  const pct = needed > 0 ? Math.min(100, Math.round((filled / needed) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[var(--label-secondary)]">Units collected</span>
        <span className="text-[15px] font-semibold tabular-nums text-[var(--label)]">
          {filled}
          <span className="text-[13px] font-normal text-[var(--label-tertiary)]"> / {needed}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#ff6b6b] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DonorInviteCard({ card }: { card: DonorHomeCard }) {
  const isEmergency = card.priority === "emergency";
  const detailHref = `/donor/invites/${card.invitationId}`;

  return (
    <article
      className={cn(
        "relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--separator)] bg-[var(--surface)] shadow-[var(--shadow-md)]",
        isEmergency && "ring-1 ring-[var(--accent)]/25"
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full shrink-0",
          isEmergency
            ? "bg-gradient-to-r from-[var(--accent)] via-[#ff453a] to-[var(--accent)]"
            : "bg-gradient-to-r from-[var(--label-tertiary)]/40 to-[var(--label-tertiary)]/10"
        )}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--label-tertiary)]">
              Patient
            </p>
            <h3 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-[var(--label)]">
              {card.patientName}
            </h3>
          </div>
          <Link
            href={detailHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--label-secondary)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
            aria-label="View full details"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-3 py-1.5 text-[15px] font-bold text-[var(--accent)]">
            {card.primaryBloodGroup} needed
          </span>
          <Badge variant={isEmergency ? "emergency" : "default"}>
            {isEmergency && <AlertTriangle className="mr-1 inline h-3 w-3" />}
            {PRIORITY_LABELS[card.priority] ?? card.priority}
          </Badge>
          {card.isReplacementMatch && (
            <Badge variant="replacement">
              <RefreshCw className="mr-1 inline h-3 w-3" />
              Replacement OK
            </Badge>
          )}
        </div>

        {card.isReplacementMatch && (
          <p className="mt-2 text-[12px] leading-snug text-[var(--label-secondary)]">
            Primary need is <strong>{card.primaryBloodGroup}</strong> — your group is accepted as replacement.
          </p>
        )}

        <div className="mt-4">
          <UnitsProgress filled={card.unitsFilled} needed={card.unitsNeeded} />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--label-secondary)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
            {formatDistance(card.distanceKm)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            By {format(new Date(card.deadline), "MMM d, h:mm a")}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <InviteCardActions
            invitationId={card.invitationId}
            requestId={card.requestId}
            distanceKm={card.distanceKm}
            compact
          />
          <Link
            href={detailHref}
            className="mt-3 block text-center text-[13px] font-medium text-[var(--accent)] hover:underline"
          >
            View hospital &amp; request details
          </Link>
        </div>
      </div>
    </article>
  );
}
