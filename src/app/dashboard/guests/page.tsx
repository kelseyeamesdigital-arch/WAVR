import { createClient } from "@/lib/supabase/server";
import GuestTable from "@/components/GuestTable";
import ExportCsvButton from "@/components/ExportCsvButton";
import GuestFilterBar from "@/components/GuestFilterBar";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q, date } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("submissions")
    .select("id, guest_name, guest_email, guest_age, guest_country, created_at, signature_url, form_data, trip_date, trip_time, waiver:waivers(title, fields)")
    .eq("operator_id", user!.id)
    .order("trip_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("guest_name", `%${q}%`);
  if (date) query = query.eq("trip_date", date);

  const { data: guests } = await query;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Guests</h1>
        <ExportCsvButton />
      </div>

      <GuestFilterBar totalCount={guests?.length ?? 0} />
      <GuestTable guests={guests ?? []} />
    </div>
  );
}
