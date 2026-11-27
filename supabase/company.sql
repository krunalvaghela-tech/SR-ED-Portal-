-- SR&ED Portal: company profile and membership limits
-- Run in the Supabase SQL Editor AFTER schema.sql, billing.sql and deadlines.sql. Safe to run again.

-- ---------- company profile ----------
alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists operating_name text,
  add column if not exists business_number text check (business_number is null or business_number ~ '^\d{9}(RC\d{4})?$'),
  add column if not exists province text check (province is null or province in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  add column if not exists ccpc boolean,
  add column if not exists industry text,
  add column if not exists employees int check (employees is null or employees >= 0),
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists postal_code text,
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists advisor_firm text,
  add column if not exists advisor_email text,
  add column if not exists onboarded_at timestamptz not null default now();

update public.organizations set legal_name = name where legal_name is null;

-- ---------- KV admins set a company's membership when onboarding ----------
-- (Stripe's webhook still updates it afterwards; company users still cannot change it.)
drop policy if exists billing_kv_insert on public.billing;
create policy billing_kv_insert on public.billing for insert with check (public.is_kv_admin());
drop policy if exists billing_kv_update on public.billing;
create policy billing_kv_update on public.billing for update using (public.is_kv_admin()) with check (public.is_kv_admin());

-- ---------- what each membership includes ----------
-- Keep these numbers in step with LIMITS in assets/guide.js.
create or replace function public.plan_of(o uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when b.plan is null then 'growth'
    when b.status in ('canceled','unpaid','incomplete_expired','paused') then 'starter'
    when b.status = 'trialing' and b.trial_ends_at is not null and b.trial_ends_at < now() then 'starter'
    else b.plan end
  from (select 1) x left join public.billing b on b.org_id = o;
$$;

create or replace function public.plan_limit(o uuid, kind text) returns int
language sql stable security definer set search_path = public as $$
  select case public.plan_of(o)
    when 'starter' then case kind when 'projects' then 3 when 'people' then 5 end
    when 'growth'  then case kind when 'projects' then null when 'people' then 25 end
    else null end;   -- null means no limit
$$;

-- Active projects
create or replace function public.enforce_project_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim int; n int;
begin
  if coalesce(new.status, 'Active') <> 'Active' then return new; end if;
  lim := public.plan_limit(new.org_id, 'projects');
  if lim is null then return new; end if;
  select count(*) into n from public.projects where org_id = new.org_id and coalesce(status, 'Active') = 'Active' and id <> new.id;
  if n >= lim then
    raise exception 'Your plan includes % active projects. Upgrade to add more.', lim using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists projects_plan_limit on public.projects;
create trigger projects_plan_limit before insert or update of status on public.projects
  for each row execute function public.enforce_project_limit();

-- People (company admins and staff; advisors do not count)
create or replace function public.enforce_people_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim int; n int;
begin
  if new.role = 'advisor' or public.is_kv_admin() then return new; end if;
  lim := public.plan_limit(new.org_id, 'people');
  if lim is null then return new; end if;
  select (select count(*) from public.memberships where org_id = new.org_id and role <> 'advisor')
       + (select count(*) from public.invitations where org_id = new.org_id and role <> 'advisor' and accepted_at is null)
    into n;
  if n >= lim then
    raise exception 'Your plan includes % people. Upgrade to add more.', lim using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists invitations_plan_limit on public.invitations;
create trigger invitations_plan_limit before insert on public.invitations
  for each row execute function public.enforce_people_limit();
