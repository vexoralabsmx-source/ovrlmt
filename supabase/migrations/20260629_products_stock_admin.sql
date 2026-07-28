alter table public.products add column if not exists images text[] default '{}';
alter table public.products add column if not exists status text default 'active';
alter table public.products add column if not exists description text;
alter table public.products add column if not exists color text default 'Negro';
alter table public.products add column if not exists fit text default 'Premium fit';
alter table public.products add column if not exists material text;
alter table public.products add column if not exists print_method text;
alter table public.products add column if not exists featured boolean default false;
alter table public.products add column if not exists story text;
alter table public.products add column if not exists code text;
alter table public.products add column if not exists accent text default 'black';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_status_check') then
    alter table public.products add constraint products_status_check check (status in ('draft', 'active', 'sold_out', 'hidden'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_accent_check') then
    alter table public.products add constraint products_accent_check check (accent in ('black', 'bone', 'chrome'));
  end if;
end $$;

create table if not exists public.product_stock (
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (size in ('CH', 'M', 'G', 'XG')),
  total int not null default 0 check (total >= 0),
  reserved int not null default 0 check (reserved >= 0),
  sold int not null default 0 check (sold >= 0),
  updated_at timestamptz default now(),
  primary key (product_id, size)
);

alter table public.product_stock enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (active = true and status in ('active', 'sold_out'));

drop policy if exists "Public can read visible stock" on public.product_stock;
create policy "Public can read visible stock"
on public.product_stock for select
using (exists (
  select 1 from public.products
  where products.id = product_stock.product_id
  and products.active = true
  and products.status in ('active', 'sold_out')
));

drop policy if exists "Service role can manage product stock" on public.product_stock;
create policy "Service role can manage product stock"
on public.product_stock for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.products (slug, name, drop_number, price_mxn, image_url, images, active, status, description, color, fit, material, print_method, featured, story, code, accent)
values
  ('after-limits-001', 'After Limits', '001', 359, 'https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png', array['https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_53_p.m._3_f1cqbm.png'], true, 'active', 'Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.', 'Negro', 'Premium fit', '100% algodón / 190 g/m2', 'DTF textil premium', true, 'Nace para quienes encuentran claridad después de medianoche: asfalto frío, luces rojas y la decisión de seguir cuando el límite deja de importar.', 'AD-001-A', 'black'),
  ('no-brakes-002', 'No Brakes', '001', 359, 'https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png', array['https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_50_p.m._1_to2kq4.png'], true, 'active', 'Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.', 'Negro', 'Premium fit', '100% algodón / 190 g/m2', 'DTF textil premium', true, 'Una pieza construida alrededor del impulso: velocidad contenida, ciudad nocturna y la cultura de avanzar sin pedir permiso.', 'AD-001-B', 'bone'),
  ('zero-hour-003', 'Zero Hour', '001', 359, 'https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png', array['https://res.cloudinary.com/dakjhsfne/image/upload/v1782265447/ChatGPT_Image_23_jun_2026_07_38_51_p.m._2_l1isxe.png'], true, 'active', 'Playera premium de edición limitada. Corte premium pensado para uso diario, con presencia limpia y estructura cómoda.', 'Negro', 'Premium fit', '100% algodón / 190 g/m2', 'DTF textil premium', true, 'Zero Hour captura el instante en que la noche, el motor y la calle se alinean. Sin ruido extra. Solo dirección, tensión y movimiento.', 'AD-001-C', 'chrome')
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
