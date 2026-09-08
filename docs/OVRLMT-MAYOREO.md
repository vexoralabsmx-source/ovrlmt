# Administración y mayoreo por modelo

## Uso
1. Abre `/admin` con tu cuenta administradora y entra en **Mayoreo**.
2. Elige un modelo, un mínimo de 2 a 500 piezas y una rebaja en pesos por pieza o porcentaje.
3. Revisa la vista previa. Marca **Activar este escalón al guardar** para publicarlo; desmarcado queda pausado.
4. Puedes editar, pausar, reactivar y eliminar escalones. No se admiten mínimos repetidos para un mismo modelo.

Las tallas del mismo modelo se suman (3 M + 3 G alcanzan un mínimo de 6). Distintos modelos no se combinan. Se usa el escalón elegible que más ahorra, sin acumularlos. Un cupón y mayoreo tampoco se acumulan: gana el descuento mayor. El envío se calcula después del descuento.

## Instalación pendiente en Supabase
Ejecutar una sola vez `supabase/migrations/20260908_wholesale_rules.sql` en el SQL Editor del proyecto. Crea una tabla vacía con RLS y acceso exclusivo del servidor mediante service_role. No cambia productos, pedidos ni precios existentes. No se activan promociones automáticamente.

El entorno no tiene conexión SQL ni token de gestión para aplicar migraciones. Hasta instalar la tabla, el panel informa que falta la configuración y el checkout mantiene los precios normales. Otros errores al consultar precios detienen el cobro para evitar ignorar un descuento existente.

## Cambios
- Panel: encabezado compacto, navegación adaptable, métricas legibles, filtros accesibles y recuperación de errores de carga.
- Mayoreo: edición y vista previa, validación de reglas en servidor, lectura pública de escalones activos.
- Tienda: escalones en la ficha; cantidades de hasta 500 por talla en prendas sobre pedido; inventario limitado sigue validándose antes de comprar.
- Carrito y checkout: ahorro separado; cálculos idénticos para Clip y transferencia; snapshot del escalón y ahorro por línea en `preorders.items`. El descuento total usa `discount_mxn`; `discount_code` queda reservado para cupones reales.
- No se modificó el endpoint administrativo de pedidos que ya tenía cambios del usuario.

## Verificación
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
Pruebas cubren mínimos, suma entre tallas, separación de modelos, escalones, porcentaje, reglas pausadas, límites, cupón frente a mayoreo y payload de pedidos calculado en servidor. Los tests interceptan la persistencia: no crean pedidos, pagos ni correos.

Checklist después de instalar la tabla: crear escalón pausado; editar y activar; recargar tienda; sumar tallas hasta el mínimo; bajar una pieza y comprobar que desaparece; probar otro modelo; probar cupón; pausar y recargar; comprobar persistencia al volver a abrir admin. No es necesario pagar para revisar el resumen.

## Resultado de esta sesión
Build y TypeScript correctos; lint sin errores (3 advertencias anteriores ajenas a mayoreo); 16 tests correctos. Panel revisado en 1440×1000 y 390×844 sin desbordamiento. Prueba visual con datos interceptados: 3 M + 3 G de $359, descuento $180, total $1,974. API real de admin sin sesión devuelve 401. Tabla ausente confirmada por PGRST205; lectura pública real devuelve reglas vacías. Se retiraron todos los datos y respuestas simulados al terminar. No se publicó ni se hicieron pedidos, pagos o envíos de correo.
