import { createClient, getCurrentUser } from "@/lib/supabase/server";
import GuestTable from "@/components/GuestTable";
import ExportCsvButton from "@/components/ExportCsvButton";
import GuestFilterBar from "@/components/GuestFilterBar";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string; time?: string; medical?: string; age?: string; waiver?: string; photos?: string }>;
}) {
  const { q, date, time, medical, age, waiver, photos } = await searchParams;
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  let query = supabase
    .from("submissions")
    .select("id, guest_name, guest_email, guest_age, guest_country, created_at, signature_url, form_data, trip_date, trip_time, has_medical, photo_opt_in, waiver:waivers(title)")
    .eq("operator_id", user!.id)
    .order("trip_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("guest_name", `%${q}%`);
  if (date) query = query.eq("trip_date", date);
  if (time) query = query.eq("trip_time", time);
  if (waiver) query = query.eq("waiver_id", waiver);
  if (medical === "yes") query = query.eq("has_medical", true);
  if (medical === "no") query = query.or("has_medical.eq.false,has_medical.is.null");
  if (age === "u18") query = query.lt("guest_age", 18);
  if (age === "18plus") query = query.gte("guest_age", 18);
  if (photos === "yes") query = query.eq("photo_opt_in", true);
  if (photos === "no") query = query.or("photo_opt_in.eq.false,photo_opt_in.is.null");

  // Distinct time slots for the time dropdown (scoped to the selected day if one is set)
  let timeQuery = supabase
    .from("submissions")
    .select("trip_time")
    .eq("operator_id", user!.id)
    .not("trip_time", "is", null);
  if (date) timeQuery = timeQuery.eq("trip_date", date);

  // The operator's waivers, for the waiver dropdown (+ whether any offers photos)
  const waiverQuery = supabase
    .from("waivers")
    .select("id, title, photo_opt_in_enabled")
    .eq("operator_id", user!.id)
    .order("title");

  const [{ data: guests }, { data: timeRows }, { data: waiverRows }] = await Promise.all([query, timeQuery, waiverQuery]);
  const timeOptions = [...new Set((timeRows ?? []).map((r) => r.trip_time as string).filter(Boolean))].sort();
  const waiverOptions = (waiverRows ?? []).map((w) => ({ id: w.id as string, title: w.title as string }));
  // Only surface the photo filter to operators who actually offer photos on a waiver
  const offersPhotos = (waiverRows ?? []).some((w) => w.photo_opt_in_enabled === true);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Guests</h1>
        <ExportCsvButton />
      </div>

      <GuestFilterBar totalCount={guests?.length ?? 0} timeOptions={timeOptions} waiverOptions={waiverOptions} offersPhotos={offersPhotos} />
      <GuestTable guests={guests ?? []} />
    </div>
  );
}
