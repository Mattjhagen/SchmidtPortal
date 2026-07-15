import Shell from "@/components/shared/Shell";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/utils";
import SendEstimateButton from "@/components/employee/SendEstimateButton";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeclock", label: "Time Clock" },
  { href: "/estimates", label: "Estimates" },
  { href: "/customers", label: "Customers" },
];

export default async function EstimateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: est } = await supabase.from("estimates")
    .select("*, customer:customers(*), items:estimate_items(*), changes:change_requests(*)")
    .eq("id", id).single();

  if (!est) return <Shell nav={nav} title="Estimate"><p>Not found.</p></Shell>;
  const items = (est.items ?? []).sort((a:any,b:any)=>a.position-b.position);
  const changes = (est.changes ?? []).sort((a:any,b:any)=> a.created_at < b.created_at ? -1 : 1);

  return (
    <Shell nav={nav} title={`${est.number} — ${est.title}`}>
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        <span className="badge" style={{ background:"#f1f5f9", color:"#475569" }}>{est.status.replace("_"," ").toUpperCase()}</span>
        <SendEstimateButton estimateId={est.id} disabled={est.status !== "draft" && est.status !== "changes_requested"} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <div className="card">
          <div style={{ fontWeight:700, marginBottom:10 }}>Line Items</div>
          <table style={{ width:"100%", fontSize:14, borderCollapse:"collapse" }}>
            <thead><tr style={{ textAlign:"left", color:"#64748b" }}>
              <th style={{ padding:"6px 4px" }}>Description</th><th>Qty</th><th>Unit $</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
            <tbody>
              {items.map((it:any)=>(
                <tr key={it.id} style={{ borderTop:"1px solid #e2e8f0" }}>
                  <td style={{ padding:"8px 4px" }}>{it.description}</td>
                  <td>{it.quantity} {it.unit}</td><td>{money(Number(it.unit_price))}</td>
                  <td style={{ textAlign:"right" }}>{money(Number(it.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:14, marginLeft:"auto", width:240 }}>
            <Row label="Subtotal" value={money(Number(est.subtotal))} />
            <Row label={`Tax (${(est.tax_rate*100).toFixed(2)}%)`} value={money(Number(est.tax_amount))} />
            <div style={{ borderTop:"2px solid #1e293b", marginTop:6, paddingTop:6 }}>
              <Row label="Total" value={money(Number(est.total))} bold />
            </div>
          </div>
          {est.notes && <><div style={{fontWeight:700, marginTop:16}}>Notes</div><p style={{fontSize:14}}>{est.notes}</p></>}
          {est.terms && <><div style={{fontWeight:700, marginTop:10}}>Terms</div><p style={{fontSize:13, color:"#64748b"}}>{est.terms}</p></>}
        </div>

        <div className="card">
          <div style={{ fontWeight:700, marginBottom:10 }}>Customer</div>
          <div style={{ fontSize:14 }}>{est.customer.company || est.customer.full_name}</div>
          <div style={{ fontSize:13, color:"#64748b" }}>{est.customer.email}</div>
          <div style={{ fontSize:13, color:"#64748b" }}>{est.customer.phone}</div>

          <div style={{ fontWeight:700, margin:"18px 0 8px" }}>Change Requests</div>
          {changes.length === 0 && <p style={{ fontSize:13, color:"#94a3b8" }}>None yet.</p>}
          {changes.map((c:any)=>(
            <div key={c.id} style={{ borderLeft:"3px solid #f59e0b", padding:"6px 10px", marginBottom:8, background:"#fffbeb" }}>
              <div style={{ fontSize:13 }}>{c.body}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>{new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value, bold }: { label:string; value:string; bold?:boolean }) {
  return <div style={{ display:"flex", justifyContent:"space-between", fontWeight: bold?800:400, fontSize: bold?18:14, margin:"4px 0" }}><span>{label}</span><span>{value}</span></div>;
}
