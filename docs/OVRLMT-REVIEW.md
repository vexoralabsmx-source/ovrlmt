# Revisión OVRLMT — septiembre de 2026

## Alcance y estado
Implementación local en `codex/ovrlmt-store-refinement`. No se publicó ni desplegó. No se modificaron filas, precios, credenciales ni secretos de la base de datos. Se conservó el cambio previo del usuario en `app/api/admin/orders/route.ts`.

## Arquitectura revisada
- Next.js 16.2.9 App Router, React 19, TypeScript, CSS existente y Tailwind 4.
- Supabase: productos, stock por talla, pedidos, cupones, reseñas, solicitudes de cambio y envíos; autenticación mediante Supabase.
- Carrito en contexto React y localStorage; `/cart` contiene el checkout de tres pasos.
- Tarjeta mediante Clip, transferencia, confirmación y reservas en servidor; Resend para correos existentes.
- EnviaTodo para cotizaciones y guías; operaciones administrativas protegidas por sesión.
- Catálogo histórico en Supabase y tres piezas Drop 004 en `data/products.ts`. No se aplicaron migraciones.
- Activos propios en `public/brand` y `public/drops/naomi`; fotografías adicionales en Cloudinary y reseñas en Supabase Storage.
- No se encontró un AGENTS.md en el repositorio. Se siguieron las instrucciones globales facilitadas por el usuario.

## Ajuste visual solicitado el 8 de septiembre
Se recuperaron el CSS original, el hero 3D, las animaciones, el carrusel Drop 004 y el orden editorial anterior. Se mantienen filtros, paginación, archivo, galería ampliable, guía compartida, carrito y validaciones del checkout. Los nuevos controles conservan estilos propios integrados con la identidad original. El carrusel vuelve a duplicar su grupo únicamente para el movimiento continuo; la copia queda fuera del teclado y de lectores de pantalla. No se reintrodujo la espera artificial del loader.

## Cambios funcionales conservados
1. Inicio con diseño editorial original; conserva datos reales del Drop 004, calidad tomada de productos, pasos de compra, comunidad, tallas y FAQ de ocho preguntas.
2. Navegación en español, menú móvil con diálogo nativo, Escape, contención y devolución de foco. Acceso a pedidos y carrito.
3. Catálogo ordenado por drop actual, filtros por categoría, seis productos por página y archivo de las piezas antiguas conocidas como agotadas. Productos ocultos ajenos a ese archivo permanecen ocultos.
4. Fichas con imágenes responsive, ampliación y miniaturas cuando hay más de una imagen distinta. Sin simular fotografías adicionales. Tallas CH/M/G/XG, envío y tiempos antes de agregar al carrito.
5. `/contact` reemplaza el formulario antiguo; personalizados queda separado en `/personalizados`.
6. Configuración comercial en `data/commerce.ts`; guía compartida sin las tablas numéricas contradictorias.
7. Reseñas con carga acotada a diez segundos, estado vacío y manejo de errores. Comunidad preparada en `data/community.ts` para fotos autorizadas, estatura, talla y fit reales.
8. URLs públicas Nayiomi con 308 desde Naomi. Los identificadores internos de pagos, reseñas y pedidos permanecen iguales.
9. Canonical, metadatos de productos, Product JSON-LD sin reseñas inventadas, sitemap de catálogo público y exclusión de rutas privadas en robots.
10. Checkout consulta datos autorizados de catálogo; no calcula cobros con precios del navegador. Borradores también recalculan importes. Validación de artículos duplicados, códigos postales y solicitudes inválidas.

## Rendimiento
- Se retiró la escena Three.js/WebGL del inicio, conservando los componentes originales disponibles en el repositorio.
- Se retiró el loader artificial de 950 ms.
- Se eliminó el carrusel duplicado y la descarga eager de seis tarjetas.
- Las imágenes locales vuelven a pasar por Next Image con tamaños responsive; carga diferida fuera del hero.
- El hero se entrega sin esperar la consulta del catálogo gracias a Suspense.
- La consulta compartida entre metadatos y ficha se deduplica dentro de la misma petición, sin mantener stock cacheado entre compradores.
- Se conservan las fuentes de marca servidas con next/font.
- Favicon: 398,351 bytes original → 964 bytes a 32 px; icono Apple de 8,973 bytes. Los originales siguen intactos.
- Animación reducida en móvil y con prefers-reduced-motion. Se quitaron tilt y revelaciones que ocultaban contenido hasta ejecutar JavaScript.
- No se afirma una puntuación Lighthouse ni una mejora de Core Web Vitals de campo: requiere medición después del despliegue autorizado.

## Contradicciones y decisiones pendientes
| Hallazgo | Tratamiento local | Confirmación pendiente |
|---|---|---|
| Guía general: CH equivalente a S, ancho 55/largo 70; modal: ancho 49/largo 68. También divergían las otras tallas. | Se conserva cómo medirse y consultar la talla; no se publica una tabla arbitraria. | Medidas verificadas de playera y sudadera por modelo. |
| Nature’s Blueprint cuesta $360 en Supabase y está oculto. | Precio y estado intactos. Boxing Strike tiene $359 en el catálogo local. | Si Nature’s Blueprint debe cambiar a $359 y si volverá a venderse. |
| FAQ permite solicitar cambios; página de cambios y modal los negaban después del pago. | Texto común permite solicitar revisión por etapa y disponibilidad, sin garantizar aprobación. | Política definitiva de cambios de talla, cancelación y defectos; revisión legal antes de publicar. |
| Se exigían fotos en 48 horas y había cancelaciones absolutas. | Atención individual sin afirmar una pérdida automática de derechos ni prometer reembolsos. | Ventanas, costos y soluciones aprobadas por la marca. |
| Checkout tenía 5–8 días hábiles de producción + 2–5 de envío, otras páginas no. | Se centraliza el rango existente y se presenta como estimado. | Vigencia operativa de esos plazos. |
| Algunas fichas históricas dicen 190 g/m² y premium fit, mientras su descripción menciona hoodie/oversized. | No se inventaron composición, gramaje o tipo de prenda. | Auditar esos campos en Supabase por SKU; en fichas sin tipo identificable se usa “Prenda”. |
| Drop 004 no tiene filas en Supabase. | Se conserva catálogo local existente y su flujo de venta, sin reactivar una fila oculta si posteriormente aparece en Supabase. | Migrar a un único catálogo si se desea, con pruebas de Clip y reseñas en entorno de pruebas. |
| No hay vistas separadas frontal/trasera/detalle para Drop 004. | Se usa la imagen real disponible, que contiene la referencia frontal/trasera, y zoom. | Aportar fotografías reales y autorizadas; añadirlas a `images`. |

## Envíos
El cotizador público exige `PUBLIC_SHIPPING_QUOTES_ENABLED=true`, `ENVIATODO_MODE=production`, URL no sandbox y token presente. Está apagado por defecto y su API pública también se bloquea. No se modificó ningún archivo de credenciales. Las cotizaciones y guías administrativas permanecen separadas.

Tarifa nacional: $150 MXN. Gratis desde $1,500 después de descuentos. Entrega personal según CP y confirmación en Plaza Crystal, Walmart San Manuel o Plaza Dorada.

## Analítica propuesta, sin activar servicios ni cookies
No se encontró una integración de analítica de eventos. No se agregó ninguna. Si se autoriza en el futuro:

| Evento | Momento y origen |
|---|---|
| view_item | Ficha visible; ID interno de producto y precio de catálogo. |
| select_size | Selección voluntaria CH/M/G/XG. |
| add_to_cart | Artículo agregado; talla y cantidad. |
| begin_checkout | Inicio del flujo del carrito. |
| purchase | Solo pago confirmado por servidor/webhook, deduplicado por pedido. |
| whatsapp_click | Clic en soporte o pedido, sin enviar el contenido del mensaje. |

No incluir correo, teléfono, dirección ni datos de pago en eventos. Revisar consentimiento y privacidad antes de habilitar un proveedor.

## Verificación
- `npm ci --no-audit --no-fund`: correcto con package-lock existente. Se añadieron únicamente herramientas de desarrollo ESLint y TypeScript ESLint; ninguna dependencia de runtime nueva.
- Lint: cero errores, cuatro advertencias anteriores en archivos de administración y tipos de configuración EnviaTodo.
- Typecheck: correcto.
- Siete pruebas unitarias nuevas: URLs compatibles, disponibilidad, CP, productos ocultos, precios reales, ausencia de stock prestado y fallo seguro del catálogo.
- Build de producción: correcto; repetir después de cualquier cambio futuro.
- Navegador de producción: 27 comprobaciones (nueve rutas × 390×844, 768×1024 y 1440×1000), sin desbordamiento horizontal, imágenes fallidas, recursos con error ni errores de consola. Carrito vacío en la matriz; checkout con artículos probado aparte. También se comprobaron 375 px, orientación horizontal 844×390 y prefers-reduced-motion. Evidencia en `output/responsive-results.jsonl`.
- Carrito: agregar XG, aumentar a dos ($718 + $150 = $868), eliminar y conservar al navegar.
- Checkout: correo inválido rechazado, dirección completada con datos ficticios locales, entrega personal/nacional y selección de métodos de pago. No se pulsó pagar ni confirmar transferencia.
- El guardado automático `/api/checkout/draft` se interceptó en el navegador durante la prueba: no se crearon contactos, órdenes ni correos de prueba.
- 308 en las tres URLs Naomi y `/drop/playera-01`; 404 real en ruta inexistente.
- 401 para API de pedidos administrativos y saldo EnviaTodo sin sesión. 400 para cuerpos inválidos de Clip/transferencia. Cotizador público apagado: 404.
- No se validó un cobro real, una devolución, una guía real ni una sesión autenticada del propietario; necesitan datos y entorno de pruebas adecuados.

## Revisión local
```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node node_modules/next/dist/bin/next start --port 3101
```
Abrir http://localhost:3101. Para desarrollo: `node node_modules/next/dist/bin/next dev --turbopack --port 3100`.

No desplegar hasta recibir autorización. Los cambios están en una rama reversible, sin commit ni modificación de datos remotos.

## Archivos modificados

- `README.md`

- `app/api/checkout/draft/route.ts`
- `app/api/checkout/transfer/route.ts`
- `app/api/clip/checkout/route.ts`
- `app/api/enviatodo/rates/route.ts`
- `app/cambios/page.tsx`
- `app/cart/page.tsx`
- `app/contact/page.tsx`
- `app/drop/[slug]/page.tsx`
- `app/drop/page.tsx`
- `app/envios/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `app/personalizados/page.tsx`
- `app/privacidad/page.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/size-guide/page.tsx`
- `app/story/page.tsx`
- `components/CartDrawer.tsx`
- `components/CartPage.tsx`
- `components/CartProvider.tsx`
- `components/CommerceSections.tsx`
- `components/EnviatodoQuoteWidget.tsx`
- `components/Footer.tsx`
- `components/Header.tsx`
- `components/Modal.tsx`
- `components/NaomiDropShowcase.tsx`
- `components/PageFrame.tsx`
- `components/PolicyPage.tsx`
- `components/ProductCard.tsx`
- `components/ProductGallery.tsx`
- `components/ProductPurchase.tsx`
- `components/ProductReviews.tsx`
- `components/Reveal.tsx`
- `components/SizeGuideContent.tsx`
- `data/commerce.ts`
- `data/community.ts`
- `eslint.config.mjs`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `public/brand/apple-touch-icon.png`
- `public/brand/favicon-32.png`
- `src/lib/catalog.ts`
- `src/lib/shippingFeature.ts`
- `tests/commerce.test.cjs`

El informe está en `docs/OVRLMT-REVIEW.md`. Las capturas están en `output/` (carpeta ignorada por Git).

## Capturas finales
- `output/final-desktop-inicio.png`
- `output/final-mobile-inicio.png`
- `output/final-desktop-coleccion.png`
- `output/final-desktop-playera.png`
- `output/final-mobile-envios.png`
- `output/checkout-mobile.png` (flujo de pago revisado en desarrollo, sin enviar)
- Matriz completa: `output/final-{mobile,tablet,desktop}-{ruta}.png`.

La vista local de producción quedó disponible en http://localhost:3101. Paginación comprobada: índices 07/08/09/10/11/12 en página 2. Archivo comprobado: After Limits, Zero Hour y No Brakes, todos sin compra habilitada. Reseñas vacías de Boxing Strike verificadas, canonical y precio JSON-LD $359 MXN correctos.
