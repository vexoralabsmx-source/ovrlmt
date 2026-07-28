alter table public.preorders
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists address_line text,
  add column if not exists postal_code text,
  add column if not exists payment_provider text,
  add column if not exists payment_method text,
  add column if not exists payment_request_id text,
  add column if not exists payment_status text,
  add column if not exists payment_receipt_no text,
  add column if not exists payment_url text,
  add column if not exists paid_at timestamptz;

create unique index if not exists preorders_payment_request_id_unique
  on public.preorders (payment_request_id)
  where payment_request_id is not null;

create index if not exists preorders_payment_status_idx
  on public.preorders (payment_status);
