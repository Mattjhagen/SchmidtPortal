import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST { estimateId } — employee action.
// 1) snapshot current revision  2) mark 'sent'
// 3) invite the customer by email via Supabase Auth (magic link) so a click
//    on the email lets them create an account and land on the estimate.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // employee check
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!me || !["employee", "admin"].includes(me.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { estimateId } = await req.json();

  const { data: est } = await supabase.from("estimates")
    .select("*, customer:customers(*), items:estimate_items(*)")
    .eq("id", estimateId).single();
  if (!est) return NextResponse.json({ error: "Estimate not found" }, { status: 404 });

  // 1) snapshot revision
  await supabase.from("estimate_revisions").insert({
    estimate_id: est.id, revision: est.current_revision,
    snapshot: est, created_by: user.id,
  });

  // 2) mark sent
  await supabase.from("estimates")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", est.id);

  // 3) invite customer via magic link (admin/service-role)
  const admin = createAdminClient();
  const email = est.customer.email as string;
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/callback?next=/portal/estimates/${est.id}`;

  // generateLink creates the user if needed and returns an invite/magic link.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo, data: { role: "customer", full_name: est.customer.full_name } },
  });
  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });

  // TODO(email): send `link.properties.action_link` via your provider (Resend/SendGrid).
  // In dev, Supabase can email this automatically if SMTP is configured, or you can
  // copy the actionLink from the response to test the customer flow.
  const actionLink = link?.properties?.action_link;

  return NextResponse.json({ ok: true, actionLink });
}
