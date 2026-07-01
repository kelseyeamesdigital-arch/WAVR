import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverWizard from "@/components/WaiverWizard";

export const runtime = 'edge';

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const { data: waiver } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots, operator:profiles(business_name, logo_url, website)")
    .eq(isUuid ? "id" : "slug", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!waiver) notFound();

  return <WaiverWizard waiver={waiver} />;
}
