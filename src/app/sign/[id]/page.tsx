import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverWizard from "@/components/WaiverWizard";

export const runtime = 'edge';
export const revalidate = 60;

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Single query — matches slug or UUID in one round trip
  const { data: waiver } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields, operator_id, cover_image_url, trip_time_slots")
    .or(`slug.eq.${id},id.eq.${id}`)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!waiver) notFound();

  return <WaiverWizard waiver={waiver} />;
}
