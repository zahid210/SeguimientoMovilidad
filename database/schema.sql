-- =========================================================
-- SeguimientoMovilidad - Esquema de base de datos
-- MariaDB / MySQL 8+
--
-- Este script RECREA las tablas. Solo debe ejecutarse cuando
-- la base está vacía o cuando se quiere reiniciar el sistema.
-- =========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS documentos;
DROP TABLE IF EXISTS monitoreos;
DROP TABLE IF EXISTS movilidades;
DROP TABLE IF EXISTS estudiantes;
DROP TABLE IF EXISTS tipos_documento;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- Estudiantes
-- =========================================================
CREATE TABLE estudiantes (
    id INT(11) NOT NULL AUTO_INCREMENT,
    dni VARCHAR(8) NOT NULL,
    codigo_estudiante VARCHAR(20) NOT NULL,
    semestre VARCHAR(2) DEFAULT NULL COMMENT 'Semestre del estudiante: 1 a 10',
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    correo_personal VARCHAR(100) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL,
    telefono_whatsapp VARCHAR(20) DEFAULT NULL,
    contacto_emergencia VARCHAR(150) DEFAULT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    UNIQUE KEY unq_estudiantes_dni (dni),
    UNIQUE KEY unq_estudiantes_codigo (codigo_estudiante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Movilidades (una por estudiante)
-- =========================================================
CREATE TABLE movilidades (
    id INT(11) NOT NULL AUTO_INCREMENT,
    estudiante_id INT(11) NOT NULL,
    facultad_origen VARCHAR(100) NOT NULL,
    escuela_profesional VARCHAR(100) DEFAULT NULL,
    universidad_destino VARCHAR(150) NOT NULL,
    facultad_destino VARCHAR(150) NOT NULL,
    pais_destino VARCHAR(50) NOT NULL,
    ciudad_destino VARCHAR(100) NOT NULL,
    fecha_salida DATE NOT NULL,
    fecha_retorno DATE NOT NULL,
    direccion_residencia VARCHAR(255) NOT NULL COMMENT 'Dirección exacta donde vive en el país de destino',
    postulado TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'POSTULADO (SÍ/NO) del Excel',
    estado ENUM('Postulando','Aceptado','En Extranjero','Retornado','Cerrado','Cancelado')
        NOT NULL DEFAULT 'Postulando',
    observaciones TEXT DEFAULT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    UNIQUE KEY unq_movilidades_estudiante (estudiante_id),
    KEY idx_movilidades_estado (estado),
    KEY idx_movilidades_pais (pais_destino),
    CONSTRAINT fk_movilidades_estudiante
        FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Catálogo de documentos del expediente
-- =========================================================
CREATE TABLE tipos_documento (
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    orden INT(11) NOT NULL,
    PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tipos_documento (codigo, nombre, orden) VALUES
    ('expediente_fisico',      'Presenta expediente físico',                1),
    ('pre_equivalencia',       'Presenta pre-equivalencia',                 2),
    ('carta_aceptacion',       'Carta de aceptación',                       3),
    ('notificacion_facultad',  'Notificado a la facultad',                  4),
    ('notificacion_estudiante','Notificado al estudiante',                  5),
    ('compromiso_padres',      'Firma carta de compromiso de padres',       6),
    ('seguro_medico',          'Presenta seguro físico (médico)',          7),
    ('seguro_psicologico',     'Presenta seguro psicológico',               8),
    ('resolucion_facultad',    'Resolución de autorización de facultad',    9),
    ('constancia_induccion',   'Constancia de inducción',                  10),
    ('visa',                   'Tiene visa',                               11),
    ('certificado_estudios',   'Certificado de estudios',                  12),
    ('equivalencia_notas',     'Equivalencia de notas',                    13),
    ('comunicado_facultad',    'Comunicado a la facultad',                 14);

-- =========================================================
-- Documentos por movilidad (checklist)
-- Se crean automáticamente al registrar la movilidad.
-- =========================================================
CREATE TABLE documentos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    movilidad_id INT(11) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    estado_entrega ENUM('Pendiente','Entregado') NOT NULL DEFAULT 'Pendiente',
    ruta_archivo VARCHAR(255) DEFAULT NULL COMMENT 'Ruta relativa, ej: /uploads/2026/71234567/visa-123.pdf',
    fecha_entrega DATE DEFAULT NULL,
    observacion VARCHAR(255) DEFAULT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    UNIQUE KEY unq_movilidad_documento (movilidad_id, tipo_documento),
    KEY idx_documentos_estado (estado_entrega),
    CONSTRAINT fk_documentos_movilidad
        FOREIGN KEY (movilidad_id) REFERENCES movilidades (id) ON DELETE CASCADE,
    CONSTRAINT fk_documentos_tipo
        FOREIGN KEY (tipo_documento) REFERENCES tipos_documento (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Monitoreos quincenales
-- =========================================================
CREATE TABLE monitoreos (
    id INT(11) NOT NULL AUTO_INCREMENT,
    movilidad_id INT(11) NOT NULL,
    fecha_registro DATE NOT NULL,
    estado_estudiante ENUM('Sin novedades','Requiere atención','Emergencia')
        NOT NULL DEFAULT 'Sin novedades',
    observaciones TEXT DEFAULT NULL,
    medio_contacto VARCHAR(50) DEFAULT NULL,
    responsable VARCHAR(100) DEFAULT NULL,
    proxima_fecha DATE DEFAULT NULL COMMENT 'Si es NULL se calcula automáticamente a 15 días',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id),
    KEY idx_monitoreos_movilidad_fecha (movilidad_id, fecha_registro),
    CONSTRAINT fk_monitoreos_movilidad
        FOREIGN KEY (movilidad_id) REFERENCES movilidades (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
