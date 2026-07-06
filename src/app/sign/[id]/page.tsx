import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverWizard from "@/components/WaiverWizard";

export const runtime = 'edge';

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (!waiver) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, website")
    .eq("id", waiver.operator_id)
    .maybeSingle();

  return <WaiverWizard waiver={{ ...waiver, operator: profile }} />;
}
