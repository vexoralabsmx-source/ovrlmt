insert into public.products (
  slug,
  name,
  drop_number,
  price_mxn,
  image_url,
  images,
  active,
  status,
  description,
  color,
  fit,
  material,
  print_method,
  featured,
  story,
  code,
  accent
)
values
  (
    'naomi-cherry-blossom-gt3-hoodie',
    'Cherry Blossom × GT3 RS',
    '004 — NAYIOMI.KO',
    459,
    '/drops/naomi/cherry-blossom-gt3-hoodie.webp',
    array['/drops/naomi/cherry-blossom-gt3-hoodie.webp'],
    true,
    'active',
    'Sudadera de edición especial con arte Nayiomi.ko, flor de cerezo y GT3 RS. Construida para una silueta cómoda, pesada y nocturna.',
    'Negro lavado',
    'Corte regular',
    'French Terry heavyweight / 480 GSM',
    'DTF textil de alta densidad',
    true,
    'El primer round mezcla precisión, velocidad y calma bajo presión. Cherry Blossom × GT3 RS convierte el movimiento de Nayiomi y la silueta del auto en una sola escena.',
    'NY-004-01',
    'black'
  ),
  (
    'naomi-boxing-strike-tee',
    'Boxing Strike',
    '004 — NAYIOMI.KO',
    359,
    '/drops/naomi/boxing-strike-tee.webp',
    array['/drops/naomi/boxing-strike-tee.webp'],
    true,
    'active',
    'Playera de edición especial con acabado negro vintage y gráfica Nayiomi.ko de boxeo, velocidad y flor de cerezo.',
    'Negro vintage',
    'Corte regular',
    'Algodón heavyweight wash / 260 GSM',
    'DTF textil de alta densidad',
    true,
    'Boxing Strike captura el golpe antes del impacto: una composición frontal, directa y contenida donde Nayiomi domina el cuadro y la velocidad permanece debajo.',
    'NY-004-02',
    'black'
  ),
  (
    'naomi-title-champion-hoodie',
    'Title Champion',
    '004 — NAYIOMI.KO',
    459,
    '/drops/naomi/title-champion-hoodie.webp',
    array['/drops/naomi/title-champion-hoodie.webp'],
    true,
    'active',
    'Sudadera de edición especial con gráfica Title Champion de Nayiomi.ko, flores de cerezo y composición vertical de gran formato.',
    'Negro lavado',
    'Corte regular',
    'French Terry heavyweight / 480 GSM',
    'DTF textil de alta densidad',
    true,
    'La pieza final del drop lleva el nombre al frente y el título completo en la espalda. Es el cierre del combate: disciplina, presencia y una imagen hecha para dominar la noche.',
    'NY-004-03',
    'black'
  )
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
select product.id, stock.size, stock.total, 0, 0
from public.products as product
cross join (values ('CH', 999999), ('M', 999999), ('G', 999999), ('XG', 999999)) as stock(size, total)
where product.slug in (
  'naomi-cherry-blossom-gt3-hoodie',
  'naomi-boxing-strike-tee',
  'naomi-title-champion-hoodie'
)
on conflict (product_id, size) do update set
  total = excluded.total,
  updated_at = now();
