import Shell from "@/components/shared/Shell";

const nav = [
  { href: "/portal", label: "My Estimates" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default function Invoices() {
  return (
    <Shell nav={nav} title="Invoices & Billing">
      <div className="card" style={{ textAlign:"center", padding:"48px 24px" }}>
        <div style={{ fontSize:40 }}>💳</div>
        <div style={{ fontWeight:800, fontSize:18, marginTop:8 }}>Online bill pay is coming soon</div>
        <p style={{ color:"#64748b", maxWidth:420, margin:"8px auto 0", fontSize:14 }}>
          Once your project is underway, invoices will appear here and you&apos;ll be able to pay securely by card.
          For now, Schmidt Construction will bill you directly.
        </p>
      </div>
    </Shell>
  );
}
