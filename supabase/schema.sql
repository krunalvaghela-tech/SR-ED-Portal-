-- ============================================================
-- SR&ED Records Portal: database, roles and security rules
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: every object is created "if not exists" or replaced.
--
-- Roles
--   KV admin      profiles.is_kv_admin = true. Sees and manages every company.
--   Company admin memberships.role = 'admin'. Manages own company and its members.
--   Staff         memberships.role = 'staff'. Files records and hours for own company.
--   Advisor       memberships.role = 'advisor'. Read-only on assigned companies.
--
-- People join by invitation: an admin adds an email to `invitations`;
-- when that person signs in with that email, they are added automatically.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  tax_year int not null default extract(year from now())::int,
  gap_threshold_days int not null default 45 check (gap_threshold_days between 7 and 180),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_kv_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','staff','advisor')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','staff','advisor')),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

-- People whose time is tracked. Not everyone needs a login.
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  job_title text,
  payroll_hours_per_week numeric(5,2) not null default 40 check (payroll_hours_per_week between 0 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  status text not null default 'Active' check (status in ('Active','Paused','Closed')),
  objective text not null default '',
  uncertainty text not null default '',
  hypothesis text not null default '',
  results text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evidence: the timestamp is set by the database and can never be changed.
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  person_id uuid references public.people(id) on delete set null,
  title text not null check (length(trim(title)) > 0),
  record_type text not null,
  source text not null default 'Upload',
  file_path text,
  recorded_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null default auth.uid()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  week_of date not null check (extract(isodow from week_of) = 1),  -- Mondays only
  project_id uuid references public.projects(id) on delete cascade, -- null = non-R&D work
  hours numeric(5,2) not null default 0 check (hours between 0 and 80),
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);
create unique index if not exists time_entries_one_row
  on public.time_entries (person_id, week_of, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  status text not null default 'missing' check (status in ('ok','pending','missing')),
  note text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.funding (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  program text not null,
  amount numeric(12,2) not null check (amount > 0),
  period text not null default '',
  created_at timestamptz not null default now()
);

-- Append-only history of every change, for reviewers.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid,
  table_name text not null,
  row_id uuid,
  action text not null,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now(),
  old_row jsonb,
  new_row jsonb
);

-- ---------- helper functions (security definer so policies stay simple) ----------
create or replace function public.is_kv_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_kv_admin from profiles where id = auth.uid()), false)
$$;

create or replace function public.org_role(o uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from memberships where org_id = o and user_id = auth.uid()
$$;

create or replace function public.can_read(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_kv_admin() or public.org_role(o) is not null
$$;

create or replace function public.can_write(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_kv_admin() or public.org_role(o) in ('admin','staff')
$$;

create or replace function public.can_manage(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_kv_admin() or public.org_role(o) = 'admin'
$$;

-- ---------- triggers ----------
-- New sign-in: create profile, accept any pending invitations for that email.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into memberships (org_id, user_id, role)
  select org_id, new.id, role from invitations
  where lower(email) = lower(new.email) and accepted_at is null
  on conflict do nothing;

  update invitations set accepted_at = now()
  where lower(email) = lower(new.email) and accepted_at is null;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Invitations for someone who already has an account apply at once.
create or replace function public.apply_invitation() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from profiles where email = lower(new.email);
  if uid is not null then
    insert into memberships (org_id, user_id, role) values (new.org_id, uid, new.role)
    on conflict (org_id, user_id) do update set role = excluded.role;
    new.accepted_at := now();
  end if;
  new.email := lower(new.email);
  return new;
end $$;

drop trigger if exists invitations_apply on public.invitations;
create trigger invitations_apply before insert on public.invitations
  for each row execute function public.apply_invitation();

-- Admins and staff who join are put on the weekly timesheet automatically.
create or replace function public.add_member_to_timesheet() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role in ('admin','staff') and not exists (
    select 1 from people where org_id = new.org_id and user_id = new.user_id) then
    insert into people (org_id, user_id, name)
    select new.org_id, new.user_id, coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1))
    from profiles p where p.id = new.user_id;
  end if;
  return new;
end $$;

drop trigger if exists memberships_timesheet on public.memberships;
create trigger memberships_timesheet after insert on public.memberships
  for each row execute function public.add_member_to_timesheet();

-- Evidence cannot be edited after filing (only the project link may change).
create or replace function public.lock_evidence() returns trigger
language plpgsql as $$
begin
  if new.recorded_at is distinct from old.recorded_at
     or new.title is distinct from old.title
     or new.org_id is distinct from old.org_id
     or new.file_path is distinct from old.file_path
     or new.created_by is distinct from old.created_by then
    raise exception 'Evidence is locked once filed. File a new record instead.';
  end if;
  return new;
end $$;

drop trigger if exists evidence_lock on public.evidence;
create trigger evidence_lock before update on public.evidence
  for each row execute function public.lock_evidence();

-- recorded_at is always the server time, whatever the browser sends.
create or replace function public.stamp_evidence() returns trigger
language plpgsql as $$
begin
  new.recorded_at := now();
  new.created_by := auth.uid();
  return new;
end $$;

drop trigger if exists evidence_stamp on public.evidence;
create trigger evidence_stamp before insert on public.evidence
  for each row execute function public.stamp_evidence();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['projects','time_entries','financial_records'] loop
    execute format('drop trigger if exists %1$s_touch on public.%1$s', t);
    execute format('create trigger %1$s_touch before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

create or replace function public.write_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (org_id, table_name, row_id, action, old_row, new_row)
  values (
    coalesce((to_jsonb(new)->>'org_id')::uuid, (to_jsonb(old)->>'org_id')::uuid),
    tg_table_name,
    coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['projects','evidence','time_entries','financial_records','funding','people'] loop
    execute format('drop trigger if exists %1$s_audit on public.%1$s', t);
    execute format('create trigger %1$s_audit after insert or update or delete on public.%1$s for each row execute function public.write_audit()', t);
  end loop;
end $$;

-- ---------- row level security ----------
alter table public.organizations     enable row level security;
alter table public.profiles          enable row level security;
alter table public.memberships       enable row level security;
alter table public.invitations       enable row level security;
alter table public.people            enable row level security;
alter table public.projects          enable row level security;
alter table public.evidence          enable row level security;
alter table public.time_entries      enable row level security;
alter table public.financial_records enable row level security;
alter table public.funding           enable row level security;
alter table public.audit_log         enable row level security;

-- organizations
drop policy if exists org_read on public.organizations;
create policy org_read on public.organizations for select using (public.can_read(id));
drop policy if exists org_create on public.organizations;
create policy org_create on public.organizations for insert with check (public.is_kv_admin());
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update using (public.can_manage(id));
drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations for delete using (public.is_kv_admin());

-- profiles: see yourself, people in your companies; edit your own name only
drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles for select using (
  id = auth.uid() or public.is_kv_admin() or exists (
    select 1 from memberships m1 join memberships m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id));
drop policy if exists profile_update on public.profiles;
create policy profile_update on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_kv_admin = public.is_kv_admin());

-- memberships and invitations: admins manage, members can see their company's list
drop policy if exists mem_read on public.memberships;
create policy mem_read on public.memberships for select using (public.can_read(org_id));
drop policy if exists mem_manage on public.memberships;
create policy mem_manage on public.memberships for all using (public.can_manage(org_id)) with check (public.can_manage(org_id));

drop policy if exists inv_read on public.invitations;
create policy inv_read on public.invitations for select using (public.can_manage(org_id));
drop policy if exists inv_manage on public.invitations;
create policy inv_manage on public.invitations for all using (public.can_manage(org_id)) with check (public.can_manage(org_id));

-- company data: read for members and advisors, write for admin and staff
do $$ declare t text; begin
  foreach t in array array['people','projects','time_entries','financial_records','funding'] loop
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format('create policy %1$s_read on public.%1$s for select using (public.can_read(org_id))', t);
    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (public.can_write(org_id))', t);
    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format('create policy %1$s_update on public.%1$s for update using (public.can_write(org_id)) with check (public.can_write(org_id))', t);
    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (public.can_manage(org_id))', t);
  end loop;
end $$;

-- evidence: anyone who can write may file; nobody deletes except KV admin
drop policy if exists evidence_read on public.evidence;
create policy evidence_read on public.evidence for select using (public.can_read(org_id));
drop policy if exists evidence_insert on public.evidence;
create policy evidence_insert on public.evidence for insert with check (public.can_write(org_id));
drop policy if exists evidence_update on public.evidence;
create policy evidence_update on public.evidence for update using (public.can_write(org_id)) with check (public.can_write(org_id));
drop policy if exists evidence_delete on public.evidence;
create policy evidence_delete on public.evidence for delete using (public.is_kv_admin());

-- audit log: readable by company admins, advisors and KV admin; written only by triggers
drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select using (
  public.is_kv_admin() or public.org_role(org_id) in ('admin','advisor'));

-- ---------- evidence file storage ----------
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Files live at evidence/<org_id>/<anything>
drop policy if exists evidence_files_read on storage.objects;
create policy evidence_files_read on storage.objects for select
  using (bucket_id = 'evidence' and public.can_read(((storage.foldername(name))[1])::uuid));
drop policy if exists evidence_files_insert on storage.objects;
create policy evidence_files_insert on storage.objects for insert
  with check (bucket_id = 'evidence' and public.can_write(((storage.foldername(name))[1])::uuid));
-- no update or delete policy: uploaded evidence files cannot be replaced or removed

-- ---------- after your first sign-in, make yourself KV admin ----------
-- update public.profiles set is_kv_admin = true where email = 'you@example.com';
