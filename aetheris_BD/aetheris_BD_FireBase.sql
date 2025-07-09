DROP DATABASE IF EXISTS aetheris;
CREATE DATABASE IF NOT EXISTS aetheris;
USE aetheris;

CREATE TABLE ASILO (
    id_asilo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT NOT NULL,
    pais VARCHAR(50),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    cantidad_residentes INT DEFAULT 0,
    cantidad_empleados INT DEFAULT 0
);

-- Personal del Asilo - info del personal.
CREATE TABLE PERSONAL (
    id_personal INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    telefono VARCHAR(10),
    firebase_uid VARCHAR(28) UNIQUE,
    activo BOOLEAN DEFAULT FALSE
);

CREATE TABLE AREA (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE, -- planta alta, planta baja, dormitorio, sala de estar comedor, sala de chequeo medico etc.
    descripcion TEXT -- detalles adicionales sobre el area (opcional)
);

-- Dispositivos - Estado de los dispositivos.
CREATE TABLE DISPOSITIVO (
    id_dispositivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion_MAC VARCHAR(30) UNIQUE,
    estado BOOLEAN DEFAULT TRUE,
);

-- Residentes - Info del residente
-- Residentes - Info del residente
CREATE TABLE RESIDENTE (
    id_residente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    telefono VARCHAR(15),
    dispositivo INT,
    foto VARCHAR(255) DEFAULT 'default',
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    promedio_reposo INT,
    promedio_activo INT,
    promedio_agitado INT,
    FOREIGN KEY (dispositivo) REFERENCES DISPOSITIVO(id_dispositivo)
);



-- Medicamentos
-- Padecimientos

CREATE TABLE PARENTESCO (
    id_parentesco INT AUTO_INCREMENT PRIMARY KEY,
    parentesco VARCHAR(50)
);

-- Familiares - info del familiar.
CREATE TABLE FAMILIAR (
    id_familiar INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    telefono VARCHAR(15),
    id_residente INT,
    id_parentesco INT,
    firebase_uid VARCHAR(28) UNIQUE, 
    FOREIGN KEY (id_parentesco) REFERENCES PARENTESCO(id_parentesco),
    FOREIGN KEY (id_residente) REFERENCES RESIDENTE(id_residente)
);


-- Chequeo - Datos de los sensores
CREATE TABLE CHEQUEO (
    id_chequeo INT AUTO_INCREMENT PRIMARY KEY,
    id_residente INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    frecuencia_cardiaca INT,
    oxigeno DECIMAL(4,2),
    peso DECIMAL(5,2),
    observaciones TEXT,
    FOREIGN KEY (id_residente) REFERENCES RESIDENTE(id_residente)
);

-- Alertas - (Tipo de alerta, fecha, persona afectada, etc).
CREATE TABLE ALERTA_TIPO (
    id_alerta_tipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    descripcion VARCHAR(255)
);

CREATE TABLE ALERTA (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_residente INT,
    id_alerta_tipo INT,
    id_area INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensaje VARCHAR(255),
    FOREIGN KEY (id_residente) REFERENCES RESIDENTE(id_residente),
    FOREIGN KEY (id_alerta_tipo) REFERENCES ALERTA_TIPO(id_alerta_tipo),
    FOREIGN KEY (id_area) REFERENCES AREA(id_area) -- Clave foránea nueva
);

CREATE TABLE OBSERVACIONES (
    id_observaciones INT AUTO_INCREMENT PRIMARY KEY,
    id_residente INT,
    observacion TEXT,
    FOREIGN KEY (id_residente) REFERENCES FAMILIAR(id_residente)
);

CREATE TABLE NOTAS (
    id_notas INT AUTO_INCREMENT PRIMARY KEY,
    id_familiar INT,
    nota TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_familiar) REFERENCES FAMILIAR(id_familiar)
);


