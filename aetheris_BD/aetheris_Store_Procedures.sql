-- Registrar un nuevo empleado
DROP PROCEDURE IF EXISTS spRegistrarEmpleado;
DELIMITER //

CREATE PROCEDURE spRegistrarEmpleado (
    IN nombre VARCHAR(100),
    IN apellido VARCHAR(100),
    IN fecha_nacimiento DATE,
    IN genero VARCHAR(10),
    IN telefono VARCHAR(15),
    IN email VARCHAR(100),
    IN contra VARCHAR(100)
)
BEGIN
    DECLARE nuevo_id INT;

    INSERT INTO PERSONAL (nombre, apellido, fecha_nacimiento, genero, telefono, activo)
    VALUES (nombre, apellido, fecha_nacimiento, genero, telefono, 1);

    SET nuevo_id = LAST_INSERT_ID();

    INSERT INTO USUARIO (usuario, contra, email, rol)
    VALUES (
        nuevo_id,
        contra,
        email,
        2
    );
END;
//
DELIMITER ;


-- Registrar un nuevo familiar
DELIMITER //

-- Registrar un nuevo familiar
DROP PROCEDURE IF EXISTS spRegistrarFamiliar;
DELIMITER //

CREATE PROCEDURE spRegistrarFamiliar (
    IN nombre VARCHAR(100),
    IN apellido VARCHAR(100),
    IN fecha_nacimiento DATE,
    IN genero VARCHAR(10),
    IN telefono VARCHAR(15),
    IN id_residente INT,
    IN id_parentesco INT,
    IN email VARCHAR(100),
    IN contrasena VARCHAR(100)
)
BEGIN
    DECLARE nuevo_id INT;
    DECLARE usuario_id INT;

    SET nuevo_id = LAST_INSERT_ID();

    INSERT INTO FAMILIAR (id_familiar, nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco)
    VALUES (nuevo_id + 1000, nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco);

    SET usuario_id = LAST_INSERT_ID();

    INSERT INTO USUARIO (usuario, contra, email, rol)
    VALUES (
        usuario_id + 1000,
        contrasena,
        email,
        3
    );
END;
//
DELIMITER ;
