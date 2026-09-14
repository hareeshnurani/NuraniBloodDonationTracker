import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { GroupedSection } from "@/components/ui/grouped-list";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const { profile } = await requireActiveProfile();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
      />
      {notifications && notifications.length > 0 ? (
        <GroupedSection>
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </GroupedSection>
      ) : (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications"
          description="You'll be notified when donors respond to your requests or when new invites arrive."
        />
      )}
    </div>
  );
}
