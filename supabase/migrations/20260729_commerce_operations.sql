alter table public.preorders
  add column if not exists production_status text default 'received',
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists refund_status text default 'none',
  add column if not exists refund_reference text,
  add column if not exists refunded_at timestamptz;

alter table public.coupons
  add column if not exists minimum_subtotal_mxn numeric default 0,
  add column if not exists first_order_only boolean default false,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  preorder_id uuid not null references public.preorders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('CH', 'M', 'G', 'XG')),
  quantity int not null check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'released', 'converted')),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (preorder_id, product_id, size)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  preorder_id uuid references public.preorders(id) on delete set null,
  product_slug text not null,
  customer_email text,
  display_name text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  image_urls text[] not null default '{}',
  verified_purchase boolean not null default false,
  created_by_admin boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  preorder_id uuid not null references public.preorders(id) on delete cascade,
  customer_email text not null,
  request_type text not null default 'size_change' check (request_type in ('size_change', 'return', 'other')),
  requested_size text,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.checkout_drafts (
  id uuid primary key default gen_random_uuid(),
  customer_email text unique not null,
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  subtotal_mxn numeric not null default 0,
  checkout_url text not null default '/cart',
  recovery_sent_at timestamptz,
  recovered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists stock_reservations_expiry_idx on public.stock_reservations (status, expires_at);
create index if not exists reviews_public_idx on public.reviews (product_slug, status, created_at desc);
create index if not exists change_requests_order_idx on public.change_requests (preorder_id, created_at desc);

alter table public.stock_reservations enable row level security;
alter table public.reviews enable row level security;
alter table public.change_requests enable row level security;
alter table public.checkout_drafts enable row level security;

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews"
on public.reviews for select
using (status = 'approved');

drop policy if exists "Service role manages reservations" on public.stock_reservations;
create policy "Service role manages reservations"
on public.stock_reservations for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role manages reviews" on public.reviews;
create policy "Service role manages reviews"
on public.reviews for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role manages change requests" on public.change_requests;
create policy "Service role manages change requests"
on public.change_requests for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role manages checkout drafts" on public.checkout_drafts;
create policy "Service role manages checkout drafts"
on public.checkout_drafts for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create or replace function public.reserve_preorder_stock(
  p_preorder_id uuid,
  p_items jsonb,
  p_minutes int default 30
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  target_product uuid;
  target_size text;
  target_quantity int;
  expiry timestamptz := now() + make_interval(mins => greatest(5, least(p_minutes, 180)));
begin
  if exists (select 1 from stock_reservations where preorder_id = p_preorder_id and status = 'active') then
    return (select max(expires_at) from stock_reservations where preorder_id = p_preorder_id and status = 'active');
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    target_size := upper(item->>'size');
    target_quantity := greatest(1, (item->>'quantity')::int);
    select id into target_product from products where slug = item->>'slug' and active = true;
    if target_product is null then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;

    update product_stock
      set reserved = reserved + target_quantity, updated_at = now()
      where product_id = target_product
        and size = target_size
        and total - reserved - sold >= target_quantity;
    if not found then raise exception 'INSUFFICIENT_STOCK:%:%', item->>'slug', target_size; end if;

    insert into stock_reservations (preorder_id, product_id, size, quantity, expires_at)
    values (p_preorder_id, target_product, target_size, target_quantity, expiry);
  end loop;

  update preorders set reservation_expires_at = expiry, updated_at = now() where id = p_preorder_id;
  return expiry;
end;
$$;

create or replace function public.release_preorder_stock(p_preorder_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare reservation record;
begin
  for reservation in
    select * from stock_reservations where preorder_id = p_preorder_id and status = 'active' for update
  loop
    update product_stock
      set reserved = greatest(0, reserved - reservation.quantity), updated_at = now()
      where product_id = reservation.product_id and size = reservation.size;
  end loop;
  update stock_reservations set status = 'released', updated_at = now()
    where preorder_id = p_preorder_id and status = 'active';
end;
$$;

create or replace function public.confirm_preorder_stock(p_preorder_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare reservation record;
begin
  for reservation in
    select * from stock_reservations where preorder_id = p_preorder_id and status = 'active' for update
  loop
    update product_stock
      set reserved = greatest(0, reserved - reservation.quantity),
          sold = sold + reservation.quantity,
          updated_at = now()
      where product_id = reservation.product_id and size = reservation.size;
  end loop;
  update stock_reservations set status = 'converted', updated_at = now()
    where preorder_id = p_preorder_id and status = 'active';
end;
$$;

create or replace function public.release_expired_stock_reservations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare target record;
declare released_count int := 0;
begin
  for target in
    select distinct preorder_id from stock_reservations where status = 'active' and expires_at < now()
  loop
    perform release_preorder_stock(target.preorder_id);
    update preorders
      set status = case when payment_status = 'checkout_completed' then status else 'cancelled' end,
          payment_status = case when payment_status = 'checkout_completed' then payment_status else 'reservation_expired' end,
          updated_at = now()
      where id = target.preorder_id;
    released_count := released_count + 1;
  end loop;
  return released_count;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-images', 'review-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into public.coupons (code, type, value, active, minimum_subtotal_mxn, first_order_only)
values
  ('WELCOME10', 'percent', 10, true, 359, true),
  ('PACK2', 'percent', 5, true, 718, false),
  ('PACK3', 'percent', 10, true, 1077, false)
on conflict (code) do update set
  type = excluded.type,
  value = excluded.value,
  active = excluded.active,
  minimum_subtotal_mxn = excluded.minimum_subtotal_mxn,
  first_order_only = excluded.first_order_only;
