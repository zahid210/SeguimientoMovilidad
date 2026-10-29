# SeguimientoMovilidad

Sistema web para el seguimiento de la movilidad estudiantil de la UNCP. Permite registrar estudiantes, sus movilidades nacionales/internacionales, los documentos del expediente (PDF) y los reportes de monitoreo quincenal.

## Estructura del proyecto

```
SeguimientoMovilidad/
├── backend/                  # API REST con Node.js + Express + MySQL
│   ├── server.js             # Punto de entrada del servidor
│   ├── .env.example          # Plantilla de variables de entorno
│   └── src/
│       ├── config/           # Conexión a MySQL (pool)
│       ├── controllers/      # Lógica de negocio
│       ├── middlewares/      # Subida de archivos (Multer)
│       └── routes/           # Definición de endpoints
└── frontend/                 # SPA con React 19 + Vite + Tailwind + shadcn/ui
    └── src/
        ├── components/       # Layout y componentes de UI
        ├── lib/              # Cliente Axios y utilidades
        └── pages/            # Estudiantes, Movilidades y Expediente
```

## Requisitos

- Node.js 20 o superior
- MySQL 8 (base de datos `uncp_movilidad`)

## Configuración del backend

```bash
cd backend
npm install
cp .env.example .env   # En Windows: copy .env.example .env
```

Edita `backend/.env` con tus credenciales de MySQL y luego inicia el servidor:

```bash
npm run dev    # con nodemon
# o
npm start
```

El servidor queda disponible en `http://localhost:3000`.

## Configuración del frontend

```bash
cd frontend
npm install
npm run dev
```

Vite levanta la aplicación en `http://localhost:5173` y consume la API en `http://localhost:3000/api`.

## Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/status` | Estado del servidor |
| GET / POST | `/api/estudiantes` | Listar / registrar estudiantes |
| GET / POST | `/api/movilidades` | Listar / registrar movilidades |
| GET | `/api/documentos/:id` | Documentos de una movilidad |
| POST | `/api/documentos` | Subir PDF del expediente (`multipart/form-data`) |
| GET | `/api/monitoreos/:movilidad_id` | Historial de monitoreo |
| POST | `/api/monitoreos` | Registrar reporte de monitoreo |
| GET | `/uploads/...` | Archivos PDF subidos |

## Notas

- Los archivos subidos se guardan en `backend/uploads/` y no se versionan en Git.
- Las credenciales viven en `backend/.env`, que está ignorado por Git. Usa `backend/.env.example` como referencia.
