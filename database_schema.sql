-- ========================================
-- INICIALIZACIÓN DE BASE DE DATOS (V2)
-- Archivo: init_db_v2.sql
-- Descripción: Creación desde cero del esquema reestructurado
-- ADVERTENCIA: ESTE SCRIPT BORRA TODOS LOS DATOS EXISTENTES
-- ========================================

-- Eliminar esquema público y recrearlo para limpiar todo
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

BEGIN;

-- ========================================
-- 1. TABLAS DE CATÁLOGO / CONFIGURACIÓN
-- ========================================

CREATE TABLE sedes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE ambientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sede_id INTEGER REFERENCES sedes(id) ON DELETE CASCADE
);

CREATE TABLE marcas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

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
);

CREATE TABLE rol_persona (
    rol_id INTEGER REFERENCES rol(id),
    doc_persona VARCHAR(20) REFERENCES persona(documento),
    sede_id INTEGER REFERENCES sedes(id),
    PRIMARY KEY (rol_id, doc_persona)
);

-- ========================================
-- 3. TABLAS DE INVENTARIO
-- ========================================

CREATE TABLE bienes (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    modelo VARCHAR(100),
    marca_id INTEGER REFERENCES marcas(id),
    serial VARCHAR(100),
    fecha_compra DATE,
    vida_util INTEGER, -- En años
    costo NUMERIC(15, 2)
);

CREATE TABLE estado_bien (
    id SERIAL PRIMARY KEY,
    bien_id INTEGER REFERENCES bienes(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asignaciones (
    id SERIAL PRIMARY KEY,
    bien_id INTEGER REFERENCES bienes(id),
    ambiente_id INTEGER REFERENCES ambientes(id),
    doc_persona VARCHAR(20) REFERENCES persona(documento),
    bloqueado BOOLEAN DEFAULT false,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 4. TABLAS DE SOLICITUDES
-- ========================================

CREATE TABLE solicitudes (
    id SERIAL PRIMARY KEY,
    fecha_ini_prestamo TIMESTAMP NOT NULL,
    fecha_fin_prestamo TIMESTAMP NOT NULL,
    doc_persona VARCHAR(20) REFERENCES persona(documento),
    destino VARCHAR(255),
    motivo TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    observaciones TEXT,
    sede_id INTEGER REFERENCES sedes(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_solicitud (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER REFERENCES solicitudes(id) ON DELETE CASCADE,
    asignacion_id INTEGER REFERENCES asignaciones(id)
);

CREATE TABLE firma_solicitud (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER REFERENCES solicitudes(id) ON DELETE CASCADE,
    rol_usuario VARCHAR(50),
    doc_persona VARCHAR(20) REFERENCES persona(documento),
    firma BOOLEAN DEFAULT false,
    observacion TEXT,
    fecha_firmado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. DATOS INICIALES BÁSICOS (Opcional)
-- ========================================
-- Insertar roles básicos
INSERT INTO rol (nombre) VALUES 
    ('administrador'), 
    ('almacenista'), 
    ('cuentadante'), 
    ('usuario'), 
    ('vigilante'), 
    ('coordinador');

-- Insertar marcas comunes
INSERT INTO marcas (nombre) VALUES ('Generico'), ('HP'), ('Dell'), ('Lenovo'), ('Samsung');

-- ========================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para búsquedas frecuentes
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
    CHECK (estado IN ('disponible', 'en_prestamo', 'en_mantenimiento', 'dado_de_baja'));

COMMIT;
