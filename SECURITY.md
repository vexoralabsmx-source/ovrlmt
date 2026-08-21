# Seguridad de OVRLMT

## Capas activas en el código

- Límites por IP para autenticación, cupones, checkout, preórdenes, cotizaciones, códigos postales, reseñas y confirmación de pagos.
- Límite de tamaño y exigencia de JSON en solicitudes públicas que modifican datos.
- Precios, nombres, estado y disponibilidad de productos validados desde el servidor.
- Creación y descarga de guías, consulta de saldo y listado de envíos restringidos al administrador.
- Cabeceras contra clickjacking, MIME sniffing, iframes, abuso de permisos y exposición del framework.
- Rutas cron protegidas con `CRON_SECRET` y rutas administrativas con token de usuario más correo autorizado.

El limitador incluido es una defensa por instancia. En Vercel debe complementarse con WAF Rate Limiting para tener contadores globales en la capa de red.

## Despliegue gradual del WAF

1. Crear reglas para `POST /api/auth/*`, `POST /api/checkout/*`, `POST /api/preorders` y `POST /api/enviatodo/rates` con acción **Log**.
2. Revisar durante al menos 24 horas que no coincidan compradores reales, Clip ni tareas cron.
3. Probar la acción **Rate Limit** primero en Preview.
4. Publicar en Production solo después de validar tráfico y checkout.

Vercel incluye mitigación DDoS automática. Attack Mode debe reservarse para un ataque activo porque también desafía a visitantes legítimos.

## Respuesta a incidentes

- No desactivar las mitigaciones automáticas de Vercel.
- Rotar inmediatamente credenciales si una clave aparece en logs o código.
- Revisar Firewall Traffic, logs de funciones, intentos 401/429 y consumo de Supabase/Clip/EnviaTodo.
- Ante abuso sostenido, activar Attack Mode manualmente y limitar temporalmente los endpoints afectados.
