-- SR&ED Portal: membership billing (Stripe)
-- Run this in the Supabase SQL Editor AFTER schema.sql. Safe to run again.
--
-- One row per company. Company admins and KV admins can read it.
-- Nobody can change it from the browser: only the stripe-webhook Edge
-- Function (which runs with the service role) writes here, after Stripe
-- confirms a payment. So no one can give themselves a plan by editing data.

create table if not exists public.billing (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  plan text not null default 'growth' check (plan in ('starter','growth','scale','partner')),
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
  period text check (period in ('month','year')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);

alter table public.billing enable row level security;

drop policy if exists billing_read on public.billing;
create policy billing_read on public.billing for select
  using (public.is_kv_admin() or public.org_role(org_id) = 'admin');
-- No insert, update or delete policies on purpose.

-- Every new company starts a 14-day Growth trial.
create or replace function public.start_trial() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.billing (org_id) values (new.id) on conflict (org_id) do nothing;
  return new;
end $$;

drop trigger if exists organizations_trial on public.organizations;
create trigger organizations_trial after insert on public.organizations
  for each row execute function public.start_trial();

-- Companies created before this file was run get a trial too.
insert into public.billing (org_id)
select id from public.organizations on conflict (org_id) do nothing;
