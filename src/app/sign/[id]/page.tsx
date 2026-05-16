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
    <div className="min-h-screen bg-white py-8 px-4">
      {/* ARB Header */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-arb-blue flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm" style={{ fontFamily: "Oswald, sans-serif" }}>ARB</span>
          </div>
          <div>
            <p className="font-bold text-arb-green leading-tight" style={{ fontFamily: "Oswald, sans-serif", letterSpacing: "0.05em" }}>ADVENTURE RAFTING BLED</p>
            <p className="text-xs text-arb-teal tracking-widest">adventure-rafting.com</p>
          </div>
        </div>
        <div className="border-b-2 border-arb-teal pb-4">
          <h1 className="text-2xl font-bold text-arb-green" style={{ fontFamily: "Oswald, sans-serif" }}>{waiver.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Please read carefully and sign below</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto">
        <WaiverForm waiver={waiver} />
      </div>
    </div>
  );
}
