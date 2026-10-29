import pool from '../config/db.js';

// Obtener todos los estudiantes GET
export const obtenerEstudiantes = async(req, res) => {
    try{
        const [filas] = await pool.query('SELECT * FROM estudiantes ORDER BY id DESC');

        // Respondemos al frontend
        res.json({
            exito: true,
            datos: filas
        });
    } catch (error){
        console.error('Error : ', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al consultar base de datos'
        });
    }
};

// Crear estudiante POST
export const crearEstudiante = async (req, res) => {
    try{
        const {
            dni, codigo_estudiante, nombres, apellido_paterno, apellido_materno,
            correo_personal, correo_institucional, telefono_whatsapp, contacto_emergencia
        } = req.body;

        if (!dni || !codigo_estudiante || !nombres || !apellido_paterno || !apellido_materno || !correo_institucional) {
            return res.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios.' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO estudiantes 
            (dni, codigo_estudiante, nombres, apellido_paterno, apellido_materno, correo_personal, correo_institucional, telefono_whatsapp, contacto_emergencia) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [dni, codigo_estudiante, nombres, apellido_paterno, apellido_materno, correo_personal, correo_institucional, telefono_whatsapp, contacto_emergencia]
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Estudiante registrado correctamente.',
            id_insertado: resultado.insertId
        });

    } catch (error) {
        console.error('Error al registrar estudiante:', error);

        // Manejo específico del error de MySQL para valores ÚNICOS (DNI o Código repetido)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ exito: false, mensaje: 'El DNI o Código de estudiante ya se encuentra registrado.' });
        }

        res.status(500).json({ exito: false, mensaje: 'Error interno al registrar el estudiante.' });
    }
};