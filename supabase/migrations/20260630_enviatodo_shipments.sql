create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.preorders(id) on delete cascade,
  provider text not null default 'enviatodo',
  provider_id text,
  provider_service_id text,
  service_name text,
  rate_uuid text,
  trx_id text,
  guide_id text,
  tracking_id text,
  tracking_link text,
  label_url text,
  label_base64 text,
  shipping_cost numeric,
  status text not null default 'quoted' check (status in ('quoted', 'created', 'ready_to_ship', 'shipped', 'cancelled', 'failed')),
  raw_rate_response jsonb,
  raw_order_response jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists shipments_order_id_idx on public.shipments(order_id);
create index if not exists shipments_tracking_id_idx on public.shipments(tracking_id);
create index if not exists shipments_trx_id_idx on public.shipments(trx_id);

alter table public.preorders
  add column if not exists shipping_status text default 'no_guide',
  add column if not exists tracking_id text,
  add column if not exists tracking_link text,
  add column if not exists shipping_provider text,
  add column if not exists shipping_cost_real numeric;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.preorders(id) on delete cascade,
  event_type text not null,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists order_events_order_id_idx on public.order_events(order_id);

alter table public.shipments enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "Service role can manage shipments" on public.shipments;
create policy "Service role can manage shipments"
on public.shipments for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage order events" on public.order_events;
create policy "Service role can manage order events"
on public.order_events for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
