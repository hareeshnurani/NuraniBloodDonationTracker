import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth refresh when env vars are missing (e.g. misconfigured deploy)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session only when missing or near expiry — avoids a Supabase round-trip on every navigation.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = session?.expires_at ?? 0;
  const shouldValidate =
    !session || expiresAt - nowSec < 120;

  if (shouldValidate) {
    await supabase.auth.getUser();
  }

  return supabaseResponse;
}
