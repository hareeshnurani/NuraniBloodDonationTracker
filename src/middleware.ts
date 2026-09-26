import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/home/:path*",
    "/admin/:path*",
    "/requests/:path*",
    "/donor/:path*",
    "/donate/:path*",
    "/chat/:path*",
    "/communities/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/onboarding",
    "/pending-approval",
    "/rejected",
    "/auth/callback",
  ],
};
