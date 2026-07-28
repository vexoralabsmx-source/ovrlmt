-- Run this before enforcing NOT NULL if your project already has preorder rows.
-- Review rows that need manual correction:
select id, order_code, customer_name, customer_email, address_city, address_state
from public.preorders
where customer_email is null
   or trim(customer_email) = ''
   or address_city is null
   or trim(address_city) = ''
   or address_state is null
   or trim(address_state) = '';

-- Temporary placeholders keep the migration safe. Replace these values manually
-- with the real customer data when possible.
update public.preorders
set customer_email = coalesce(nullif(trim(customer_email), ''), 'pendiente@ovrlmt.xyz')
where customer_email is null or trim(customer_email) = '';

update public.preorders
set address_city = coalesce(nullif(trim(address_city), ''), 'Pendiente')
where address_city is null or trim(address_city) = '';

update public.preorders
set address_state = coalesce(nullif(trim(address_state), ''), 'Pendiente')
where address_state is null or trim(address_state) = '';

alter table public.preorders
  alter column customer_email set not null,
  alter column address_city set not null,
  alter column address_state set not null;
