import pool from '../config/db.js';

export const subirDocumento = async (req, res) => {
    try {
        const { movilidad_id, tipo_documento } = req.body;

        if (!movilidad_id || !tipo_documento) {
            return res.status(400).json({ exito: false, mensaje: 'Faltan datos obligatorios (movilidad_id o tipo_documento).' });
        }

        if (!req.file) {
            return res.status(400).json({ exito: false, mensaje: 'No se adjuntó ningún archivo PDF.' });
        }

        // La ruta que guardaremos en la BD (normalizamos las barras invertidas de Windows a barras normales)
        const ruta_archivo = `/${req.file.path.replace(/\\/g, '/')}`;

        // Insertamos o actualizamos si el documento ya existía para ese viaje
        const query = `
            INSERT INTO documentos (movilidad_id, tipo_documento, estado_entrega, ruta_archivo)
            VALUES (?, ?, 'Entregado', ?)
            ON DUPLICATE KEY UPDATE estado_entrega = 'Entregado', ruta_archivo = VALUES(ruta_archivo)
        `;

        await pool.query(query, [movilidad_id, tipo_documento, ruta_archivo]);

        res.status(201).json({
            exito: true,
            mensaje: 'Documento subido y registrado correctamente.',
            ruta: ruta_archivo
        });

    } catch (error) {
        console.error('Error al subir documento:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno al procesar el documento.' });
    }
};

export const obtenerDocumentosPorMovilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const [filas] = await pool.query('SELECT * FROM documentos WHERE movilidad_id = ?', [id]);
        res.json({ exito: true, datos: filas });
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};