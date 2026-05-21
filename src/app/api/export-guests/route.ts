import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: guests, error } = await supabase
    .from("submissions")
    .select("guest_name, guest_email, guest_age, guest_country, created_at, waiver:waivers(title)")
    .eq("operator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [
    ["Name", "Email", "Age", "Country", "Waiver", "Date Signed"],
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
