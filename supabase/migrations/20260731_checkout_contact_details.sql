alter table public.preorders
  add column if not exists customer_company text,
  add column if not exists address_country text default 'Mexico',
  add column if not exists address_street text,
  add column if not exists address_exterior_number text,
  add column if not exists address_interior_number text,
  add column if not exists address_neighborhood text,
  add column if not exists address_reference text;

update public.preorders
set address_country = coalesce(address_country, 'Mexico')
where address_country is null;
