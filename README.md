# OVRLMT — Built After Dark

Experiencia multipágina para el lanzamiento de OVRLMT / DROP 001.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Producción

```bash
npm run typecheck
npm run build
npm start
```

## Edición rápida

- Productos, precios y estados: `data/products.ts`
- Paleta, layout y responsive: `app/globals.css`
- Número de WhatsApp: `components/PreorderForm.tsx`
- Navegación: `components/Header.tsx`
- Escena 3D: `components/Scene.tsx`

La escena WebGL se carga dinámicamente y limita el DPR para reducir el coste en pantallas móviles. El formulario abre WhatsApp con un mensaje prellenado; no requiere backend.
# ovrlmt
