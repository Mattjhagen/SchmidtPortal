export type Role = "employee" | "customer" | "admin";
export type EstimateStatus =
  | "draft" | "sent" | "viewed" | "changes_requested"
  | "accepted" | "declined" | "expired";

export interface Profile { id: string; role: Role; full_name: string | null; email: string | null; phone: string | null; }
export interface Customer {
  id: string; profile_id: string | null; company: string | null; full_name: string;
  email: string; phone: string | null; address: string | null; city: string | null;
  state: string | null; zip: string | null; created_at: string;
}
export interface Job { id: string; customer_id: string; name: string; site_address: string | null; status: string; }
export interface EstimateItem {
  id: string; estimate_id: string; position: number; description: string;
  quantity: number; unit: string; unit_price: number; line_total: number;
}
export interface Estimate {
  id: string; job_id: string | null; customer_id: string; number: string; title: string;
  status: EstimateStatus; notes: string | null; terms: string | null;
  subtotal: number; tax_rate: number; tax_amount: number; total: number;
  valid_until: string | null; current_revision: number; sent_at: string | null; created_at: string;
}
export interface TimeEntry {
  id: string; employee_id: string; job_id: string | null;
  clock_in: string; clock_out: string | null; break_minutes: number;
  note: string | null; hours: number | null;
}
export interface ChangeRequest { id: string; estimate_id: string; author_id: string | null; body: string; status: string; created_at: string; }
