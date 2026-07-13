# Schmidt Construction — Portal

Employee & customer portal for Schmidt Construction (Omaha retaining walls).
Built on the same stack as vibeCodesSpace: **Next.js 15 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + RLS)**.

## What it does

### Employee portal
- **Time Clock** — job-tagged clock in/out. Hours roll up per job/estimate.
- **Estimate builder** — line items, tax, terms, totals; saved as drafts.
- **Email to Customer** — sends a magic-link invite so the customer can create an account and land directly on their estimate.
- **Customers** — add customers; see who has activated their account.
- **Dashboard** — pipeline / secured / out-for-review / drafts metrics.

### Customer portal
- Click the emailed link → **create an account** (magic link, no password).
- **Review estimates**, **Accept / Decline**, and **Request Changes** (threaded).
- **Invoices** — billing screen stubbed ("coming soon"); Stripe is deferred to v2.

## Security
Row-Level Security (RLS) enforces that a customer can only ever read **their own**
estimates, items, revisions, change requests, and invoices. Employees have full access.
See `supabase/migrations/20260713000000_init.sql`.

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com, then copy your keys into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Run the migration** — paste `supabase/migrations/20260713000000_init.sql`
   into the Supabase SQL Editor and run it (creates tables, RLS, and the
   new-user trigger).

4. **Configure Auth redirect** — in Supabase → Authentication → URL Configuration,
   add `http://localhost:3000/callback` (and your production URL) to the allowed
   redirect list.

5. **Create your employee account**
   - Run `npm run dev`, visit `/login`, sign in with your email (magic link).
   - In Supabase → Table editor → `profiles`, set your row's `role` to `employee`.
   - Re-load — you'll now land on the employee dashboard.

6. **Email delivery** — magic-link invites use Supabase Auth email. For production
   volume, configure custom SMTP in Supabase (or wire Resend/SendGrid in
   `src/app/api/estimates/send/route.ts` where the `TODO(email)` note is).

## The customer flow (end to end)
1. Employee adds a customer → builds an estimate → clicks **Email to Customer**.
2. `api/estimates/send` snapshots a revision, marks the estimate **sent**, and
   generates a magic link for the customer's email.
3. Customer clicks the link → account is auto-created and linked to their
   customer record (via the `handle_new_user` trigger matching on email) →
   they land on `/portal/estimates/[id]`.
4. Customer **accepts**, **declines**, or **requests changes**.
5. (v2) Invoices + Stripe payments.

## Deploy
Vercel is the natural host (matches vibeCodesSpace). Set the same env vars in the
Vercel project, add your production URL to Supabase Auth redirects, and point
`app.schmidtwalls.com` at the deployment.

## Deferred to v2
- Stripe payments on invoices (schema tables `invoices` / payment intent already present).
- Transactional email provider (Resend/SendGrid) for branded estimate emails.
- Side-by-side revision comparison and audit-trail UI (revisions are already captured).
