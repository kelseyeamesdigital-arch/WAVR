import { createPublicClient } from "@/lib/supabase/server";

// Per-client home-screen / tab icon.
//
// The HTML of our pages is cached and shared across every client's subdomain, so the
// icon can't be baked into it. Instead every page points at this one URL, and we
// resolve the right logo per request from the Host header
// (e.g. awastone.wavr.app -> Awastone's logo). That keeps the pages themselves
// static and fast while still giving each operator their own branding.

export async function GET(request: Request) {
  const host = request.headers.get("host") ?? "";
  const subdomain = host.split(":")[0].split(".")[0];

  if (subdomain) {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("profiles")
      .select("logo_url")
      .eq("subdomain", subdomain)
      .maybeSingle();

    const logoUrl = data?.logo_url;
    // Ignore legacy relative paths (e.g. "/logo-full.png") — only proxy real remote logos.
    if (logoUrl && /^https?:\/\//.test(logoUrl)) {
      try {
        const upstream = await fetch(logoUrl);
        if (upstream.ok) {
          return new Response(upstream.body, {
            headers: {
              "Content-Type": upstream.headers.get("content-type") ?? "image/png",
              // Cache at the edge; operators change their logo rarely.
              "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            },
          });
        }
      } catch {
        // fall through to the 404 below
      }
    }
  }

  // No operator match or no usable logo — let the browser fall back to the favicon
  // rather than showing another client's branding.
  return new Response(null, { status: 404 });
}
