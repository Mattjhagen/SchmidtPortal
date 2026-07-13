-- =====================================================================
-- Schmidt Portal — initial schema
-- Next.js + Supabase.  Run in Supabase SQL Editor (or `supabase db push`).
-- Roles: employee | customer.  RLS ensures customers see only their data.
-- Billing (invoices/payments) is scaffolded but DEFERRED to v2.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type user_role       as enum ('employee', 'customer', 'admin');
create type estimate_status as enum ('draft', 'sent', 'viewed', 'changes_requested', 'accepted', 'declined', 'expired');
create type invoice_status  as enum ('draft', 'open', 'paid', 'void');       -- v2
create type change_status   as enum ('open', 'addressed', 'closed');

-- =====================================================================
-- profiles — one row per auth user (employee OR customer)
-- =====================================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'customer',
  full_name   text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- customers — the client record (a customer profile links here)
-- =====================================================================
create table customers (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references profiles(id) on delete set null,  -- null until they accept invite
  company     text,
  full_name   text not null,
  email       text not null,
  phone       text,
  address     text,
  city        text,
  state       text default 'NE',
  zip         text,
  created_by  uuid references profiles(id),                     -- employee who created them
  created_at  timestamptz not null default now()
);
create index on customers (email);
create index on customers (profile_id);

-- =====================================================================
-- jobs — a project/site.  Time entries tag to a job; estimates belong to a job.
-- =====================================================================
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  name        text not null,                 -- e.g. "Burt St Retaining Wall"
  site_address text,
  status      text not null default 'active',
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index on jobs (customer_id);

-- =====================================================================
-- estimates + line items + revisions
-- =====================================================================
create table estimates (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references jobs(id) on delete set null,
  customer_id   uuid not null references customers(id) on delete cascade,
  number        text not null,               -- human number e.g. EST-2026-014
  title         text not null,
  status        estimate_status not null default 'draft',
  notes         text,
  terms         text,
  subtotal      numeric(12,2) not null default 0,
  tax_rate      numeric(5,4)  not null default 0,      -- e.g. 0.0550
  tax_amount    numeric(12,2) not null default 0,
  total         numeric(12,2) not null default 0,
  valid_until   date,
  current_revision int not null default 1,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  accepted_at   timestamptz
);
create index on estimates (customer_id);
create index on estimates (status);

create table estimate_items (
  id          uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  position    int  not null default 0,
  description text not null,
  quantity    numeric(12,2) not null default 1,
  unit        text default 'ea',
  unit_price  numeric(12,2) not null default 0,
  line_total  numeric(12,2) not null default 0,
  created_at  timestamptz not null default now()
);
create index on estimate_items (estimate_id);

-- immutable snapshot of an estimate each time it is sent/revised
create table estimate_revisions (
  id           uuid primary key default gen_random_uuid(),
  estimate_id  uuid not null references estimates(id) on delete cascade,
  revision     int not null,
  snapshot     jsonb not null,               -- full estimate + items at send time
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now(),
  unique (estimate_id, revision)
);

-- customer-requested changes (threaded)
create table change_requests (
  id           uuid primary key default gen_random_uuid(),
  estimate_id  uuid not null references estimates(id) on delete cascade,
  author_id    uuid references profiles(id),   -- customer or employee
  body         text not null,
  status       change_status not null default 'open',
  created_at   timestamptz not null default now()
);
create index on change_requests (estimate_id);

-- =====================================================================
-- time_entries — JOB-TAGGED time clock.  Hours roll up per job/estimate.
-- =====================================================================
create table time_entries (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  job_id      uuid references jobs(id) on delete set null,   -- the job being worked
  clock_in    timestamptz not null default now(),
  clock_out   timestamptz,
  break_minutes int not null default 0,
  note        text,
  -- generated worked hours (null while still clocked in)
  hours       numeric(6,2) generated always as (
                case when clock_out is null then null
                     else round((extract(epoch from (clock_out - clock_in))/3600.0
                                 - break_minutes/60.0)::numeric, 2)
                end) stored,
  created_at  timestamptz not null default now()
);
create index on time_entries (employee_id);
create index on time_entries (job_id);

-- =====================================================================
-- invoices + payments  (v2 — Stripe deferred; tables present for continuity)
-- =====================================================================
create table invoices (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  estimate_id uuid references estimates(id) on delete set null,
  number      text not null,
  status      invoice_status not null default 'draft',
  amount_due  numeric(12,2) not null default 0,
  due_date    date,
  stripe_payment_intent text,               -- v2
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);
create index on invoices (customer_id);

-- =====================================================================
-- helper: role + ownership lookups (SECURITY DEFINER avoids RLS recursion)
-- =====================================================================
create or replace function is_employee(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.id = uid and p.role in ('employee','admin'));
$$;

create or replace function owns_customer(uid uuid, cust uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from customers c where c.id = cust and c.profile_id = uid);
$$;

-- =====================================================================
-- Row-Level Security
-- =====================================================================
alter table profiles           enable row level security;
alter table customers          enable row level security;
alter table jobs               enable row level security;
alter table estimates          enable row level security;
alter table estimate_items     enable row level security;
alter table estimate_revisions enable row level security;
alter table change_requests    enable row level security;
alter table time_entries       enable row level security;
alter table invoices           enable row level security;

-- profiles: you can read/update your own; employees can read all
create policy "own profile read"   on profiles for select using (id = auth.uid() or is_employee(auth.uid()));
create policy "own profile update" on profiles for update using (id = auth.uid());
create policy "own profile insert" on profiles for insert with check (id = auth.uid());

-- customers: employees full access; a customer can read the record linked to them
create policy "emp customers all" on customers for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust read own"     on customers for select
  using (profile_id = auth.uid());

-- jobs: employees all; customers read jobs for their customer record
create policy "emp jobs all" on jobs for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust jobs read" on jobs for select
  using (owns_customer(auth.uid(), customer_id));

-- estimates: employees all; customers read their own (and only if sent)
create policy "emp estimates all" on estimates for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust estimates read" on estimates for select
  using (owns_customer(auth.uid(), customer_id) and status <> 'draft');

-- estimate_items: follow the parent estimate's visibility
create policy "emp items all" on estimate_items for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust items read" on estimate_items for select
  using (exists (select 1 from estimates e
                 where e.id = estimate_id
                   and owns_customer(auth.uid(), e.customer_id)
                   and e.status <> 'draft'));

-- revisions: read-only history, same visibility as estimate
create policy "emp rev all" on estimate_revisions for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust rev read" on estimate_revisions for select
  using (exists (select 1 from estimates e
                 where e.id = estimate_id and owns_customer(auth.uid(), e.customer_id)));

-- change_requests: employees all; customer can read + create on their estimates
create policy "emp cr all" on change_requests for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust cr read" on change_requests for select
  using (exists (select 1 from estimates e
                 where e.id = estimate_id and owns_customer(auth.uid(), e.customer_id)));
create policy "cust cr insert" on change_requests for insert
  with check (author_id = auth.uid()
              and exists (select 1 from estimates e
                          where e.id = estimate_id and owns_customer(auth.uid(), e.customer_id)));

-- time_entries: an employee sees/edits only their own; admins/employees can view all for reporting
create policy "emp own time"  on time_entries for all
  using (employee_id = auth.uid()) with check (employee_id = auth.uid());
create policy "emp view time"  on time_entries for select
  using (is_employee(auth.uid()));

-- invoices: employees all; customers read their own
create policy "emp inv all" on invoices for all
  using (is_employee(auth.uid())) with check (is_employee(auth.uid()));
create policy "cust inv read" on invoices for select
  using (owns_customer(auth.uid(), customer_id));

-- =====================================================================
-- Auto-create a profile row when a new auth user signs up.
-- Role is read from user metadata ('role'); defaults to 'customer'.
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;

  -- link customer record if one was pre-created with this email
  update public.customers
     set profile_id = new.id
   where lower(email) = lower(new.email) and profile_id is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
