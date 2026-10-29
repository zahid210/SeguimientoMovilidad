import pool from '../config/db.js';

// GET: Obtener todas las movilidades (Uniendo datos del estudiante)
export const obtenerMovilidades = async (req, res) => {
    try {
        // Usamos INNER JOIN para traer el nombre del estudiante junto con los datos de su viaje
        const query = `
            SELECT m.*, e.nombres, e.apellido_paterno, e.apellido_materno, e.dni 
            FROM movilidades m
            INNER JOIN estudiantes e ON m.estudiante_id = e.id
            ORDER BY m.fecha_registro DESC
        `;
        const [filas] = await pool.query(query);
        res.json({ exito: true, datos: filas });
    } catch (error) {
        console.error('Error al obtener movilidades:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
    }
};

// POST: Registrar un nuevo viaje/movilidad
export const crearMovilidad = async (req, res) => {
    try {
        const {
            estudiante_id, facultad_origen, escuela_profesional, semestre_viaje,
            universidad_destino, facultad_destino, pais_destino, ciudad_destino,
            programa_convenio, fecha_salida, fecha_retorno
        } = req.body;

        // Validación de campos obligatorios según tu esquema
        if (!estudiante_id || !facultad_origen || !escuela_profesional || !universidad_destino || !facultad_destino || !pais_destino || !ciudad_destino) {
            return res.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios para registrar la movilidad.' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO movilidades 
            (estudiante_id, facultad_origen, escuela_profesional, semestre_viaje, universidad_destino, facultad_destino, pais_destino, ciudad_destino, programa_convenio, fecha_salida, fecha_retorno) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [estudiante_id, facultad_origen, escuela_profesional, semestre_viaje, universidad_destino, facultad_destino, pais_destino, ciudad_destino, programa_convenio, fecha_salida || null, fecha_retorno || null]
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Movilidad registrada correctamente.',
            id_insertado: resultado.insertId
        });
    } catch (error) {
        console.error('Error al registrar movilidad:', error);
        // Si intentan meter un estudiante_id que no existe, MySQL lanzará un error de Foreign Key
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ exito: false, mensaje: 'El estudiante indicado no existe en la base de datos.' });
        }
        res.status(500).json({ exito: false, mensaje: 'Error al registrar la movilidad.' });
    }
};