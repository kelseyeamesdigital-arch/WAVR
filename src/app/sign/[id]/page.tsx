import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverWizard from "@/components/WaiverWizard";

export default async function SignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: waiver } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields, operator_id")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!waiver) notFound();

  return <WaiverWizard waiver={waiver} />;
}
