import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverWizard from "@/components/WaiverWizard";

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Try slug first, fall back to UUID
  let { data: waiver } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields, operator_id, cover_image_url")
    .eq("slug", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!waiver) {
    ({ data: waiver } = await supabase
      .from("waivers")
      .select("id, title, body_text, fields, operator_id, cover_image_url")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle());
  }

  if (!waiver) notFound();

  return <WaiverWizard waiver={waiver} />;
}
