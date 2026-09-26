import { createServiceClient } from "@/lib/supabase/admin";
import { appBaseUrl, sendEmailAlert } from "@/lib/email-alerts";

export async function notifyUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  payload: Record<string, unknown> = {},
  options?: { email?: boolean; path?: string }
) {
  const supabase = createServiceClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    payload,
  });

  if (options?.email === false) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, name")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.email) return;

  const path = options?.path ?? "/notifications";
  const link = `${appBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  await sendEmailAlert({
    to: profile.email,
    subject: `[BloodLink] ${title}`,
    text: `${body}\n\nOpen BloodLink: ${link}`,
  });
}
