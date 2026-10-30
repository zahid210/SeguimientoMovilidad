import pool from '../config/db.js';
import { texto, requerido, enteroPositivo, aBooleano } from '../utils/validacion.js';
import { fechaValida, hoyISO } from '../utils/fechas.js';
import { calcularSeguimiento } from '../utils/seguimiento.js';

const ESTADOS = ['Postulando', 'Aceptado', 'En Extranjero', 'Retornado', 'Cerrado', 'Cancelado'];

const CAMPOS_OBLIGATORIOS = [
    'facultad_origen',
    'universidad_destino',
    'facultad_destino',
    'pais_destino',
    'ciudad_destino',
    'direccion_residencia',
    'fecha_salida',
    'fecha_retorno'
];

function normalizar(body) {
    return {
        estudiante_id: body.estudiante_id,
        facultad_origen: texto(body.facultad_origen),
        escuela_profesional: texto(body.escuela_profesional) || null,
        universidad_destino: texto(body.universidad_destino),
        facultad_destino: texto(body.facultad_destino),
        pais_destino: texto(body.pais_destino),
        ciudad_destino: texto(body.ciudad_destino),
        fecha_salida: texto(body.fecha_salida),
        fecha_retorno: texto(body.fecha_retorno),
        direccion_residencia: texto(body.direccion_residencia),
        postulado: aBooleano(body.postulado),
        estado: texto(body.estado) || 'Postulando',
        observaciones: texto(body.observaciones) || null
    };
}

function validar(datos) {
    const faltantes = CAMPOS_OBLIGATORIOS.filter((campo) => !requerido(datos[campo]));

    if (faltantes.length > 0) {
        return `Faltan campos obligatorios: ${faltantes.join(', ')}.`;
    }

    if (!fechaValida(datos.fecha_salida) || !fechaValida(datos.fecha_retorno)) {
        return 'Las fechas de salida y retorno no son válidas.';
    }

    if (datos.fecha_salida > datos.fecha_retorno) {
        return 'La fecha de salida no puede ser posterior a la fecha de retorno.';
    }

    if (!ESTADOS.includes(datos.estado)) {
        return 'El estado de la movilidad no es válido.';
    }

    return null;
}

function agregarResumen(fila) {
    const seguimiento = calcularSeguimiento(
        fila,
        fila.ultimo_monitoreo,
        Number(fila.monitoreos_realizados || 0)
    );

    return {
        ...fila,
        postulado: Boolean(fila.postulado),
        expediente_completo: Number(fila.documentos_total) > 0
            && Number(fila.documentos_entregados) === Number(fila.documentos_total),
        ...seguimiento
    };
}

const SELECT_MOVILIDADES = `
    SELECT
        m.*,
        e.dni,
        e.codigo_estudiante,
        e.semestre,
        e.nombres,
        e.apellido_paterno,
        e.apellido_materno,
        e.correo_personal,
        e.correo_institucional,
        e.telefono_whatsapp,
        e.contacto_emergencia,
        (SELECT COUNT(*) FROM documentos d WHERE d.movilidad_id = m.id) AS documentos_total,
        (SELECT COUNT(*) FROM documentos d WHERE d.movilidad_id = m.id AND d.estado_entrega = 'Entregado') AS documentos_entregados,
        (SELECT MAX(mo.fecha_registro) FROM monitoreos mo WHERE mo.movilidad_id = m.id) AS ultimo_monitoreo,
        (SELECT COUNT(*) FROM monitoreos mo WHERE mo.movilidad_id = m.id) AS monitoreos_realizados
    FROM movilidades m
    INNER JOIN estudiantes e ON e.id = m.estudiante_id
`;

// GET: todas las movilidades (incluye el checklist de 14 documentos por movilidad)
export const obtenerMovilidades = async (req, res) => {
    try {
        const [filas] = await pool.query(`${SELECT_MOVILIDADES} ORDER BY m.id ASC`);
        const [tipos] = await pool.query('SELECT codigo, nombre, orden FROM tipos_documento ORDER BY orden ASC');
        const [docs] = await pool.query('SELECT movilidad_id, tipo_documento, estado_entrega, ruta_archivo, fecha_entrega, observacion FROM documentos');

        const mapaDocs = new Map();
        for (const doc of docs) {
            if (!mapaDocs.has(doc.movilidad_id)) {
                mapaDocs.set(doc.movilidad_id, new Map());
            }
            mapaDocs.get(doc.movilidad_id).set(doc.tipo_documento, doc);
        }

        const datos = filas.map((fila) => {
            const resumen = agregarResumen(fila);
            const docsMovilidad = mapaDocs.get(fila.id) || new Map();
            const documentos = tipos.map((t) => {
                const existente = docsMovilidad.get(t.codigo);
                return {
                    tipo_documento: t.codigo,
                    nombre: t.nombre,
                    orden: t.orden,
                    estado_entrega: existente?.estado_entrega || 'Pendiente',
                    ruta_archivo: existente?.ruta_archivo || null,
                    fecha_entrega: existente?.fecha_entrega || null,
                    observacion: existente?.observacion || null
                };
            });
            return {
                ...resumen,
                documentos
            };
        });

        res.json({ exito: true, datos });
    } catch (error) {
        console.error('Error al obtener movilidades:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// GET: una movilidad con sus datos de estudiante
export const obtenerMovilidadPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const [filas] = await pool.query(`${SELECT_MOVILIDADES} WHERE m.id = ?`, [id]);

        if (filas.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Movilidad no encontrada.' });
        }

        res.json({ exito: true, datos: agregarResumen(filas[0]) });
    } catch (error) {
        console.error('Error al obtener movilidad:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// POST: registrar movilidad + checklist de documentos
export const crearMovilidad = async (req, res) => {
    const datos = normalizar(req.body);

    if (!enteroPositivo(datos.estudiante_id)) {
        return res.status(400).json({ exito: false, mensaje: 'Debes seleccionar un estudiante válido.' });
    }

    // La regla "una movilidad por estudiante" se informa antes que cualquier
    // otro campo faltante, para no confundir a quien intenta duplicar.
    try {
        const [existente] = await pool.query(
            'SELECT id FROM movilidades WHERE estudiante_id = ?',
            [datos.estudiante_id]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                exito: false,
                mensaje: 'Este estudiante ya tiene una movilidad registrada.'
            });
        }
    } catch (error) {
        console.error('Error al verificar movilidad existente:', error);
        return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }

    // Validación del resto de los campos obligatorios
    const errorValidacion = validar(datos);

    if (errorValidacion) {
        return res.status(400).json({ exito: false, mensaje: errorValidacion });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [estudiantes] = await conexion.query(
            'SELECT id FROM estudiantes WHERE id = ?',
            [datos.estudiante_id]
        );

        if (estudiantes.length === 0) {
            await conexion.rollback();
            return res.status(404).json({ exito: false, mensaje: 'El estudiante indicado no existe.' });
        }

        const [existente] = await conexion.query(
            'SELECT id FROM movilidades WHERE estudiante_id = ?',
            [datos.estudiante_id]
        );

        if (existente.length > 0) {
            await conexion.rollback();
            return res.status(409).json({
                exito: false,
                mensaje: 'Este estudiante ya tiene una movilidad registrada.'
            });
        }

        // El semestre es un dato del estudiante y no se modifica desde la movilidad.

        const [resultado] = await conexion.query(
            `INSERT INTO movilidades
                (estudiante_id, facultad_origen, escuela_profesional,
                 universidad_destino, facultad_destino, pais_destino, ciudad_destino,
                 fecha_salida, fecha_retorno, direccion_residencia,
                 postulado, estado, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                datos.estudiante_id,
                datos.facultad_origen,
                datos.escuela_profesional,
                datos.universidad_destino,
                datos.facultad_destino,
                datos.pais_destino,
                datos.ciudad_destino,
                datos.fecha_salida,
                datos.fecha_retorno,
                datos.direccion_residencia,
                datos.postulado ? 1 : 0,
                datos.estado,
                datos.observaciones
            ]
        );

        const movilidadId = resultado.insertId;

        // Checklist completo: 14 documentos en estado Pendiente
        await conexion.query(
            `INSERT INTO documentos (movilidad_id, tipo_documento)
             SELECT ?, codigo FROM tipos_documento`,
            [movilidadId]
        );

        await conexion.commit();

        res.status(201).json({
            exito: true,
            mensaje: 'Movilidad registrada correctamente. Se creó el checklist de 14 documentos.',
            id_insertado: movilidadId
        });
    } catch (error) {
        await conexion.rollback();
        console.error('Error al registrar movilidad:', error);

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ exito: false, mensaje: 'El estudiante indicado no existe.' });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                exito: false,
                mensaje: 'Este estudiante ya tiene una movilidad registrada.'
            });
        }

        res.status(500).json({ exito: false, mensaje: 'Error al registrar la movilidad.' });
    } finally {
        conexion.release();
    }
};

// PATCH: actualizar estado y datos de la movilidad
export const actualizarMovilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const [filas] = await pool.query('SELECT * FROM movilidades WHERE id = ?', [id]);

        if (filas.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Movilidad no encontrada.' });
        }

        const actual = filas[0];
        const campos = [];
        const valores = [];

        const asignarTexto = (campo, obligatorio = false) => {
            if (req.body[campo] === undefined) return true;
            const valor = texto(req.body[campo]);
            if (obligatorio && !valor) {
                throw Object.assign(new Error(`El campo ${campo} no puede estar vacío.`), { status: 400 });
            }
            campos.push(`${campo} = ?`);
            valores.push(valor || null);
            return true;
        };

        asignarTexto('facultad_origen', true);
        asignarTexto('escuela_profesional');
        asignarTexto('universidad_destino', true);
        asignarTexto('facultad_destino', true);
        asignarTexto('pais_destino', true);
        asignarTexto('ciudad_destino', true);
        asignarTexto('direccion_residencia', true);
        asignarTexto('observaciones');

        let fechaSalida = actual.fecha_salida;
        let fechaRetorno = actual.fecha_retorno;

        if (req.body.fecha_salida !== undefined) {
            fechaSalida = texto(req.body.fecha_salida);
            if (!fechaValida(fechaSalida)) {
                return res.status(400).json({ exito: false, mensaje: 'La fecha de salida no es válida.' });
            }
        }

        if (req.body.fecha_retorno !== undefined) {
            fechaRetorno = texto(req.body.fecha_retorno);
            if (!fechaValida(fechaRetorno)) {
                return res.status(400).json({ exito: false, mensaje: 'La fecha de retorno no es válida.' });
            }
        }

        if (fechaSalida > fechaRetorno) {
            return res.status(400).json({
                exito: false,
                mensaje: 'La fecha de salida no puede ser posterior a la fecha de retorno.'
            });
        }

        if (req.body.fecha_salida !== undefined) {
            campos.push('fecha_salida = ?');
            valores.push(fechaSalida);
        }

        if (req.body.fecha_retorno !== undefined) {
            campos.push('fecha_retorno = ?');
            valores.push(fechaRetorno);
        }

        if (req.body.postulado !== undefined) {
            campos.push('postulado = ?');
            valores.push(aBooleano(req.body.postulado) ? 1 : 0);
        }

        if (req.body.estado !== undefined) {
            const estado = texto(req.body.estado);
            if (!ESTADOS.includes(estado)) {
                return res.status(400).json({ exito: false, mensaje: 'El estado no es válido.' });
            }
            campos.push('estado = ?');
            valores.push(estado);
        }

        if (campos.length === 0) {
            return res.status(400).json({ exito: false, mensaje: 'No se enviaron campos para actualizar.' });
        }

        valores.push(id);
        await pool.query(`UPDATE movilidades SET ${campos.join(', ')} WHERE id = ?`, valores);

        const [actualizadas] = await pool.query(`${SELECT_MOVILIDADES} WHERE m.id = ?`, [id]);
        res.json({ exito: true, mensaje: 'Movilidad actualizada correctamente.', datos: agregarResumen(actualizadas[0]) });
    } catch (error) {
        console.error('Error al actualizar movilidad:', error);
        res.status(error.status || 500).json({
            exito: false,
            mensaje: error.status ? error.message : 'Error interno al actualizar la movilidad.'
        });
    }
};

// DELETE: eliminar movilidad y su checklist
export const eliminarMovilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query('DELETE FROM movilidades WHERE id = ?', [id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Movilidad no encontrada.' });
        }

        res.json({ exito: true, mensaje: 'Movilidad eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar movilidad:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno al eliminar la movilidad.' });
    }
};

// =========================================================
// Exportación CSV (compatible con Excel)
// =========================================================
function campoCsv(valor) {
    const textoValor = valor === null || valor === undefined ? '' : String(valor);
    return `"${textoValor.replace(/"/g, '""')}"`;
}

function fechaCsv(fechaISO) {
    if (!fechaISO) return '';
    const [anio, mes, dia] = String(fechaISO).slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
}

function semestreCsv(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero >= 1 && numero <= 10
        ? `${numero}.º semestre`
        : '';
}

export const exportarMovilidades = async (req, res) => {
    try {
        const [movilidades] = await pool.query(`${SELECT_MOVILIDADES} ORDER BY e.apellido_paterno, e.apellido_materno`);
        const [documentos] = await pool.query('SELECT movilidad_id, tipo_documento, estado_entrega FROM documentos');

        const mapaDocumentos = new Map();

        for (const documento of documentos) {
            if (!mapaDocumentos.has(documento.movilidad_id)) {
                mapaDocumentos.set(documento.movilidad_id, {});
            }
            mapaDocumentos.get(documento.movilidad_id)[documento.tipo_documento] =
                documento.estado_entrega === 'Entregado' ? 'SI' : 'NO';
        }

        const encabezados = [
            'NOMBRE',
            'APELLIDO PA',
            'APELLIDO MA',
            'DNI',
            'CODIGO ESTUDIANTE',
            'CORREO PER',
            'CORREO INST',
            'FACULTAD ORIGEN',
            'SEMESTRE',
            'UNIVERSIDAD DEST',
            'FACULTAD DESTINO',
            'PAIS',
            'CIUDAD',
            'EXPEDIENTE COMPLETO',
            'PRESENTA EXP FISICO',
            'PRESENTA PRE EQUIVALENCIA',
            'POSTULADO',
            'CARTA ACEPTACION',
            'NOTIFICADO A FACULTAD',
            'NOTIFICADO ESTUDIANTE',
            'FIRMA CARTA COMPROMISO PADRES',
            'PRESENTA SEGURO FISICO',
            'PRESENTA SEGURO PSICOLOGICO',
            'RESOLUCION AUTORIZACION FACULTAD',
            'CONSTANCIA INDUCCION',
            'TIENE VISA',
            'FECHA SALIDA PAIS',
            'DIRECCION RESIDENCIA',
            'FECHA RETORNO',
            'MONITOREO QUINCENAL',
            'CERTIFICADO ESTUDIOS',
            'EQUIVALENCIA NOTAS',
            'COMUNICADO A LA FACULTAD',
            'ESTADO MOVILIDAD',
            'ULTIMO MONITOREO',
            'PROXIMO MONITOREO',
            'MONITOREO VENCIDO'
        ];

        const lineas = [encabezados.map(campoCsv).join(';')];

        for (const movilidad of movilidades) {
            const resumen = agregarResumen(movilidad);
            const docs = mapaDocumentos.get(movilidad.id) || {};

            const fila = [
                movilidad.nombres,
                movilidad.apellido_paterno,
                movilidad.apellido_materno,
                movilidad.dni,
                movilidad.codigo_estudiante,
                movilidad.correo_personal,
                movilidad.correo_institucional,
                movilidad.facultad_origen,
                semestreCsv(movilidad.semestre),
                movilidad.universidad_destino,
                movilidad.facultad_destino,
                movilidad.pais_destino,
                movilidad.ciudad_destino,
                resumen.expediente_completo ? 'SI' : 'NO',
                docs.expediente_fisico || 'NO',
                docs.pre_equivalencia || 'NO',
                movilidad.postulado ? 'SI' : 'NO',
                docs.carta_aceptacion || 'NO',
                docs.notificacion_facultad || 'NO',
                docs.notificacion_estudiante || 'NO',
                docs.compromiso_padres || 'NO',
                docs.seguro_medico || 'NO',
                docs.seguro_psicologico || 'NO',
                docs.resolucion_facultad || 'NO',
                docs.constancia_induccion || 'NO',
                docs.visa || 'NO',
                fechaCsv(movilidad.fecha_salida),
                movilidad.direccion_residencia,
                fechaCsv(movilidad.fecha_retorno),
                resumen.ultimo_monitoreo ? `Ultimo: ${fechaCsv(resumen.ultimo_monitoreo)}` : 'Sin monitoreos',
                docs.certificado_estudios || 'NO',
                docs.equivalencia_notas || 'NO',
                docs.comunicado_facultad || 'NO',
                movilidad.estado,
                fechaCsv(resumen.ultimo_monitoreo),
                fechaCsv(resumen.proximo_monitoreo),
                resumen.monitoreo_vencido ? 'SI' : 'NO'
            ];

            lineas.push(fila.map(campoCsv).join(';'));
        }

        const csv = '\uFEFF' + lineas.join('\r\n');
        const fecha = hoyISO();

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="seguimiento_movilidad_${fecha}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error al exportar movilidades:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al generar la exportación.' });
    }
};
