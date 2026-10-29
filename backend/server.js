import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/db.js';
import { UPLOADS_DIR } from './src/config/paths.js';
import estudiantesRoutes from './src/routes/estudiantes.routes.js';
import movilidadesRoutes from './src/routes/movilidades.routes.js';
import documentosRoutes from './src/routes/documentos.routes.js';
import monitoreosRoutes from './src/routes/monitoreos.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Estado real del servidor y de la base de datos
app.get('/api/status', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            estado: 'OK',
            mensaje: 'Servidor backend : OK',
            base_datos: 'OK'
        });
    } catch (error) {
        res.status(503).json({
            estado: 'ERROR',
            mensaje: 'Servidor activo, pero sin conexión a la base de datos.',
            base_datos: 'ERROR'
        });
    }
});

app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/movilidades', movilidadesRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/monitoreos', monitoreosRoutes);

// Archivos PDF subidos
app.use('/uploads', express.static(UPLOADS_DIR));

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada.' });
});

// Manejador central de errores (incluye errores de Multer)
app.use((error, req, res, next) => {
    console.error('Error no controlado:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            exito: false,
            mensaje: 'El archivo supera el límite de 20 MB.'
        });
    }

    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            exito: false,
            mensaje: 'Solo se permite subir un archivo PDF a la vez.'
        });
    }

    if (error.message?.includes('Solo se permiten archivos PDF')) {
        return res.status(400).json({
            exito: false,
            mensaje: 'Formato no válido. Solo se permiten archivos PDF.'
        });
    }

    res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor.'
    });
});

const servidor = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Archivos PDF en: ${UPLOADS_DIR}`);
});

process.on('SIGINT', async () => {
    await pool.end();
    servidor.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
    await pool.end();
    servidor.close(() => process.exit(0));
});
