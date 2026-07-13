import Shell from "@/components/shared/Shell";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/utils";
import CustomerEstimateActions from "@/components/customer/CustomerEstimateActions";

const nav = [
  { href: "/portal", label: "My Estimates" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function CustEstimate({ params }: { params: Promise<{ id:string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: est } = await supabase.from("estimates")
    .select("*, items:estimate_items(*), changes:change_requests(*)")
    .eq("id", id).single();
  if (!est) return <Shell nav={nav} title="Estimate"><p>Not found.</p></Shell>;
  const items = (est.items ?? []).sort((a:any,b:any)=>a.position-b.position);
  const changes = (est.changes ?? []).sort((a:any,b:any)=> a.created_at < b.created_at ? -1 : 1);

  return (
    <Shell nav={nav} title={est.title}>
      <div style={{ maxWidth:760 }}>
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:13, color:"#64748b" }}>{est.number}</div>
            <span className="badge" style={{ background:"#f1f5f9", color:"#475569" }}>{est.status.replace("_"," ").toUpperCase()}</span>
          </div>
          <table style={{ width:"100%", fontSize:14, borderCollapse:"collapse" }}>
            <thead><tr style={{ textAlign:"left", color:"#64748b" }}>
              <th style={{ padding:"6px 4px" }}>Description</th><th>Qty</th><th style={{textAlign:"right"}}>Total</th></tr></thead>
            <tbody>
              {items.map((it:any)=>(
                <tr key={it.id} style={{ borderTop:"1px solid #e2e8f0" }}>
                  <td style={{ padding:"8px 4px" }}>{it.description}</td>
                  <td>{it.quantity} {it.unit}</td>
                  <td style={{ textAlign:"right" }}>{money(Number(it.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:14, marginLeft:"auto", width:240 }}>
            <Row label="Subtotal" value={money(Number(est.subtotal))} />
            <Row label="Tax" value={money(Number(est.tax_amount))} />
            <div style={{ borderTop:"2px solid #1e293b", marginTop:6, paddingTop:6 }}>
              <Row label="Total" value={money(Number(est.total))} bold />
            </div>
          </div>
          {est.notes && <p style={{ fontSize:14, marginTop:14 }}>{est.notes}</p>}
          {est.terms && <p style={{ fontSize:13, color:"#64748b" }}>{est.terms}</p>}
        </div>

        <CustomerEstimateActions estimateId={est.id} status={est.status} changes={changes as any} />
      </div>
    </Shell>
  );
}

function Row({ label, value, bold }: { label:string; value:string; bold?:boolean }) {
  return <div style={{ display:"flex", justifyContent:"space-between", fontWeight: bold?800:400, fontSize: bold?18:14, margin:"4px 0" }}><span>{label}</span><span>{value}</span></div>;
}
