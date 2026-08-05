import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mirror the filters shown on the guests dashboard so the CSV matches the screen
  const sp = new URL(request.url).searchParams;
  const q = sp.get("q");
  const date = sp.get("date");
  const time = sp.get("time");
  const waiverId = sp.get("waiver");
  const medical = sp.get("medical");
  const age = sp.get("age");
  const photos = sp.get("photos");

  let query = supabase
    .from("submissions")
    .select("guest_name, guest_email, guest_age, guest_country, created_at, trip_date, trip_time, has_medical, photo_opt_in, waiver:waivers(title)")
    .eq("operator_id", user.id)
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("guest_name", `%${q}%`);
  if (date) query = query.eq("trip_date", date);
  if (time) query = query.eq("trip_time", time);
  if (waiverId) query = query.eq("waiver_id", waiverId);
  if (medical === "yes") query = query.eq("has_medical", true);
  if (medical === "no") query = query.or("has_medical.eq.false,has_medical.is.null");
  if (age === "u18") query = query.lt("guest_age", 18);
  if (age === "18plus") query = query.gte("guest_age", 18);
  if (photos === "yes") query = query.eq("photo_opt_in", true);
  if (photos === "no") query = query.or("photo_opt_in.eq.false,photo_opt_in.is.null");

  const { data: guests, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [
    ["Name", "Email", "Age", "Country", "Waiver", "Trip Date", "Trip Time", "Wants Photos", "Date Signed"],
    ...(guests ?? []).map((g) => {
      const waiverTitle = Array.isArray(g.waiver)
        ? g.waiver[0]?.title ?? ""
        : (g.waiver as { title: string } | null)?.title ?? "";
      return [
        g.guest_name ?? "",
        g.guest_email ?? "",
        g.guest_age ?? "",
        g.guest_country ?? "",
        waiverTitle,
        g.trip_date ?? "",
        g.trip_time ?? "",
        g.photo_opt_in ? "Yes" : "No",
        new Date(g.created_at).toLocaleDateString("en-GB"),
      ];
    }),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="wavr-guests-${today}.csv"`,
    },
  });
}
