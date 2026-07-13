# SETUP — quick checklist

- [ ] `npm install`
- [ ] Create Supabase project; copy URL + anon + service_role keys into `.env.local`
- [ ] Run `supabase/migrations/20260713000000_init.sql` in the SQL Editor
- [ ] Add `<site>/callback` to Supabase Auth redirect URLs
- [ ] `npm run dev`, sign in at `/login`
- [ ] Set your `profiles.role = 'employee'` in Supabase
- [ ] Add a customer, build an estimate, click **Email to Customer**
- [ ] Open the dev invite link (shown after send) in a private window to test the customer flow

## Notes
- This project was scaffolded outside your static marketing site so the two never
  collide in a Pages build. Keep it in its own repo (`SchmidtPortal`) / its own
  Vercel project.
- Move it to its own repo:
  ```bash
  cd SchmidtPortal
  git init && git add . && git commit -m "Initial Schmidt Portal scaffold"
  git remote add origin git@github.com:Mattjhagen/SchmidtPortal.git
  git push -u origin main
  ```
