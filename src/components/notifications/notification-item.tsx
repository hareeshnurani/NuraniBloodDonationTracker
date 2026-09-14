"use client";

import { markNotificationRead } from "@/lib/actions/chat";
import { GroupedRow, GroupedRowIcon } from "@/components/ui/grouped-list";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import type { Notification } from "@/lib/types";

export function NotificationItem({ notification }: { notification: Notification }) {
  const isUnread = !notification.read_at;

  async function handleClick() {
    if (isUnread) {
      await markNotificationRead(notification.id);
    }
  }

  return (
    <GroupedRow onClick={handleClick}>
      <GroupedRowIcon color={isUnread ? "red" : "gray"}>
        <Bell className="h-4 w-4" />
      </GroupedRowIcon>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-[15px] ${isUnread ? "font-semibold text-[var(--label)]" : "font-medium text-[var(--label-secondary)]"}`}>
            {notification.title}
          </p>
          <time className="shrink-0 text-[12px] text-[var(--label-tertiary)]">
            {format(new Date(notification.created_at), "MMM d, h:mm a")}
          </time>
        </div>
        <p className="text-[13px] text-[var(--label-secondary)] mt-0.5 leading-relaxed">
          {notification.body}
        </p>
      </div>
      {isUnread && (
        <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
      )}
    </GroupedRow>
  );
}
