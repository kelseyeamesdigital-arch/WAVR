import { createPublicClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import WaiverWizard from "@/components/WaiverWizard";

// Public page — revalidate the cached HTML every 5 min so guest loads are served
// from the CDN worldwide instead of each hitting the database in Ireland.
export const revalidate = 300;

// Pre-render every active waiver at build time so its HTML is served straight from
// the CDN edge nearest the guest (Sydney for NZ/AU) instead of running a function in
// Dublin on every load. Waivers created after a deploy still work — they render
// on-demand the first time, then get cached (dynamicParams defaults to true).
export async function generateStaticParams() {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("waivers")
      .select("id, slug")
      .eq("is_active", true);

    // A waiver is reachable by slug or by UUID, so pre-render whichever it has.
    return (data ?? []).flatMap((w) => {
      const ids = [w.slug, w.id].filter(Boolean) as string[];
      return ids.map((id) => ({ id }));
    });
  } catch {
    // Never let a build fail because the DB was unreachable — fall back to
    // rendering all sign pages on demand.
    return [];
  }
}

// Shared by generateMetadata and the page — cache() dedupes so we only hit the DB once per request
const getSignData = cache(async (id: string) => {
  const supabase = createPublicClient();

  // Prefer the full row (incl. newer optional columns), trying slug then UUID.
  let { data: waiver, error } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots, photo_opt_in_enabled")
    .eq("slug", id).eq("is_active", true).maybeSingle();

  if (!waiver && !error) {
    ({ data: waiver, error } = await supabase
      .from("waivers")
      .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots, photo_opt_in_enabled")
      .eq("id", id).eq("is_active", true).maybeSingle());
  }

  // If a newer optional column isn't migrated in the DB yet, the select errors —
  // fall back to the core columns so a schema mismatch can never 404 a live waiver
  // (the photo opt-in simply defaults on until the migration is run).
  if (error) {
    let core = await supabase
      .from("waivers")
      .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots")
      .eq("slug", id).eq("is_active", true).maybeSingle();
    if (!core.data) {
      core = await supabase
        .from("waivers")
        .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots")
        .eq("id", id).eq("is_active", true).maybeSingle();
    }
    waiver = core.data ? { ...core.data, photo_opt_in_enabled: true } : null;
  }

  if (!waiver) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, website")
    .eq("id", waiver.operator_id)
    .maybeSingle();

  return { waiver, profile };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getSignData(id);
  if (!data) return { title: "Waiver not found" };

  const { waiver, profile } = data;
  const biz = profile?.business_name;
  const title = biz ? `${waiver.title} — ${biz}` : waiver.title;
  const description = biz
    ? `Sign your ${biz} waiver online — it only takes a minute.`
    : "Sign your waiver online — it only takes a minute.";
  const image = waiver.cover_image_url || profile?.logo_url || null;
  // Home-screen icon: prefer the operator's logo (squarer than a cover photo)
  const icon = profile?.logo_url || waiver.cover_image_url || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(biz ? { siteName: biz } : {}),
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: waiver.cover_image_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    // Per-operator "Add to Home Screen" icon + label on iOS (overrides the global WAVR manifest)
    ...(icon ? { icons: { icon, shortcut: icon, apple: icon } } : {}),
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: biz || "Waiver",
    },
  };
}

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSignData(id);

  if (!data) notFound();

  return <WaiverWizard waiver={{ ...data.waiver, operator: data.profile }} />;
}
