import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverBuilder from "@/components/WaiverBuilder";

export default async function EditWaiverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: waiver } = await supabase
    .from("waivers")
    .select("id, title, body_text, fields")
    .eq("id", id)
    .eq("operator_id", user!.id)
    .single();

  if (!waiver) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Edit waiver</h1>
      <WaiverBuilder initial={waiver} />
    </div>
  );
}
