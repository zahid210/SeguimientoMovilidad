# Frontend · SeguimientoMovilidad

SPA en React 19 + Vite + Tailwind CSS 4 + shadcn/ui para el seguimiento de la movilidad estudiantil de la UNCP.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
npm run preview
```

## Configuración

La URL de la API se toma de `VITE_API_URL` (por defecto `http://localhost:3000/api`):

```bash
cp .env.example .env
```

## Páginas

- `/` — Panel general con indicadores y alertas de monitoreo.
- `/estudiantes` — Padrón, alta y edición de estudiantes.
- `/movilidades` — Registro, filtros y exportación de movilidades.
- `/movilidades/:id` — Expediente con checklist de 14 documentos y monitoreo quincenal.
- `/reportes` — Indicadores por estado, país, facultad y pendientes.

La guía completa del sistema está en el `README.md` de la raíz del repositorio.
