import Shell from "@/components/shared/Shell";
import { createClient } from "@/lib/supabase/server";
import TimeClockWidget from "@/components/employee/TimeClockWidget";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/timeclock", label: "Time Clock" },
  { href: "/estimates", label: "Estimates" },
  { href: "/customers", label: "Customers" },
];

export default async function TimeClock() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: jobs } = await supabase.from("jobs")
    .select("id,name,customer:customers(full_name)").eq("status","active").order("created_at",{ascending:false});
  const { data: open } = await supabase.from("time_entries")
    .select("*").eq("employee_id", user!.id).is("clock_out", null).maybeSingle();
  const { data: recent } = await supabase.from("time_entries")
    .select("*, job:jobs(name)").eq("employee_id", user!.id)
    .order("clock_in", { ascending: false }).limit(10);

  return (
    <Shell nav={nav} title="Time Clock">
      <TimeClockWidget
        jobs={(jobs ?? []) as any}
        openEntry={open as any}
        recent={(recent ?? []) as any}
      />
    </Shell>
  );
}
