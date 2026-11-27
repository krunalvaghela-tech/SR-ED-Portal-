# Supabase setup (about 10 minutes)

The portal uses Supabase for member sign-in, saved data and evidence files.
Supabase's free tier is enough to start.

## 1. Create the project
1. Go to https://supabase.com and sign up (GitHub sign-in is easiest).
2. Click **New project**.
   - Name: `sred-portal`
   - Database password: let Supabase generate one and keep it in your password manager.
   - Region: **Canada (Central)**, so client records stay in Canada.
3. Wait about two minutes for the project to start.

## 2. Create the database
1. In the project, open **SQL Editor** > **New query**.
2. Paste all of `supabase/schema.sql` and click **Run**.
3. It should finish with "Success. No rows returned".
4. Then open a new query, paste all of `supabase/deadlines.sql` and click **Run**. It adds each company’s year end and the claim-strength checklist.
5. Then run `supabase/company.sql`. It adds the company profile and enforces each membership’s limits (projects and people).

## 3. Turn on email sign-in
1. **Authentication** > **Sign In / Providers** > **Email**: make sure it is enabled.
2. **Authentication** > **URL Configuration**:
   - Site URL: `https://krunalvaghela-tech.github.io/SR-ED-Portal-/`
   - Redirect URLs: add `https://krunalvaghela-tech.github.io/SR-ED-Portal-/**` and `http://localhost:8765/**`

## 4. Send Claude the two public values
**Project Settings** > **API** (or **Data API**):
- **Project URL**, like `https://abcdefgh.supabase.co`
- **Publishable key** (older projects call it the **anon public** key)

Both are designed to be public and are safe to paste in chat. Security comes from
the row-level rules in `schema.sql`, not from hiding these.

**Never share the `service_role` / secret key.** It bypasses every rule.

## 5. Make yourself KV admin
Sign in to the portal once, then run this in the SQL Editor with your email:

```sql
update public.profiles set is_kv_admin = true where email = 'you@example.com';
```

## Who can do what

| Role | Sees | Can change |
|---|---|---|
| KV admin | Every company | Everything, creates companies |
| Company admin | Own company | Everything in own company, invites members |
| Staff | Own company | Files records, logs hours, edits projects |
| Advisor | Assigned companies | Nothing (read-only), sees the audit log |

Evidence is locked once filed: the database sets its timestamp and refuses edits
or deletes. Every change to company data is written to an append-only audit log.

## Memberships
To charge companies for the portal, follow `STRIPE.md` after finishing this file.
