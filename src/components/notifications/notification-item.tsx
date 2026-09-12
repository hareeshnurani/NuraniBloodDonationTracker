"use client";

import { markNotificationRead } from "@/lib/actions/chat";
import { Card } from "@/components/ui/card";
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
    <Card
      className={isUnread ? "border-red-200 bg-red-50/50" : ""}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900">{notification.title}</p>
          <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
        </div>
        <time className="shrink-0 text-xs text-gray-400">
          {format(new Date(notification.created_at), "MMM d, h:mm a")}
        </time>
      </div>
    </Card>
  );
}
