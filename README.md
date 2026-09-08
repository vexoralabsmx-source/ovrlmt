# OVRLMT - Built After Dark

Next.js 16 App Router para `ovrlmt.xyz`: tienda streetwear con Supabase, carrito, Clip y transferencia.

La revisión local de septiembre de 2026, los pendientes comerciales, las pruebas y la estructura actual se documentan en [docs/OVRLMT-REVIEW.md](docs/OVRLMT-REVIEW.md). `/contact` ahora es contacto y `/personalizados` contiene el servicio secundario. Las instrucciones de preorder más abajo son históricas; el flujo vigente se realiza en `/cart`.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://ovrlmt.xyz
RESEND_API_KEY=
RESEND_FROM_EMAIL="OVRLMT <contacto@ovrlmt.xyz>"
ADMIN_NOTIFICATION_EMAIL=contacto@ovrlmt.xyz
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` puede usarse en navegador. `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY` son solo de servidor.

## Supabase

1. Crea un proyecto en Supabase.
2. Copia `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` desde Project Settings.
3. Copia `SUPABASE_SERVICE_ROLE_KEY` solo para las API routes de Next.js.
4. Abre SQL Editor en Supabase.
5. Pega y ejecuta `supabase/schema.sql`.
6. En Authentication > URL Configuration, agrega `https://ovrlmt.xyz/recuperar-contrasena` a Redirect URLs. Para probar localmente, agrega también `http://localhost:3000/recuperar-contrasena`.

El SQL crea:

- `products`
- `preorders`
- `coupons`

También habilita RLS, inserta los productos `After Limits 001`, `No Brakes 002`, `Zero Hour 003` y crea el cupón `OVRLMT-10FFDP1` con 10% de descuento.

Si ya tienes filas en `preorders` antes de hacer obligatorio el correo, corre primero `supabase/migrations/20260629_require_preorder_email.sql`. La migración muestra filas incompletas, rellena valores temporales y después aplica `NOT NULL` a `customer_email`, `address_city` y `address_state`.

## Resend

1. En Resend, agrega el dominio `ovrlmt.xyz`.
2. Agrega en tu DNS los registros que Resend indique.
3. Espera a que el dominio quede verificado y con envío habilitado.
4. Crea `RESEND_API_KEY`.
5. Usa:

```bash
RESEND_FROM_EMAIL="OVRLMT <contacto@ovrlmt.xyz>"
ADMIN_NOTIFICATION_EMAIL=contacto@ovrlmt.xyz
```

La API valida que `ovrlmt.xyz` esté verificado en Resend antes de enviar correos. Los correos automáticos salen como `OVRLMT <contacto@ovrlmt.xyz>` y las alertas internas llegan a `contacto@ovrlmt.xyz`.

## EnviaTodo API V2

Variables server-only requeridas:

```bash
ENVIATODO_BASE_URL=https://apiqav2.enviatodo.mx/index.php/
ENVIATODO_TOKEN=
ENVIATODO_API_KEY=enviatodo
ENVIATODO_APP=custom
ENVIATODO_CONTENT_TYPE=application/json
ENVIATODO_MODE=sandbox
ENVIATODO_GUIDE_DOWNLOAD_URL=https://apiqav2.enviatodo.mx/index.php/Api/download_guides
ENVIATODO_GUIDE_BINARIES_URL=https://apiqav2.enviatodo.mx/index.php/Api/download_guide_binaries
```

No uses `NEXT_PUBLIC_` para ninguna variable de EnviaTodo. El token solo se lee en servidor desde `src/lib/enviatodo/*`.

Pruebas directas contra sandbox:

```bash
curl -X GET "https://apiqav2.enviatodo.mx/index.php/Api/get_client_balance" \
  -H "x-api-key: enviatodo" \
  -H "x-enviatodo-app: custom" \
  -H "Authorization: Bearer TU_TOKEN"
```

```bash
curl -X GET "https://apiqav2.enviatodo.mx/index.php/Api/get_zip_code/68146" \
  -H "x-api-key: enviatodo" \
  -H "x-enviatodo-app: custom" \
  -H "Authorization: Bearer TU_TOKEN"
```

Endpoints internos:

- `GET /api/enviatodo/balance`
- `GET /api/enviatodo/zip-code/68146`
- `POST /api/enviatodo/rates`
- `POST /api/enviatodo/create-order`
- `POST /api/enviatodo/download-guides`
- `GET /api/enviatodo/orders`

Payload para cotizar:

```json
{
  "origin": { "zip_code": "72000", "state": "Puebla", "city": "Puebla", "colony": "Centro" },
  "destination": { "zip_code": "68146", "state": "Oaxaca", "city": "Oaxaca", "colony": "Centro" },
  "package": {
    "height": 4,
    "width": 28,
    "length": 35,
    "weight": 1,
    "real_weight": "1.00",
    "volumetric_weight": "1",
    "bill_weight": "1",
    "package_content": "PLAYERAS",
    "product_type": "53100000",
    "unit_type": "XBX",
    "amount_pkg": "300",
    "product_quantity": "1"
  },
  "quantity": 1,
  "shipping_type": "1",
  "provider_id": "9",
  "provider_service_id": "12"
}
```

Payload para crear orden:

```json
{
  "uuid": "uuid-from-quote",
  "provider_id": "9",
  "provider_service_id": "12",
  "insurance": false
}
```

Payload para descargar guias:

```json
{ "guides": [2055848] }
```

Notas:

- Las rutas admin bajo `/api/admin/enviatodo/*` requieren sesión admin y guardan cotizaciones/guias en Supabase.
- Las rutas internas `/api/enviatodo/create-order` y `/api/enviatodo/download-guides` no exponen el token, pero antes de producción conviene protegerlas con sesión, pago validado o flujo admin.
- Si EnviaTodo responde `401`/`403` con `Invalid token authentication`, revisa que `ENVIATODO_TOKEN` no haya vencido. Los JWT de EnviaTodo pueden traer `issuedAt` y `ttl`; si expiran, genera uno nuevo y reinicia el servidor/app para que lea la variable actualizada.
- Si el token esta vigente, revisa el formato `Authorization: Bearer TU_TOKEN`, `ENVIATODO_API_KEY`, `ENVIATODO_APP` y que `ENVIATODO_BASE_URL` corresponda al ambiente correcto. Algunos quickstarts antiguos muestran `Bearer: TOKEN`; no cambies el formato sin confirmacion manual de EnviaTodo.

## Preorders

El formulario propio en `/contact` captura:

- Nombre
- WhatsApp
- Correo electrónico obligatorio
- Producto
- Talla
- Cantidad
- Ciudad
- Estado
- Cupón opcional
- Notas opcionales

La API `POST /api/preorders` valida payload, exige correo con formato válido, calcula subtotal, descuento, envío y total. El envío externo cuesta `$150 MXN`; si el total después de descuento es mayor o igual a `$1,500 MXN`, el envío es gratis.

Si el pedido se guarda pero Resend falla, la API responde `ok: true` con `emailWarning: true`. En ese caso el pedido queda en Supabase y debe confirmarse por WhatsApp.

## Flujo de prueba

1. Ejecuta `supabase/schema.sql` en Supabase.
2. Configura `.env.local`.
3. Ejecuta `npm run dev`.
4. Entra a `/contact`.
5. Llena un preorder con un producto y talla.
6. Prueba el cupón `OVRLMT-10FFDP1`.
7. Envía el formulario.
8. Revisa el registro en Supabase, tabla `preorders`.
9. Confirma que el cliente reciba correo en el email capturado.
10. Confirma que `contacto@ovrlmt.xyz` reciba la alerta interna.
11. Abre el botón “Confirmar por WhatsApp” y valida el mensaje prellenado.

## Debug

Si ves “No pudimos registrar tu pedido”, revisa los logs del servidor en Vercel o en la terminal local. La API registra `preorders_api_error` con códigos como:

- `missing_env_vars`
- `invalid_payload`
- `missing_required_email`
- `coupon_validation_failed`
- `supabase_insert_failed`
- `resend_customer_email_failed`
- `resend_admin_email_failed`
- `unknown_error`

En desarrollo la respuesta JSON puede incluir detalles no sensibles. En producción no se exponen secretos al navegador.

Para probar Resend sin crear un pedido, levanta la app en local y ejecuta:

```bash
curl -X POST http://localhost:3000/api/debug/test-email
```

Ese endpoint solo funciona cuando `NODE_ENV !== "production"` y envía una prueba a `contacto@ovrlmt.xyz`.

## Producción

```bash
npm run typecheck
npm run build
npm start
```

Checklist:

- Variables de entorno cargadas en Vercel.
- Dominio `ovrlmt.xyz` verificado en Resend.
- RLS activo en Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- `RESEND_API_KEY` solo en servidor.
- Formulario `/contact` probado en mobile.
- Emails de cliente y admin probados.
# Pago con Clip

El checkout usa la API de Checkout Redireccionado de Clip. La tienda calcula precios y envío en el servidor, crea la orden en Supabase y redirige al cliente a Clip para capturar la tarjeta.

1. Copia las variables de `.env.example` a tu archivo local de entorno.
2. Configura `CLIP_API_KEY` y `CLIP_API_SECRET`, o usa `CLIP_AUTH_TOKEN` con el token Basic generado por Clip.
3. En producción configura `APP_BASE_URL=https://tu-dominio.com` y `CLIP_WEBHOOK_URL=https://tu-dominio.com/api/clip/webhook`.
4. Ejecuta la migración `supabase/migrations/20260728_clip_checkout.sql`.

Las credenciales de Clip son privadas. No deben llevar el prefijo `NEXT_PUBLIC_` ni subirse al repositorio.
