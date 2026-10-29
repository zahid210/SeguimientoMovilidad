import pool from '../config/db.js';

// GET: Obtener el historial de monitoreo de una movilidad específica
export const obtenerMonitoreos = async (req, res) => {
    try {
        const { movilidad_id } = req.params;
        const [filas] = await pool.query(
            'SELECT * FROM monitoreos WHERE movilidad_id = ? ORDER BY fecha_registro DESC',
            [movilidad_id]
        );
        res.json({ exito: true, datos: filas });
    } catch (error) {
        console.error('Error al obtener monitoreos:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// POST: Registrar un nuevo reporte de monitoreo
export const crearMonitoreo = async (req, res) => {
    try {
        const { movilidad_id, fecha_registro, observaciones, estado_estudiante } = req.body;

        // Validación básica
        if (!movilidad_id || !fecha_registro) {
            return res.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios (movilidad_id, fecha_registro).' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO monitoreos (movilidad_id, fecha_registro, observaciones, estado_estudiante) 
            VALUES (?, ?, ?, ?)`,
            [movilidad_id, fecha_registro, observaciones, estado_estudiante || 'Sin novedades']
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Reporte de monitoreo registrado correctamente.',
            id_insertado: resultado.insertId
        });
    } catch (error) {
        console.error('Error al registrar monitoreo:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al registrar el monitoreo.' });
    }
};