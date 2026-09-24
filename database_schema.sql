-- ========================================
-- INICIALIZACIÓN DE BASE DE DATOS (MySQL)
-- Archivo: database_schema.sql
-- Descripción: Creación desde cero del esquema para MySQL
-- ADVERTENCIA: ESTE SCRIPT BORRA TODOS LOS DATOS EXISTENTES
-- ========================================

SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas si existen
DROP TABLE IF EXISTS firma_solicitud;
DROP TABLE IF EXISTS detalle_solicitud;
DROP TABLE IF EXISTS solicitudes;
DROP TABLE IF EXISTS asignaciones;
DROP TABLE IF EXISTS estado_bien;
DROP TABLE IF EXISTS bienes;
DROP TABLE IF EXISTS rol_persona;
DROP TABLE IF EXISTS persona;
DROP TABLE IF EXISTS rol;
DROP TABLE IF EXISTS marcas;
DROP TABLE IF EXISTS ambientes;
DROP TABLE IF EXISTS sedes;

SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

-- ========================================
-- 1. TABLAS DE CATÁLOGO / CONFIGURACIÓN
-- ========================================

CREATE TABLE sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE ambientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sede_id INTEGER,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ========================================
-- 2. TABLAS DE USUARIOS (PERSONA)
-- ========================================

CREATE TABLE persona (
    documento VARCHAR(20) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    tipo_doc VARCHAR(10),
    contraseña VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE rol_persona (
    rol_id INTEGER,
    doc_persona VARCHAR(20),
    sede_id INTEGER,
    PRIMARY KEY (rol_id, doc_persona),
    FOREIGN KEY (rol_id) REFERENCES rol(id),
    FOREIGN KEY (doc_persona) REFERENCES persona(documento),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB;

-- ========================================
-- 3. TABLAS DE INVENTARIO
-- ========================================

CREATE TABLE bienes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    modelo VARCHAR(100),
    marca_id INTEGER,
    serial VARCHAR(100),
    fecha_compra DATE,
    vida_util INTEGER, -- En años
    costo DECIMAL(15, 2),
    FOREIGN KEY (marca_id) REFERENCES marcas(id)
) ENGINE=InnoDB;

CREATE TABLE estado_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bien_id INTEGER,
    estado VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bien_id) REFERENCES bienes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bien_id INTEGER,
    ambiente_id INTEGER,
    doc_persona VARCHAR(20),
    bloqueado TINYINT(1) DEFAULT 0,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bien_id) REFERENCES bienes(id),
    FOREIGN KEY (ambiente_id) REFERENCES ambientes(id),
    FOREIGN KEY (doc_persona) REFERENCES persona(documento)
) ENGINE=InnoDB;

-- ========================================
-- 4. TABLAS DE SOLICITUDES
-- ========================================

CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_ini_prestamo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin_prestamo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    doc_persona VARCHAR(20),
    destino VARCHAR(255),
    motivo TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    observaciones TEXT,
    sede_id INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doc_persona) REFERENCES persona(documento),
    FOREIGN KEY (sede_id) REFERENCES sedes(id)
) ENGINE=InnoDB;

CREATE TABLE detalle_solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INTEGER,
    asignacion_id INTEGER,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (asignacion_id) REFERENCES asignaciones(id)
) ENGINE=InnoDB;

CREATE TABLE firma_solicitud (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INTEGER,
    rol_usuario VARCHAR(50),
    doc_persona VARCHAR(20),
    firma TINYINT(1) DEFAULT 0,
    observacion TEXT,
    fecha_firmado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
    FOREIGN KEY (doc_persona) REFERENCES persona(documento)
) ENGINE=InnoDB;

-- ========================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX idx_solicitudes_doc_persona ON solicitudes(doc_persona);
CREATE INDEX idx_solicitudes_sede_id ON solicitudes(sede_id);
CREATE INDEX idx_solicitudes_fecha_creacion ON solicitudes(fecha_creacion);

CREATE INDEX idx_asignaciones_doc_persona ON asignaciones(doc_persona);
CREATE INDEX idx_asignaciones_bien_id ON asignaciones(bien_id);
CREATE INDEX idx_asignaciones_bloqueado ON asignaciones(bloqueado);

CREATE INDEX idx_detalle_solicitud_solicitud_id ON detalle_solicitud(solicitud_id);
CREATE INDEX idx_detalle_solicitud_asignacion_id ON detalle_solicitud(asignacion_id);

CREATE INDEX idx_firma_solicitud_solicitud_id ON firma_solicitud(solicitud_id);
CREATE INDEX idx_firma_solicitud_doc_persona ON firma_solicitud(doc_persona);

CREATE INDEX idx_bienes_placa ON bienes(placa);
CREATE INDEX idx_rol_persona_doc_persona ON rol_persona(doc_persona);

-- ========================================
-- 7. CONSTRAINTS ADICIONALES
-- ========================================

-- Validar estados de solicitud
ALTER TABLE solicitudes ADD CONSTRAINT chk_estado_solicitud 
    CHECK (estado IN ('pendiente', 'firmada_cuentadante', 'aprobada', 'en_prestamo', 'devuelto', 'rechazada', 'cancelada'));

-- Validar que las fechas sean lógicas
ALTER TABLE solicitudes ADD CONSTRAINT chk_fechas_logicas 
    CHECK (fecha_fin_prestamo >= fecha_ini_prestamo);

-- Validar estados de bien
ALTER TABLE estado_bien ADD CONSTRAINT chk_estado_bien 
    CHECK (estado IN ('buen_estado', 'deteriorado', 'en_mantenimiento', 'en_prestamo', 'dado_de_baja'));

COMMIT;
