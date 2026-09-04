import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Guest sign pages are public — skip the auth-server round-trip entirely.
  // (This runs on every request, so avoiding getUser() here makes every guest
  // waiver load one network trip faster.)
  if (pathname.startsWith("/sign/")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public paths: login and signup (guest /sign/ pages already returned above)
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Guest sign pages are excluded entirely: they're public, need no auth check, and
  // keeping middleware off them lets their HTML be served straight from the CDN cache.
  matcher: ["/((?!sign/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
