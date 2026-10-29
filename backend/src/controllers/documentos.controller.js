import fs from 'fs/promises';
import path from 'path';
import pool from '../config/db.js';
import { UPLOADS_DIR, BACKEND_DIR, rutaPublica } from '../config/paths.js';
import { enteroPositivo, requerido, texto } from '../utils/validacion.js';
import { hoyISO } from '../utils/fechas.js';

function errorHttp(mensaje, status = 400) {
    return Object.assign(new Error(mensaje), { status });
}

async function eliminarArchivoPublico(rutaArchivo) {
    if (!rutaArchivo) return;

    const relativa = rutaArchivo.replace(/^\/+/, '');
    const absoluta = path.resolve(BACKEND_DIR, relativa);

    if (!absoluta.startsWith(UPLOADS_DIR + path.sep)) return;

    try {
        await fs.unlink(absoluta);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('No se pudo eliminar el archivo anterior:', error.message);
        }
    }
}

async function validarPdf(rutaArchivo) {
    const manejador = await fs.open(rutaArchivo, 'r');

    try {
        const buffer = Buffer.alloc(5);
        await manejador.read(buffer, 0, 5, 0);

        if (buffer.toString() !== '%PDF-') {
            throw errorHttp('El archivo no es un PDF válido.', 400);
        }
    } finally {
        await manejador.close();
    }
}

async function eliminarTemporal(rutaArchivo) {
    if (!rutaArchivo) return;

    try {
        await fs.unlink(rutaArchivo);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('No se pudo eliminar el archivo temporal:', error.message);
        }
    }
}

// GET: checklist completo de una movilidad
export const obtenerDocumentosPorMovilidad = async (req, res) => {
    try {
        const { movilidad_id } = req.params;

        if (!enteroPositivo(movilidad_id)) {
            return res.status(400).json({ exito: false, mensaje: 'La movilidad no es válida.' });
        }

        const [movilidades] = await pool.query('SELECT id FROM movilidades WHERE id = ?', [movilidad_id]);

        if (movilidades.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Movilidad no encontrada.' });
        }

        const [filas] = await pool.query(
            `SELECT
                t.codigo AS tipo_documento,
                t.nombre,
                t.orden,
                COALESCE(d.estado_entrega, 'Pendiente') AS estado_entrega,
                d.ruta_archivo,
                d.fecha_entrega,
                d.observacion
             FROM tipos_documento t
             LEFT JOIN documentos d
                ON d.tipo_documento = t.codigo AND d.movilidad_id = ?
             ORDER BY t.orden`,
            [movilidad_id]
        );

        const entregados = filas.filter((fila) => fila.estado_entrega === 'Entregado').length;

        res.json({
            exito: true,
            datos: filas,
            resumen: {
                total: filas.length,
                entregados,
                pendientes: filas.length - entregados,
                completo: entregados === filas.length && filas.length > 0
            }
        });
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// POST: subir/reemplazar un PDF del checklist
export const subirDocumento = async (req, res) => {
    const rutaTemporal = req.file?.path;

    try {
        const { movilidad_id, tipo_documento, observacion } = req.body;

        if (!req.file) {
            throw errorHttp('No se adjuntó ningún archivo PDF.', 400);
        }

        if (!enteroPositivo(movilidad_id) || !requerido(tipo_documento)) {
            throw errorHttp('Faltan datos obligatorios (movilidad_id o tipo_documento).', 400);
        }

        const [movilidades] = await pool.query(
            `SELECT m.id, m.fecha_salida, e.dni
             FROM movilidades m
             INNER JOIN estudiantes e ON e.id = m.estudiante_id
             WHERE m.id = ?`,
            [movilidad_id]
        );

        if (movilidades.length === 0) {
            throw errorHttp('Movilidad no encontrada.', 404);
        }

        const [tipos] = await pool.query(
            'SELECT codigo FROM tipos_documento WHERE codigo = ?',
            [tipo_documento]
        );

        if (tipos.length === 0) {
            throw errorHttp('El tipo de documento no es válido.', 400);
        }

        await validarPdf(rutaTemporal);

        const movilidad = movilidades[0];
        const anio = String(movilidad.fecha_salida).slice(0, 4);
        const carpetaDestino = path.join(UPLOADS_DIR, anio, movilidad.dni);
        const nombreArchivo = `${tipo_documento}-${Date.now()}.pdf`;
        const rutaDestino = path.join(carpetaDestino, nombreArchivo);

        await fs.mkdir(carpetaDestino, { recursive: true });
        await fs.rename(rutaTemporal, rutaDestino);

        const rutaPublicaArchivo = rutaPublica(rutaDestino);
        const fechaEntrega = hoyISO();
        const nota = texto(observacion) || null;

        const [anteriores] = await pool.query(
            `SELECT ruta_archivo FROM documentos
             WHERE movilidad_id = ? AND tipo_documento = ?`,
            [movilidad_id, tipo_documento]
        );

        let actualizados;
        try {
            [actualizados] = await pool.query(
                `UPDATE documentos
                 SET estado_entrega = 'Entregado',
                     ruta_archivo = ?,
                     fecha_entrega = ?,
                     observacion = ?
                 WHERE movilidad_id = ? AND tipo_documento = ?`,
                [rutaPublicaArchivo, fechaEntrega, nota, movilidad_id, tipo_documento]
            );

            if (actualizados.affectedRows === 0) {
                await pool.query(
                    `INSERT INTO documentos
                        (movilidad_id, tipo_documento, estado_entrega, ruta_archivo, fecha_entrega, observacion)
                     VALUES (?, ?, 'Entregado', ?, ?, ?)`,
                    [movilidad_id, tipo_documento, rutaPublicaArchivo, fechaEntrega, nota]
                );
            }
        } catch (error) {
            await eliminarArchivoPublico(rutaPublicaArchivo);
            throw error;
        }

        await eliminarArchivoPublico(anteriores[0]?.ruta_archivo);

        res.status(201).json({
            exito: true,
            mensaje: 'Documento subido correctamente.',
            ruta: rutaPublicaArchivo
        });
    } catch (error) {
        await eliminarTemporal(rutaTemporal);
        console.error('Error al subir documento:', error);
        res.status(error.status || 500).json({
            exito: false,
            mensaje: error.status ? error.message : 'Error interno al procesar el documento.'
        });
    }
};

// DELETE: quitar un documento y dejarlo pendiente
export const resetDocumento = async (req, res) => {
    try {
        const { movilidad_id, tipo_documento } = req.params;

        if (!enteroPositivo(movilidad_id) || !requerido(tipo_documento)) {
            return res.status(400).json({ exito: false, mensaje: 'Datos no válidos.' });
        }

        const [filas] = await pool.query(
            `SELECT ruta_archivo FROM documentos
             WHERE movilidad_id = ? AND tipo_documento = ?`,
            [movilidad_id, tipo_documento]
        );

        if (filas.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Documento no encontrado.' });
        }

        await pool.query(
            `UPDATE documentos
             SET estado_entrega = 'Pendiente',
                 ruta_archivo = NULL,
                 fecha_entrega = NULL,
                 observacion = NULL
             WHERE movilidad_id = ? AND tipo_documento = ?`,
            [movilidad_id, tipo_documento]
        );

        await eliminarArchivoPublico(filas[0].ruta_archivo);

        res.json({ exito: true, mensaje: 'Documento eliminado. Quedó en estado Pendiente.' });
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno al eliminar el documento.' });
    }
};
