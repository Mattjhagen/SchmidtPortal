"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEstimate } from "@/lib/actions/estimates";
import { money } from "@/lib/utils";

type Customer = { id: string; full_name: string; company: string | null };
type Job = { id: string; name: string; customer_id: string };
type Item = { description: string; quantity: number; unit: string; unit_price: number };

export default function EstimateBuilder({ customers, jobs }: { customers: Customer[]; jobs: Job[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [jobId, setJobId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("50% deposit due on acceptance. Balance due on completion. Estimate valid 30 days.");
  const [taxRate, setTaxRate] = useState(0.055);
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unit: "ea", unit_price: 0 }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const jobsForCustomer = jobs.filter(j => j.customer_id === customerId);

  function updateItem(i: number, patch: Partial<Item>) {
    setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }

  async function save() {
    setBusy(true); setErr(null);
    const res = await createEstimate({
      customer_id: customerId, job_id: jobId || null, title, notes, terms,
      tax_rate: taxRate, valid_until: validUntil || null,
      items: items.filter(it => it.description.trim()),
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else router.push(`/estimates/${res.id}`);
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Customer</label>
            <select className="input" value={customerId} onChange={e => { setCustomerId(e.target.value); setJobId(""); }} style={{ marginTop: 6 }}>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Job (optional)</label>
            <select className="input" value={jobId} onChange={e => setJobId(e.target.value)} style={{ marginTop: 6 }}>
              <option value="">— None —</option>
              {jobsForCustomer.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
        </div>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 12 }}>Title</label>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Backyard Retaining Wall — 120 lin. ft." style={{ marginTop: 6 }} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Line Items</div>
        {items.map((it, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1.2fr auto", gap: 8, marginBottom: 8 }}>
            <input className="input" placeholder="Description" value={it.description} onChange={e => updateItem(i, { description: e.target.value })} />
            <input className="input" type="number" placeholder="Qty" value={it.quantity} onChange={e => updateItem(i, { quantity: +e.target.value })} />
            <input className="input" placeholder="Unit" value={it.unit} onChange={e => updateItem(i, { unit: e.target.value })} />
            <input className="input" type="number" placeholder="Unit $" value={it.unit_price} onChange={e => updateItem(i, { unit_price: +e.target.value })} />
            <button className="btn btn-ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={() => setItems([...items, { description: "", quantity: 1, unit: "ea", unit_price: 0 }])}>+ Add line</button>

        <div style={{ marginTop: 16, marginLeft: "auto", width: 260 }}>
          <Row label="Subtotal" value={money(subtotal)} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0" }}>
            <span style={{ fontSize: 13 }}>Tax rate</span>
            <input className="input" type="number" step="0.001" value={taxRate}
              onChange={e => setTaxRate(+e.target.value)} style={{ width: 90 }} />
          </div>
          <Row label="Tax" value={money(tax)} />
          <div style={{ borderTop: "2px solid #1e293b", marginTop: 6, paddingTop: 6 }}>
            <Row label="Total" value={money(total)} bold />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Notes (visible to customer)</label>
        <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ marginTop: 6 }} />
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 12 }}>Terms</label>
        <textarea className="input" rows={2} value={terms} onChange={e => setTerms(e.target.value)} style={{ marginTop: 6 }} />
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 12 }}>Valid until</label>
        <input className="input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ marginTop: 6, width: 200 }} />
      </div>

      {err && <p style={{ color: "#dc2626", fontSize: 14 }}>{err}</p>}
      <button className="btn btn-primary" disabled={busy || !title || !customerId} onClick={save}>
        {busy ? "Saving…" : "Save Draft"}
      </button>
      <p style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
        Save the draft, then open it to review and <b>email it to the customer</b>.
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 800 : 400, fontSize: bold ? 18 : 14, margin: "4px 0" }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
