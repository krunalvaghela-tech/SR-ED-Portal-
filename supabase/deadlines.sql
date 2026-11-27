-- SR&ED Portal: year end, deadlines and claim-strength checklist
-- Run this in the Supabase SQL Editor AFTER schema.sql. Safe to run again.

-- Each company's tax year end. All deadlines are worked out from it in the portal.
alter table public.organizations add column if not exists fiscal_year_end date;
alter table public.organizations add column if not exists ccpc_sbd boolean not null default true;
update public.organizations set fiscal_year_end = make_date(tax_year, 12, 31) where fiscal_year_end is null;

-- One row per company, tax year (by its year end) and checklist item.
-- item 'filed' marks that year's claim as filed.
create table if not exists public.claim_checklist (
  org_id uuid not null references public.organizations(id) on delete cascade,
  year_end date not null,
  item text not null check (item ~ '^[a-z0-9_]{1,40}$'),
  status text not null check (status in ('yes','no','na')),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (org_id, year_end, item)
);

alter table public.claim_checklist enable row level security;

drop policy if exists checklist_read on public.claim_checklist;
create policy checklist_read on public.claim_checklist for select using (public.can_read(org_id));
drop policy if exists checklist_insert on public.claim_checklist;
create policy checklist_insert on public.claim_checklist for insert with check (public.can_write(org_id));
drop policy if exists checklist_update on public.claim_checklist;
create policy checklist_update on public.claim_checklist for update using (public.can_write(org_id)) with check (public.can_write(org_id));

drop trigger if exists claim_checklist_touch on public.claim_checklist;
create trigger claim_checklist_touch before update on public.claim_checklist
  for each row execute function public.touch_updated_at();
