"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ItemInput { description: string; quantity: number; unit: string; unit_price: number; }

export async function createEstimate(input: {
  customer_id: string; job_id: string | null; title: string;
  notes: string; terms: string; tax_rate: number; valid_until: string | null;
  items: ItemInput[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const subtotal = input.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const tax_amount = +(subtotal * input.tax_rate).toFixed(2);
  const total = +(subtotal + tax_amount).toFixed(2);

  // simple per-year sequence
  const year = new Date().getFullYear();
  const { count } = await supabase.from("estimates")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`);
  const number = `EST-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const { data: est, error } = await supabase.from("estimates").insert({
    customer_id: input.customer_id, job_id: input.job_id, number,
    title: input.title, notes: input.notes, terms: input.terms,
    subtotal, tax_rate: input.tax_rate, tax_amount, total,
    valid_until: input.valid_until, status: "draft", created_by: user.id,
  }).select("id").single();
  if (error || !est) return { error: error?.message ?? "Insert failed" };

  const rows = input.items.map((it, i) => ({
    estimate_id: est.id, position: i, description: it.description,
    quantity: it.quantity, unit: it.unit, unit_price: it.unit_price,
    line_total: +(it.quantity * it.unit_price).toFixed(2),
  }));
  if (rows.length) await supabase.from("estimate_items").insert(rows);

  revalidatePath("/estimates");
  return { ok: true, id: est.id };
}

export async function respondToChangeRequest(estimateId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { error } = await supabase.from("change_requests")
    .insert({ estimate_id: estimateId, author_id: user.id, body });
  if (error) return { error: error.message };
  revalidatePath(`/estimates/${estimateId}`);
  return { ok: true };
}

// Customer-side: request a change on an estimate
export async function requestChange(estimateId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { error } = await supabase.from("change_requests")
    .insert({ estimate_id: estimateId, author_id: user.id, body });
  if (error) return { error: error.message };
  await supabase.from("estimates").update({ status: "changes_requested" }).eq("id", estimateId);
  revalidatePath(`/portal/estimates/${estimateId}`);
  return { ok: true };
}

export async function setEstimateStatus(estimateId: string, status: string) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  const { error } = await supabase.from("estimates").update(patch).eq("id", estimateId);
  if (error) return { error: error.message };
  revalidatePath(`/portal/estimates/${estimateId}`);
  return { ok: true };
}
