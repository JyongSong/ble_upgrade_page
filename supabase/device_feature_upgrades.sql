create extension if not exists pgcrypto;

create table if not exists public.device_feature_upgrades (
  id uuid primary key default gen_random_uuid(),
  sn text not null unique,
  contact text,
  purchase_status text not null default 'pending',
  feature_code text not null default 'zigbee',
  payment_provider text not null default 'demo',
  paid_at timestamptz,
  last_hub_bound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_feature_upgrades_purchase_status_check
    check (purchase_status in ('pending', 'paid', 'failed'))
);

create index if not exists idx_device_feature_upgrades_purchase_status
  on public.device_feature_upgrades (purchase_status);

create or replace function public.set_device_feature_upgrades_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_device_feature_upgrades_updated_at on public.device_feature_upgrades;

create trigger trg_device_feature_upgrades_updated_at
before update on public.device_feature_upgrades
for each row
execute function public.set_device_feature_upgrades_updated_at();

alter table public.device_feature_upgrades
  drop constraint if exists device_feature_upgrades_sn_fkey;

alter table public.device_feature_upgrades
  alter column contact drop not null;

alter table public.device_feature_upgrades
  add column if not exists last_hub_bound_at timestamptz;
