import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, ExternalLink, Users, Pencil } from "lucide-react";
import DeleteWaiverButton from "@/components/DeleteWaiverButton";

export default async function WaiversPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: waivers } = await supabase
    .from("waivers")
    .select("id, title, created_at, is_active, slug")
    .eq("operator_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Waivers</h1>
        <Link
          href="/dashboard/waivers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-arb-blue hover:bg-arb-blue-light text-white text-sm font-semibold transition"
        >
          <Plus size={16} />
          New waiver
        </Link>
      </div>

      {waivers && waivers.length > 0 ? (
        <div className="space-y-3">
          {waivers.map((w) => (
            <div
              key={w.id}
              className="bg-zinc-800 rounded-xl border border-zinc-700 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{w.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Created {new Date(w.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/dashboard/waivers/${w.id}/edit`}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                >
                  <Pencil size={14} />
                  Edit
                </Link>
                <Link
                  href={`/dashboard/guests?waiver=${w.id}`}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
                >
                  <Users size={14} />
                  Guests
                </Link>
                <Link
                  href={`/sign/${w.slug ?? w.id}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs text-arb-blue-light hover:text-arb-teal transition"
                >
                  <ExternalLink size={14} />
                  Sign link
                </Link>
                <DeleteWaiverButton waiverId={w.id} waiverTitle={w.title} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-12 text-center">
          <p className="text-zinc-400 text-sm mb-4">No waivers yet.</p>
          <Link
            href="/dashboard/waivers/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-arb-blue hover:bg-arb-blue-light text-white text-sm font-semibold transition"
          >
            <Plus size={16} />
            Create your first waiver
          </Link>
        </div>
      )}
    </div>
  );
}
