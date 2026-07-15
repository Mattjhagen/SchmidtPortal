import Shell from "@/components/shared/Shell";
import { createClient } from "@/lib/supabase/server";
import EstimateBuilder from "@/components/employee/EstimateBuilder";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeclock", label: "Time Clock" },
  { href: "/estimates", label: "Estimates" },
  { href: "/customers", label: "Customers" },
];

export default async function NewEstimate() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers")
    .select("id,full_name,company").order("full_name");
  const { data: jobs } = await supabase.from("jobs").select("id,name,customer_id");
  return (
    <Shell nav={nav} title="New Estimate">
      <EstimateBuilder customers={(customers ?? []) as any} jobs={(jobs ?? []) as any} />
    </Shell>
  );
}
