"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function clockIn(jobId: string | null, note: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // guard: no open punch already
  const { data: open } = await supabase.from("time_entries")
    .select("id").eq("employee_id", user.id).is("clock_out", null).maybeSingle();
  if (open) return { error: "You're already clocked in." };

  const { error } = await supabase.from("time_entries").insert({
    employee_id: user.id, job_id: jobId, note: note || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/timeclock");
  return { ok: true };
}

export async function clockOut(entryId: string, breakMinutes: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries")
    .update({ clock_out: new Date().toISOString(), break_minutes: breakMinutes || 0 })
    .eq("id", entryId);
  if (error) return { error: error.message };
  revalidatePath("/timeclock");
  return { ok: true };
}
