import { Sequelize, DataTypes } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export function getDbConfig() {
    return {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'uncp_movilidad',
        port: Number(process.env.DB_PORT) || 3306
    };
}

/**
 * 1. Crea la base de datos si no existe usando una conexión directa
 */
export async function asegurarBaseDeDatos() {
    const config = getDbConfig();
    const conexion = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port
    });

    try {
        await conexion.query(
            `CREATE DATABASE IF NOT EXISTS \`${config.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
    } finally {
        await conexion.end();
    }
}

/**
 * 2. Instancia de Sequelize configurada
 */
const initialConfig = getDbConfig();
export const sequelize = new Sequelize(initialConfig.name, initialConfig.user, initialConfig.password, {
    host: initialConfig.host,
    port: initialConfig.port,
    dialect: 'mysql',
    timezone: '-05:00',
    logging: false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: false,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    }
});

/**
 * 3. Definición de Modelos
 */

// Modelo: Estudiante
export const Estudiante = sequelize.define('Estudiante', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dni: {
        type: DataTypes.STRING(8),
        allowNull: false,
        unique: true
    },
    codigo_estudiante: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    semestre: {
        type: DataTypes.STRING(2),
        allowNull: true
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellido_paterno: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellido_materno: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    correo_personal: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    correo_institucional: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    telefono_whatsapp: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    contacto_emergencia: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'estudiantes'
});

// Modelo: Movilidad
export const Movilidad = sequelize.define('Movilidad', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    estudiante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    facultad_origen: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    escuela_profesional: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    universidad_destino: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    facultad_destino: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    pais_destino: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    ciudad_destino: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    fecha_salida: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_retorno: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    direccion_residencia: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    postulado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    estado: {
        type: DataTypes.ENUM('Postulando', 'Aceptado', 'En Extranjero', 'Retornado', 'Cerrado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Postulando'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'movilidades'
});

// Modelo: TipoDocumento (Catálogo de 14 documentos)
export const TipoDocumento = sequelize.define('TipoDocumento', {
    codigo: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    orden: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'tipos_documento'
});

// Modelo: Documento (Checklist por Movilidad)
export const Documento = sequelize.define('Documento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    movilidad_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo_documento: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    estado_entrega: {
        type: DataTypes.ENUM('Pendiente', 'Entregado'),
        allowNull: false,
        defaultValue: 'Pendiente'
    },
    ruta_archivo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fecha_entrega: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    observacion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fecha_actualizacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'documentos',
    indexes: [
        {
            unique: true,
            fields: ['movilidad_id', 'tipo_documento'],
            name: 'unq_movilidad_documento'
        }
    ]
});

// Modelo: Monitoreo Quincenal
export const Monitoreo = sequelize.define('Monitoreo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    movilidad_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    estado_estudiante: {
        type: DataTypes.ENUM('Sin novedades', 'Requiere atención', 'Emergencia'),
        allowNull: false,
        defaultValue: 'Sin novedades'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    medio_contacto: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    responsable: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    proxima_fecha: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'monitoreos'
});

/**
 * 4. Asociaciones (Relaciones con ON DELETE CASCADE)
 */

// Estudiante (1) <-> (1) Movilidad
Estudiante.hasOne(Movilidad, {
    foreignKey: 'estudiante_id',
    as: 'movilidad',
    onDelete: 'CASCADE'
});
Movilidad.belongsTo(Estudiante, {
    foreignKey: 'estudiante_id',
    as: 'estudiante'
});

// Movilidad (1) <-> (N) Documentos
Movilidad.hasMany(Documento, {
    foreignKey: 'movilidad_id',
    as: 'documentos',
    onDelete: 'CASCADE'
});
Documento.belongsTo(Movilidad, {
    foreignKey: 'movilidad_id',
    as: 'movilidad'
});

// TipoDocumento (1) <-> (N) Documentos
TipoDocumento.hasMany(Documento, {
    foreignKey: 'tipo_documento',
    as: 'documentos'
});
Documento.belongsTo(TipoDocumento, {
    foreignKey: 'tipo_documento',
    as: 'tipo'
});

// Movilidad (1) <-> (N) Monitoreos
Movilidad.hasMany(Monitoreo, {
    foreignKey: 'movilidad_id',
    as: 'monitoreos',
    onDelete: 'CASCADE'
});
Monitoreo.belongsTo(Movilidad, {
    foreignKey: 'movilidad_id',
    as: 'movilidad'
});

/**
 * 5. Catálogo inmutable de 14 documentos oficiales
 */
export const DOCUMENTOS_OFICIALES = [
    { codigo: 'expediente_fisico', nombre: 'Presenta expediente físico', orden: 1 },
    { codigo: 'pre_equivalencia', nombre: 'Presenta pre-equivalencia', orden: 2 },
    { codigo: 'carta_aceptacion', nombre: 'Carta de aceptación', orden: 3 },
    { codigo: 'notificacion_facultad', nombre: 'Notificado a la facultad', orden: 4 },
    { codigo: 'notificacion_estudiante', nombre: 'Notificado al estudiante', orden: 5 },
    { codigo: 'compromiso_padres', nombre: 'Firma carta de compromiso de padres', orden: 6 },
    { codigo: 'seguro_medico', nombre: 'Presenta seguro físico (médico)', orden: 7 },
    { codigo: 'seguro_psicologico', nombre: 'Presenta seguro psicológico', orden: 8 },
    { codigo: 'resolucion_facultad', nombre: 'Resolución de autorización de facultad', orden: 9 },
    { codigo: 'constancia_induccion', nombre: 'Constancia de inducción', orden: 10 },
    { codigo: 'visa', nombre: 'Tiene visa', orden: 11 },
    { codigo: 'certificado_estudios', nombre: 'Certificado de estudios', orden: 12 },
    { codigo: 'equivalencia_notas', nombre: 'Equivalencia de notas', orden: 13 },
    { codigo: 'comunicado_facultad', nombre: 'Comunicado a la facultad', orden: 14 }
];

/**
 * 6. Inicialización automática integral:
 * - Asegura la base de datos
 * - Sincroniza tablas de Sequelize (sin alterar datos existentes)
 * - Inserta catálogo de 14 documentos si está vacío
 */
export async function inicializarSequelize() {
    await asegurarBaseDeDatos();
    await sequelize.authenticate();
    await sequelize.sync();

    // Precargar catálogo de documentos si no existe
    for (const doc of DOCUMENTOS_OFICIALES) {
        await TipoDocumento.findOrCreate({
            where: { codigo: doc.codigo },
            defaults: doc
        });
    }

    console.log('Sequelize ORM: Base de datos y tablas sincronizadas correctamente.');
}

export default sequelize;
