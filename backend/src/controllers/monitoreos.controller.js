import pool from '../config/db.js';
import { enteroPositivo, requerido, texto } from '../utils/validacion.js';
import { fechaValida, sumarDias } from '../utils/fechas.js';
import { calcularSeguimiento, DIAS_QUINCENA } from '../utils/seguimiento.js';

const ESTADOS = ['Sin novedades', 'Requiere atención', 'Emergencia'];

// GET: historial + próximo monitoreo de una movilidad
export const obtenerMonitoreos = async (req, res) => {
    try {
        const { movilidad_id } = req.params;

        if (!enteroPositivo(movilidad_id)) {
            return res.status(400).json({ exito: false, mensaje: 'La movilidad no es válida.' });
        }

        const [movilidades] = await pool.query(
            'SELECT id, fecha_salida, fecha_retorno, estado FROM movilidades WHERE id = ?',
            [movilidad_id]
        );

        if (movilidades.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Movilidad no encontrada.' });
        }

        const [filas] = await pool.query(
            `SELECT * FROM monitoreos
             WHERE movilidad_id = ?
             ORDER BY fecha_registro DESC, id DESC`,
            [movilidad_id]
        );

        const movilidad = movilidades[0];
        const resumen = calcularSeguimiento(movilidad, filas[0]?.fecha_registro || null, filas.length);

        res.json({ exito: true, datos: filas, resumen });
    } catch (error) {
        console.error('Error al obtener monitoreos:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// POST: registrar un monitoreo quincenal
export const crearMonitoreo = async (req, res) => {
    try {
        const {
            movilidad_id,
            fecha_registro,
            estado_estudiante,
            observaciones,
            medio_contacto,
            responsable,
            proxima_fecha
        } = req.body;

        if (!enteroPositivo(movilidad_id) || !requerido(fecha_registro)) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Faltan campos obligatorios (movilidad_id, fecha_registro).'
            });
        }

        if (!fechaValida(texto(fecha_registro))) {
            return res.status(400).json({ exito: false, mensaje: 'La fecha del reporte no es válida.' });
        }

        const estado = texto(estado_estudiante) || 'Sin novedades';

        if (!ESTADOS.includes(estado)) {
            return res.status(400).json({ exito: false, mensaje: 'El estado del estudiante no es válido.' });
        }

        const [movilidades] = await pool.query('SELECT id FROM movilidades WHERE id = ?', [movilidad_id]);

        if (movilidades.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Movilidad no encontrada.' });
        }

        const fecha = texto(fecha_registro);
        const proxima = texto(proxima_fecha) || sumarDias(fecha, DIAS_QUINCENA);

        if (!fechaValida(proxima)) {
            return res.status(400).json({ exito: false, mensaje: 'La próxima fecha no es válida.' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO monitoreos
                (movilidad_id, fecha_registro, estado_estudiante, observaciones,
                 medio_contacto, responsable, proxima_fecha)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                movilidad_id,
                fecha,
                estado,
                texto(observaciones) || null,
                texto(medio_contacto) || null,
                texto(responsable) || null,
                proxima
            ]
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Monitoreo registrado correctamente.',
            id_insertado: resultado.insertId,
            proxima_fecha: proxima
        });
    } catch (error) {
        console.error('Error al registrar monitoreo:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al registrar el monitoreo.' });
    }
};

// DELETE: eliminar un monitoreo
export const eliminarMonitoreo = async (req, res) => {
    try {
        const { movilidad_id, id } = req.params;

        if (!enteroPositivo(movilidad_id) || !enteroPositivo(id)) {
            return res.status(400).json({ exito: false, mensaje: 'Datos no válidos.' });
        }

        const [resultado] = await pool.query(
            'DELETE FROM monitoreos WHERE id = ? AND movilidad_id = ?',
            [id, movilidad_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Monitoreo no encontrado.' });
        }

        res.json({ exito: true, mensaje: 'Monitoreo eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar monitoreo:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno al eliminar el monitoreo.' });
    }
};
