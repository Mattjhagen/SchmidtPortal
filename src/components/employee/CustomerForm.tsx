"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CustomerForm() {
  const router = useRouter();
  const [f, setF] = useState({ full_name: "", company: "", email: "", phone: "", address: "", city: "", zip: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("customers").insert({ ...f, created_by: user?.id });
    setBusy(false);
    if (error) setErr(error.message);
    else { setF({ full_name: "", company: "", email: "", phone: "", address: "", city: "", zip: "" }); router.refresh(); }
  }

  return (
    <form onSubmit={save}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Add Customer</div>
      <input className="input" placeholder="Full name *" required value={f.full_name} onChange={set("full_name")} style={{ marginBottom: 8 }} />
      <input className="input" placeholder="Company" value={f.company} onChange={set("company")} style={{ marginBottom: 8 }} />
      <input className="input" type="email" placeholder="Email *" required value={f.email} onChange={set("email")} style={{ marginBottom: 8 }} />
      <input className="input" placeholder="Phone" value={f.phone} onChange={set("phone")} style={{ marginBottom: 8 }} />
      <input className="input" placeholder="Address" value={f.address} onChange={set("address")} style={{ marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input className="input" placeholder="City" value={f.city} onChange={set("city")} />
        <input className="input" placeholder="ZIP" value={f.zip} onChange={set("zip")} style={{ width: 110 }} />
      </div>
      {err && <p style={{ color: "#dc2626", fontSize: 13 }}>{err}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Add Customer"}</button>
    </form>
  );
}
