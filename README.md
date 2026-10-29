# SeguimientoMovilidad

Sistema local para el seguimiento de la movilidad estudiantil de la UNCP. Reemplaza el control en Excel: registra estudiantes, su única movilidad internacional, el checklist completo de 14 documentos del expediente y el monitoreo quincenal.

No requiere autenticación ni despliegue en producción: está pensado para ejecutarse en la computadora de trabajo de Annet.

## Funcionalidad

- **Estudiantes**: DNI, código, semestre (del 1.º al 10.º), nombres, correos personales e institucionales, WhatsApp y contacto de emergencia.
- **Una movilidad por estudiante** (restricción `UNIQUE` en la base de datos).
- **Datos de la movilidad**: facultad y escuela de origen, universidad/facultad de destino, país y ciudad, fechas de salida y retorno, dirección exacta de residencia en el extranjero, `POSTULADO` (SÍ/NO), estado y observaciones.
- **Checklist de 14 documentos**, creado automáticamente al registrar la movilidad:
  1. Expediente físico
  2. Pre-equivalencia
  3. Carta de aceptación
  4. Notificado a la facultad
  5. Notificado al estudiante
  6. Firma de carta de compromiso de padres
  7. Seguro médico
  8. Seguro psicológico
  9. Resolución de autorización de facultad
  10. Constancia de inducción
  11. Visa
  12. Certificado de estudios
  13. Equivalencia de notas
  14. Comunicado a la facultad
- Cada documento se marca como **Entregado** al adjuntar su PDF (máximo 20 MB) y puede reemplazarse o quitarse.
- **Expediente completo** se calcula: SÍ cuando los 14 documentos están entregados.
- **Monitoreo cada 15 días**: se registra fecha, estado del estudiante, medio de contacto, responsable y observaciones. El sistema calcula la próxima fecha y marca los monitoreos vencidos.
- **Panel general** con alertas de monitoreo, expedientes por completar y distribución por estado/país.
- **Reportes** por estado, país, facultad de origen, expedientes incompletos y monitoreos vencidos.
- **Exportación CSV** compatible con Excel (UTF-8 con BOM, separador `;`), con el orden de columnas del control original (incluido el semestre del estudiante) más estado y seguimiento.

## Estructura

```
SeguimientoMovilidad/
├── database/
│   └── schema.sql              # Esquema completo (recrea las tablas)
├── backend/                    # API REST: Node.js + Express + MariaDB/MySQL
│   ├── server.js
│   ├── scripts/init-db.mjs     # Crea/recrea el esquema
│   └── src/
│       ├── config/             # Conexión y rutas de archivos
│       ├── controllers/
│       ├── middlewares/        # Multer (PDF, 20 MB)
│       ├── routes/
│       └── utils/              # Fechas y cálculo de seguimiento
└── frontend/                   # SPA: React 19 + Vite + Tailwind + shadcn/ui
    └── src/
        ├── components/
        ├── lib/                # Axios, fechas y catálogos
        └── pages/              # Panel, Estudiantes, Movilidades, Expediente, Reportes
```

## Requisitos

- Node.js 20 o superior
- MariaDB 11 / MySQL 8
- Base de datos creada (por ejemplo `uncp_movilidad`)

## Puesta en marcha

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # En Windows: copy .env.example .env
```

Edita `backend/.env`:

```
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_clave
DB_NAME=uncp_movilidad
PORT=3000
```

Crea las tablas y carga los 14 tipos de documento:

```bash
npm run db:init
```

> `db:init` se niega a borrar datos existentes. Si realmente quieres reiniciar todo, usa `npm run db:init -- --force`.

Inicia el servidor:

```bash
npm run dev   # nodemon
# o
npm start
```

La API queda en `http://localhost:3000`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env     # opcional, la URL por defecto es http://localhost:3000/api
npm run dev
```

Vite abre la aplicación en `http://localhost:5173`. Si el backend usa otro puerto, ajusta `VITE_API_URL` en `frontend/.env`.

## Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/status` | Estado del servidor y la base |
| GET / POST | `/api/estudiantes` | Listar / registrar estudiantes |
| GET / PUT | `/api/estudiantes/:id` | Consultar / actualizar estudiante |
| GET / POST | `/api/movilidades` | Listar / registrar movilidad (crea el checklist) |
| GET / PATCH / DELETE | `/api/movilidades/:id` | Consultar / actualizar / eliminar movilidad |
| GET | `/api/movilidades/export` | Exportar CSV compatible con Excel |
| GET | `/api/documentos/:movilidad_id` | Checklist completo con estados |
| POST | `/api/documentos` | Subir/reemplazar PDF (`multipart/form-data`) |
| DELETE | `/api/documentos/:movilidad_id/:tipo` | Quitar documento y dejarlo pendiente |
| GET | `/api/monitoreos/:movilidad_id` | Historial + próximo monitoreo calculado |
| POST | `/api/monitoreos` | Registrar monitoreo quincenal |
| DELETE | `/api/monitoreos/:movilidad_id/:id` | Eliminar monitoreo |
| GET | `/uploads/...` | PDFs subidos |

## Reglas de negocio

- Un estudiante solo puede tener una movilidad. El intento de duplicarla responde `409`.
- Los documentos solo tienen dos estados: `Pendiente` y `Entregado`. No existe "No aplica".
- `POSTULADO`, `Expediente completo`, cada documento y la visa se manejan como SÍ/NO.
- El expediente se calcula automáticamente; no es un documento que se suba aparte.
- Primer monitoreo: 15 días después de la fecha de salida. Los siguientes: 15 días después del último monitoreo.
- Movilidades en estado `Retornado`, `Cerrado` o `Cancelado` no generan alertas de monitoreo.
- Los PDFs se validan por contenido (`%PDF-`) y se guardan en `backend/uploads/<año>/<DNI>/`.

## Datos y respaldos

- Los PDFs viven en `backend/uploads/` (ignorado por Git).
- Las credenciales viven en `backend/.env` (ignorado por Git).
- Para respaldar, copia la base de datos y la carpeta `backend/uploads/`.

## Verificación

```bash
# Backend: sintaxis
cd backend && node --check server.js

# Frontend: lint y compilación
cd frontend && npm run lint && npm run build
```
