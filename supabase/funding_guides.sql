-- SR&ED Portal: member-only funding program guides
-- Run in the Supabase SQL Editor AFTER schema.sql and billing.sql. Safe to run again.
--
-- The guide content itself is paid material and is NOT in this public repository.
-- KV keeps it in a private seed file (outside the repo) and runs it after this file.
--
-- Who can read the guides: members of a company on the Growth, Scale or partner
-- plan (trial included), and KV admins. Starter companies cannot read them, even
-- by calling the database directly.

create table if not exists public.funding_guides (
  slug text primary key check (slug ~ '^[a-z0-9_]{1,40}$'),
  sort int not null default 0,
  title text not null,
  kind text not null,
  body jsonb not null,
  checked_on date,
  updated_at timestamptz not null default now()
);

alter table public.funding_guides enable row level security;

create or replace function public.has_funding_access() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_kv_admin() or exists (
    select 1
    from public.memberships m
    join public.billing b on b.org_id = m.org_id
    where m.user_id = auth.uid()
      and b.plan in ('growth','scale','partner')
      and b.status in ('trialing','active','past_due')
      and (b.status <> 'trialing' or b.trial_ends_at is null or b.trial_ends_at > now())
  );
$$;

drop policy if exists funding_guides_read on public.funding_guides;
create policy funding_guides_read on public.funding_guides for select using (public.has_funding_access());
-- No insert, update or delete policies: KV edits the content in the SQL Editor.
