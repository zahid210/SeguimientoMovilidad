import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/db.js';
import estudiantesRoutes from './src/routes/estudiantes.routes.js';
import movilidadesRoutes from "./src/routes/movilidades.routes.js";
import documentosRoutes from "./src/routes/documentos.routes.js";
import monitoreosRoutes from "./src/routes/monitoreos.routes.js";

// Inicia variables de entorno
dotenv.config();

// Crea la aplicacion Expres
const app = express();
const PORT = process.env.PORT || 3000;

// Middlawares
app.use(cors()); // Comunicacion con el frontend
app.use(express.json()); // Traduce las peticiones que llegan al servidor a formato JSON

// Ruta de estado
app.get('/api/status', (req,res) => {
    res.json({
        estado: 'OK',
        mensaje: 'Servidor backend : OK'
    });
});

app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/movilidades', movilidadesRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/monitoreos', monitoreosRoutes);

app.use('/uploads', express.static('uploads'));

// Encender servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


