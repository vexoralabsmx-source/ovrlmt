create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  drop_number text,
  price_mxn numeric not null,
  image_url text,
  images text[] default '{}',
  active boolean default true,
  status text default 'active' check (status in ('draft', 'active', 'sold_out', 'hidden')),
  description text,
  color text default 'Negro',
  fit text default 'Premium fit',
  material text,
  print_method text,
  featured boolean default false,
  story text,
  code text,
  accent text default 'black' check (accent in ('black', 'bone', 'chrome')),
  created_at timestamptz default now()
);

create table if not exists public.product_stock (
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('CH', 'M', 'G', 'XG')),
  total int not null default 0 check (total >= 0),
  reserved int not null default 0 check (reserved >= 0),
  sold int not null default 0 check (sold >= 0),
  updated_at timestamptz default now(),
  primary key (product_id, size)
);

create table if not exists public.preorders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_whatsapp text not null,
  customer_company text,
  product_slug text not null,
  product_name text not null,
  size text not null,
  quantity int not null default 1,
  unit_price_mxn numeric not null,
  subtotal_mxn numeric not null,
  discount_code text,
  discount_mxn numeric default 0,
  shipping_mxn numeric default 150,
  total_mxn numeric not null,
  shipping_type text,
  address_state text not null,
  address_city text not null,
  address_line text,
  postal_code text,
  address_country text default 'Mexico',
  address_street text,
  address_exterior_number text,
  address_interior_number text,
  address_neighborhood text,
  address_reference text,
  status text default 'pending_payment',
  payment_proof_url text,
  items jsonb not null default '[]'::jsonb,
  payment_provider text,
  payment_method text,
  payment_request_id text,
  payment_status text,
  payment_receipt_no text,
  payment_url text,
  paid_at timestamptz,
  notes text,
  source text default 'website',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists preorders_payment_request_id_unique
  on public.preorders (payment_request_id)
  where payment_request_id is not null;

create index if not exists preorders_payment_status_idx
  on public.preorders (payment_status);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null,
  value numeric not null,
  active boolean default true,
  max_uses int,
  used_count int default 0,
  minimum_subtotal_mxn numeric default 0,
  first_order_only boolean default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.product_stock enable row level security;
alter table public.preorders enable row level security;
alter table public.coupons enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (active = true);

drop policy if exists "Public can read visible stock" on public.product_stock;
create policy "Public can read visible stock"
on public.product_stock for select
using (exists (
  select 1 from public.products
  where products.id = product_stock.product_id
  and products.active = true
  and products.status in ('active', 'sold_out')
));

drop policy if exists "Service role can manage products" on public.products;
create policy "Service role can manage products"
on public.products for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage product stock" on public.product_stock;
create policy "Service role can manage product stock"
on public.product_stock for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage preorders" on public.preorders;
create policy "Service role can manage preorders"
on public.preorders for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage coupons" on public.coupons;
create policy "Service role can manage coupons"
on public.coupons for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.products (slug, name, drop_number, price_mxn, image_url, images, active, status, description, color, fit, material, print_method, featured, story, code, accent)
values
  ('after-limits-001', 'After Limits', '001', 359, 'https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png', array['https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png'], true, 'active', 'Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.', 'Negro', 'Premium fit', '100% algodón / 190 g/m2', 'DTF textil premium', true, 'Nace para quienes encuentran claridad después de medianoche: asfalto frío, luces rojas y la decisión de seguir cuando el límite deja de importar.', 'AD-001-A', 'black'),
  ('no-brakes-002', 'No Brakes', '002', 359, 'https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png', array['https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png'], true, 'active', 'Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.', 'Negro', 'Premium fit', '100% algodón / 190 g/m2', 'DTF textil premium', true, 'Una pieza construida alrededor del impulso: velocidad contenida, ciudad nocturna y la cultura de avanzar sin pedir permiso.', 'AD-001-B', 'bone'),
  ('zero-hour-003', 'Zero Hour', '003', 359, 'https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png', array['https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png'], true, 'active', 'Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.', 'Negro', 'Premium fit', '100% algodón / 190 g/m2', 'DTF textil premium', true, 'Zero Hour captura el instante en que la noche, el motor y la calle se alinean. Sin ruido extra. Solo dirección, tensión y movimiento.', 'AD-001-C', 'chrome')
on conflict (slug) do update set
  name = excluded.name,
  drop_number = excluded.drop_number,
  price_mxn = excluded.price_mxn,
  image_url = excluded.image_url,
  images = excluded.images,
  active = excluded.active,
  status = excluded.status,
  description = excluded.description,
  color = excluded.color,
  fit = excluded.fit,
  material = excluded.material,
  print_method = excluded.print_method,
  featured = excluded.featured,
  story = excluded.story,
  code = excluded.code,
  accent = excluded.accent;

insert into public.product_stock (product_id, size, total, reserved, sold)
select p.id, s.size, s.total, 0, 0
from public.products p
cross join (values ('CH', 1), ('M', 2), ('G', 2), ('XG', 1)) as s(size, total)
where p.slug in ('after-limits-001', 'no-brakes-002', 'zero-hour-003')
on conflict (product_id, size) do update set
  total = excluded.total;

insert into public.coupons (code, type, value, active)
values ('OVRLMT-10FFDP1', 'percent', 10, true)
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  active = excluded.active;
