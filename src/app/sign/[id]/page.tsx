import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import WaiverForm from "@/components/WaiverForm";

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

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">{waiver.title}</h1>
          <p className="text-zinc-500 text-sm mt-1">Please read and sign below</p>
        </div>
        <WaiverForm waiver={waiver} />
      </div>
    </div>
  );
}
