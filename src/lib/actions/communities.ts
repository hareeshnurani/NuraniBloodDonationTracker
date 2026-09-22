"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import type { CommunityVisibility } from "@/lib/types";

function generateInviteCode() {
  return randomBytes(6).toString("hex");
}

export async function createCommunity(formData: FormData) {
  const profile = await getProfile();
  if (!profile || profile.status !== "active") {
    return {
      error:
        profile?.status === "pending_approval"
          ? "Your account must be approved before you can create a community."
          : "Not authorized",
    };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const visibility = (formData.get("visibility") as CommunityVisibility) || "public";

  if (!name) return { error: "Community name is required" };

  const supabase = await createClient();
  const { data: community, error } = await supabase
    .from("communities")
    .insert({
      name,
      description,
      visibility,
      creator_id: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const service = createServiceClient();
  const { error: memberError } = await service.from("community_members").insert({
    community_id: community.id,
    user_id: profile.id,
    is_admin: true,
  });

  if (memberError) {
    await service.from("communities").delete().eq("id", community.id);
    return {
      error:
        memberError.message.includes("row-level security")
          ? "Could not finish creating the community. Please try again or contact support."
          : memberError.message,
    };
  }

  revalidatePath("/communities");
  revalidatePath("/home");
  return { success: true, id: community.id };
}

export async function joinCommunity(communityId: string) {
  const profile = await getProfile();
  if (!profile || profile.status !== "active") return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: community } = await supabase
    .from("communities")
    .select("visibility")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };
  if (community.visibility !== "public") return { error: "This community is private. Use an invite link." };

  const { error } = await supabase.from("community_members").upsert(
    { community_id: communityId, user_id: profile.id, is_admin: false },
    { onConflict: "community_id,user_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };
  revalidatePath("/communities");
  revalidatePath("/home");
  return { success: true };
}

export async function joinCommunityByCode(code: string) {
  const profile = await getProfile();
  if (!profile || profile.status !== "active") return { error: "Not authorized" };

  const supabase = createServiceClient();
  const { data: invite } = await supabase
    .from("community_invites")
    .select("*, communities(id, name)")
    .eq("code", code)
    .single();

  if (!invite) return { error: "Invalid invite link" };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "This invite link has expired" };
  }

  const { error } = await supabase.from("community_members").upsert(
    { community_id: invite.community_id, user_id: profile.id, is_admin: false },
    { onConflict: "community_id,user_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };
  revalidatePath("/communities");
  revalidatePath("/home");
  return { success: true, communityId: invite.community_id };
}

export async function leaveCommunity(communityId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: community } = await supabase
    .from("communities")
    .select("creator_id")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };

  const { count } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("is_admin", true);

  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership) return { error: "You are not a member" };

  if (community.creator_id === profile.id && (count ?? 0) <= 1) {
    return { error: "Transfer admin role before leaving, or delete the community." };
  }

  await supabase
    .from("user_community_pins")
    .delete()
    .eq("user_id", profile.id)
    .eq("community_id", communityId);

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };
  revalidatePath("/communities");
  revalidatePath("/home");
  return { success: true };
}

export async function createCommunityInvite(communityId: string, expiresInDays?: number) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership?.is_admin) return { error: "Only admins can create invite links" };

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: invite, error } = await supabase
    .from("community_invites")
    .insert({
      community_id: communityId,
      code: generateInviteCode(),
      created_by: profile.id,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/communities/${communityId}`);
  return { success: true, code: invite.code };
}

export async function addCommunityMember(communityId: string, userEmail: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = createServiceClient();
  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership?.is_admin) return { error: "Only admins can add members" };

  const { data: user } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", userEmail.trim().toLowerCase())
    .eq("status", "active")
    .single();

  if (!user) return { error: "User not found with that email" };

  const { error } = await supabase.from("community_members").upsert(
    { community_id: communityId, user_id: user.id, is_admin: false },
    { onConflict: "community_id,user_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };
  revalidatePath(`/communities/${communityId}`);
  return { success: true };
}

export async function removeCommunityMember(communityId: string, userId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership?.is_admin) return { error: "Only admins can remove members" };

  const { data: community } = await supabase
    .from("communities")
    .select("creator_id")
    .eq("id", communityId)
    .single();

  if (community?.creator_id === userId) {
    return { error: "Cannot remove the community creator" };
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath(`/communities/${communityId}`);
  return { success: true };
}

export async function setCommunityAdmin(communityId: string, userId: string, isAdmin: boolean) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership?.is_admin) return { error: "Only admins can change roles" };

  const { error } = await supabase
    .from("community_members")
    .update({ is_admin: isAdmin })
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath(`/communities/${communityId}`);
  return { success: true };
}

export async function pinCommunity(communityId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership) return { error: "You must be a member to pin" };

  const { data: existing } = await supabase
    .from("user_community_pins")
    .select("sort_order")
    .eq("user_id", profile.id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await supabase.from("user_community_pins").upsert(
    { user_id: profile.id, community_id: communityId, sort_order: nextOrder },
    { onConflict: "user_id,community_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/home");
  return { success: true };
}

export async function unpinCommunity(communityId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_community_pins")
    .delete()
    .eq("user_id", profile.id)
    .eq("community_id", communityId);

  if (error) return { error: error.message };
  revalidatePath("/home");
  return { success: true };
}

export async function reorderCommunityPins(communityIds: string[]) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  for (let i = 0; i < communityIds.length; i++) {
    await supabase
      .from("user_community_pins")
      .update({ sort_order: i })
      .eq("user_id", profile.id)
      .eq("community_id", communityIds[i]);
  }

  revalidatePath("/home");
  return { success: true };
}

export async function updateCommunity(communityId: string, formData: FormData) {
  const profile = await getProfile();
  if (!profile) return { error: "Not authorized" };

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("community_members")
    .select("is_admin")
    .eq("community_id", communityId)
    .eq("user_id", profile.id)
    .single();

  if (!membership?.is_admin) return { error: "Only admins can update the community" };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const visibility = formData.get("visibility") as CommunityVisibility;

  const { error } = await supabase
    .from("communities")
    .update({ name, description, visibility })
    .eq("id", communityId);

  if (error) return { error: error.message };
  revalidatePath(`/communities/${communityId}`);
  return { success: true };
}
