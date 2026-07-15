import Shell from "@/components/shared/Shell";
import { createClient } from "@/lib/supabase/server";
import CustomerForm from "@/components/employee/CustomerForm";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeclock", label: "Time Clock" },
  { href: "/estimates", label: "Estimates" },
  { href: "/customers", label: "Customers" },
];

export default async function Customers() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers")
    .select("*").order("created_at", { ascending: false });
  return (
    <Shell nav={nav} title="Customers">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:16 }}>
        <div className="card"><CustomerForm /></div>
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", fontSize:14, borderCollapse:"collapse" }}>
            <thead><tr style={{ textAlign:"left", background:"#f8fafc", color:"#64748b" }}>
              <th style={{ padding:"12px 14px" }}>Name</th><th>Email</th><th>Account</th></tr></thead>
            <tbody>
              {(customers ?? []).map((c:any)=>(
                <tr key={c.id} style={{ borderTop:"1px solid #e2e8f0" }}>
                  <td style={{ padding:"12px 14px" }}>{c.company || c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{c.profile_id
                    ? <span className="badge" style={{background:"#dcfce7", color:"#166534"}}>Active</span>
                    : <span className="badge" style={{background:"#fef3c7", color:"#92400e"}}>Invited</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
