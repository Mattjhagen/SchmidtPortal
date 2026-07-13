import Link from "next/link";
import Shell from "@/components/shared/Shell";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/utils";

const nav = [
  { href: "/portal", label: "My Estimates" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function CustomerHome() {
  const supabase = await createClient();
  // RLS ensures only this customer's estimates come back
  const { data: ests } = await supabase.from("estimates")
    .select("*").order("created_at", { ascending: false });

  return (
    <Shell nav={nav} title="My Estimates">
      {(ests ?? []).length === 0 && (
        <div className="card"><p style={{ color:"#64748b" }}>No estimates to review yet. When Schmidt Construction sends you one, it&apos;ll appear here.</p></div>
      )}
      <div style={{ display:"grid", gap:12 }}>
        {(ests ?? []).map((e:any)=>(
          <Link key={e.id} href={`/portal/estimates/${e.id}`} className="card" style={{ textDecoration:"none", color:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700 }}>{e.title}</div>
              <div style={{ fontSize:13, color:"#64748b" }}>{e.number} · {e.status.replace("_"," ")}</div>
            </div>
            <div style={{ fontSize:20, fontWeight:800 }}>{money(Number(e.total))}</div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
