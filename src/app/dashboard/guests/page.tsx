import { createClient } from "@/lib/supabase/server";
import { Search } from "lucide-react";
import GuestTable from "@/components/GuestTable";
import ExportCsvButton from "@/components/ExportCsvButton";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("submissions")
    .select("id, guest_name, guest_email, guest_age, guest_country, created_at, signature_url, waiver:waivers(title)")
    .eq("operator_id", user!.id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("guest_name", `%${q}%`);
  }

  const { data: guests } = await query;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Guests</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">{guests?.length ?? 0} total</span>
          <ExportCsvButton />
        </div>
      </div>

      <form className="mb-6">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-arb-blue focus:border-transparent"
          />
        </div>
      </form>

      <GuestTable guests={guests ?? []} />
    </div>
  );
}
