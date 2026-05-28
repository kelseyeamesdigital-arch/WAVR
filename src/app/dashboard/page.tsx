import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Users, PenLine, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ count: waiverCount }, { count: guestCount }] = await Promise.all([
    supabase.from("waivers").select("*", { count: "exact", head: true }).eq("operator_id", user!.id),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("operator_id", user!.id),
  ]);

  const { data: recentGuests } = await supabase
    .from("submissions")
    .select("id, guest_name, created_at, form_data, waiver:waivers(title)")
    .eq("operator_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={18} className="text-arb-blue-light" />
            <span className="text-sm text-zinc-400">Waivers</span>
          </div>
          <p className="text-3xl font-bold text-white">{waiverCount ?? 0}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3 mb-2">
            <Users size={18} className="text-arb-blue-light" />
            <span className="text-sm text-zinc-400">Total guests</span>
          </div>
          <p className="text-3xl font-bold text-white">{guestCount ?? 0}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recent sign-ins</h2>
        <Link href="/dashboard/guests" className="text-sm text-arb-blue-light hover:text-arb-teal">
          View all
        </Link>
      </div>

      {recentGuests && recentGuests.length > 0 ? (
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 divide-y divide-zinc-700 overflow-hidden">
          {recentGuests.map((g) => (
            <div key={g.id} className="flex items-start justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{g.guest_name}</p>
                  {Object.values((g.form_data as Record<string,string>) ?? {}).includes("Yes") && (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      <AlertTriangle size={10} />
                      Medical
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                  {Array.isArray(g.waiver) ? g.waiver[0]?.title : (g.waiver as { title: string } | null)?.title ?? "—"}
                </p>
              </div>
              <span className="text-xs text-zinc-500 shrink-0">
                {new Date(g.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-10 text-center">
          <PenLine size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No sign-ins yet.</p>
          <Link
            href="/dashboard/waivers/new"
            className="mt-3 inline-block text-sm text-arb-blue-light hover:text-arb-teal"
          >
            Create your first waiver →
          </Link>
        </div>
      )}
    </div>
  );
}
