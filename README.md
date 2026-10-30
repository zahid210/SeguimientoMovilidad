# SeguimientoMovilidad

Sistema de gestión local para el seguimiento de la movilidad estudiantil internacional en la UNCP. Consolida en una sola pantalla interactiva el registro de estudiantes, su movilidad, el checklist de 14 documentos en formato PDF y el monitoreo quincenal.

---

## Características Principales

- **Vista Única Integrada**: Panel sincronizado donde cada fila agrupa los datos del estudiante/destino a la izquierda y sus 14 documentos en scroll horizontal a la derecha.
- **Auto-inicialización con Sequelize ORM**: Crea automáticamente la base de datos `uncp_movilidad`, sincroniza las tablas y precarga el catálogo oficial de 14 documentos al iniciar el servidor (sin ejecutar scripts SQL manuales).
- **Gestión de Documentos PDF**:
  - Subida directa (clic o arrastrar y soltar archivo PDF, máx. 20 MB).
  - **Reemplazo inmediato**: al pasar el cursor sobre cualquier documento adjuntado, se habilita el botón de recarga (`↻`) para sustituir el PDF por uno nuevo sin pasos extra, así como el botón de quitar (`×`) para devolverlo a estado pendiente.
- **Monitoreo Quincenal**: Registro independiente de seguimiento cada 15 días con cálculo automático de vencimientos.
- **Centro de Alertas**: Notificaciones con acceso directo a expedientes incompletos y monitoreos vencidos.
- **Exportación a Excel**: Descarga de reporte en formato CSV compatible con Microsoft Excel (UTF-8 con BOM y separador `;`).

---

## Requisitos Previos

- **Node.js** v20 o superior
- **MySQL** 8 o **MariaDB** 11 instalado y en ejecución en localhost

---

## Despliegue Local (Paso a Paso)

### 1. Configurar y arrancar el Backend

Abre una terminal en la raíz del proyecto:

```bash
cd backend
npm install
```

Copia el archivo de variables de entorno:

```bash
# En Windows (CMD):
copy .env.example .env

# En Linux / macOS / PowerShell:
cp .env.example .env
```

Edita el archivo `backend/.env` con las credenciales de tu MySQL local:

```env
PORT=3200
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_clave_de_mysql
DB_NAME=uncp_movilidad
```

Inicia el backend:

```bash
npm run dev
# o para producción:
npm start
```

> **Nota**: El backend creará automáticamente la base de datos `uncp_movilidad` si no existe, sincronizará todas las tablas y precargará los 14 documentos oficiales. El servidor quedará disponible en `http://localhost:3200`.

---

### 2. Configurar y arrancar el Frontend

En una segunda terminal, dirígete a la carpeta `frontend`:

```bash
cd frontend
npm install
```

*(Opcional)* Si el backend corre en un puerto diferente al `3200`, configura `frontend/.env`:

```env
VITE_API_URL=http://localhost:3200/api
```

Inicia la interfaz gráfica:

```bash
npm run dev
```

Abre tu navegador en:

```
http://localhost:5173
```

---

## Catálogo de 14 Documentos del Checklist

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

---

## Respaldos y Archivos Subidos

- Los PDFs adjuntados se almacenan localmente en `backend/uploads/<año>/<DNI>/`.
- Para respaldar el sistema completo basta con copiar la base de datos MySQL y la carpeta `backend/uploads/`.
