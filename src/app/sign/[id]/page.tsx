import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import WaiverWizard from "@/components/WaiverWizard";

export const runtime = 'edge';

// Shared by generateMetadata and the page — cache() dedupes so we only hit the DB once per request
const getSignData = cache(async (id: string) => {
  const supabase = await createClient();

  // Try slug first, fall back to UUID
  let { data: waiver } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots")
    .eq("slug", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!waiver) {
    ({ data: waiver } = await supabase
      .from("waivers")
      .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle());
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
