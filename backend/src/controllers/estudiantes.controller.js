import pool from '../config/db.js';
import { texto, requerido, correoValido } from '../utils/validacion.js';

const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const CAMPOS_OBLIGATORIOS = [
    'dni',
    'codigo_estudiante',
    'semestre',
    'nombres',
    'apellido_paterno',
    'apellido_materno',
    'correo_personal',
    'correo_institucional'
];

function normalizar(body) {
    return {
        dni: texto(body.dni),
        codigo_estudiante: texto(body.codigo_estudiante),
        semestre: texto(body.semestre),
        nombres: texto(body.nombres),
        apellido_paterno: texto(body.apellido_paterno),
        apellido_materno: texto(body.apellido_materno),
        correo_personal: texto(body.correo_personal),
        correo_institucional: texto(body.correo_institucional),
        telefono_whatsapp: texto(body.telefono_whatsapp) || null,
        contacto_emergencia: texto(body.contacto_emergencia) || null
    };
}

function validar(datos) {
    const faltantes = CAMPOS_OBLIGATORIOS.filter((campo) => !requerido(datos[campo]));

    if (faltantes.length > 0) {
        return `Faltan campos obligatorios: ${faltantes.join(', ')}.`;
    }

    if (!/^\d{8}$/.test(datos.dni)) {
        return 'El DNI debe tener exactamente 8 dígitos.';
    }

    if (!SEMESTRES.includes(datos.semestre)) {
        return 'El semestre del estudiante debe estar entre 1.º y 10.º.';
    }

    if (!correoValido(datos.correo_personal)) {
        return 'El correo personal no tiene un formato válido.';
    }

    if (!correoValido(datos.correo_institucional)) {
        return 'El correo institucional no tiene un formato válido.';
    }

    return null;
}

// GET: listado con el estado de su movilidad
export const obtenerEstudiantes = async (req, res) => {
    try {
        const [filas] = await pool.query(`
            SELECT
                e.*,
                m.id AS movilidad_id,
                m.estado,
                m.pais_destino,
                m.universidad_destino,
                m.fecha_salida,
                m.fecha_retorno,
                (SELECT COUNT(*) FROM documentos d WHERE d.movilidad_id = m.id) AS documentos_total,
                (SELECT COUNT(*) FROM documentos d WHERE d.movilidad_id = m.id AND d.estado_entrega = 'Entregado') AS documentos_entregados
            FROM estudiantes e
            LEFT JOIN movilidades m ON m.estudiante_id = e.id
            ORDER BY e.apellido_paterno, e.apellido_materno, e.nombres
        `);

        const datos = filas.map((fila) => ({
            ...fila,
            expediente_completo: Number(fila.documentos_total) > 0
                && Number(fila.documentos_entregados) === Number(fila.documentos_total)
        }));

        res.json({ exito: true, datos });
    } catch (error) {
        console.error('Error al consultar estudiantes:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al consultar la base de datos.' });
    }
};

// GET: un estudiante con su movilidad
export const obtenerEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const [filas] = await pool.query(
            `SELECT e.*, m.id AS movilidad_id, m.estado, m.pais_destino, m.universidad_destino
             FROM estudiantes e
             LEFT JOIN movilidades m ON m.estudiante_id = e.id
             WHERE e.id = ?`,
            [id]
        );

        if (filas.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }

        res.json({ exito: true, datos: filas[0] });
    } catch (error) {
        console.error('Error al consultar estudiante:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// POST: registrar estudiante
export const crearEstudiante = async (req, res) => {
    try {
        const datos = normalizar(req.body);
        const errorValidacion = validar(datos);

        if (errorValidacion) {
            return res.status(400).json({ exito: false, mensaje: errorValidacion });
        }

        const [resultado] = await pool.query(
            `INSERT INTO estudiantes
                (dni, codigo_estudiante, semestre, nombres, apellido_paterno, apellido_materno,
                 correo_personal, correo_institucional, telefono_whatsapp, contacto_emergencia)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                datos.dni,
                datos.codigo_estudiante,
                datos.semestre,
                datos.nombres,
                datos.apellido_paterno,
                datos.apellido_materno,
                datos.correo_personal,
                datos.correo_institucional,
                datos.telefono_whatsapp,
                datos.contacto_emergencia
            ]
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Estudiante registrado correctamente.',
            id_insertado: resultado.insertId
        });
    } catch (error) {
        console.error('Error al registrar estudiante:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                exito: false,
                mensaje: 'El DNI o el código de estudiante ya se encuentra registrado.'
            });
        }

        res.status(500).json({ exito: false, mensaje: 'Error interno al registrar el estudiante.' });
    }
};

// PUT: actualizar datos del estudiante
export const actualizarEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const datos = normalizar(req.body);
        const errorValidacion = validar(datos);

        if (errorValidacion) {
            return res.status(400).json({ exito: false, mensaje: errorValidacion });
        }

        const [resultado] = await pool.query(
            `UPDATE estudiantes SET
                dni = ?, codigo_estudiante = ?, semestre = ?, nombres = ?, apellido_paterno = ?,
                apellido_materno = ?, correo_personal = ?, correo_institucional = ?,
                telefono_whatsapp = ?, contacto_emergencia = ?
             WHERE id = ?`,
            [
                datos.dni,
                datos.codigo_estudiante,
                datos.semestre,
                datos.nombres,
                datos.apellido_paterno,
                datos.apellido_materno,
                datos.correo_personal,
                datos.correo_institucional,
                datos.telefono_whatsapp,
                datos.contacto_emergencia,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }

        res.json({ exito: true, mensaje: 'Estudiante actualizado correctamente.' });
    } catch (error) {
        console.error('Error al actualizar estudiante:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                exito: false,
                mensaje: 'El DNI o el código de estudiante ya pertenece a otro registro.'
            });
        }

        res.status(500).json({ exito: false, mensaje: 'Error interno al actualizar el estudiante.' });
    }
};

// DELETE: eliminar estudiante (y su movilidad/documentos en cascada)
export const eliminarEstudiante = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query('DELETE FROM estudiantes WHERE id = ?', [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Estudiante no encontrado.' });
        }

        res.json({ exito: true, mensaje: 'Estudiante eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar estudiante:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno al eliminar el estudiante.' });
    }
};
