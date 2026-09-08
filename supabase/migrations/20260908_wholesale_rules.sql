-- Configuración de mayoreo por modelo; ninguna promoción se activa automáticamente.
create table if not exists public.wholesale_rules (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null check (product_slug ~ '^[a-z0-9-]{1,160}$'),
  min_quantity integer not null check (min_quantity between 2 and 500),
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value numeric(12,2) not null check (discount_value > 0 and discount_value <= 100000),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint wholesale_percent_limit check (discount_type <> 'percent' or discount_value < 100),
  unique(product_slug, min_quantity)
);
alter table public.wholesale_rules enable row level security;
revoke all on table public.wholesale_rules from anon, authenticated;
grant all on table public.wholesale_rules to service_role;
