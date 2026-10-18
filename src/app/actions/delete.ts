"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteWaiver(waiverId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Delete submissions first (foreign key), then the waiver
  await supabase.from("submissions").delete().eq("waiver_id", waiverId).eq("operator_id", user.id);
  const { error } = await supabase
    .from("waivers")
    .delete()
    .eq("id", waiverId)
    .eq("operator_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/waivers");
}

/** Correct which trip a guest is allocated to (they picked the wrong date/time when signing). */
export async function updateGuestTrip(
  submissionId: string,
  tripDate: string | null,
  tripTime: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (tripDate && !/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    throw new Error("Invalid date");
  }

  const { error } = await supabase
    .from("submissions")
    .update({ trip_date: tripDate || null, trip_time: tripTime || null })
    .eq("id", submissionId)
    .eq("operator_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/guests");
}

export async function deleteGuest(submissionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("submissions")
    .delete()
    .eq("id", submissionId)
    .eq("operator_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/guests");
}
