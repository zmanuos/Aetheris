-- Registrar un nuevo empleado
DELIMITER //
CREATE PROCEDURE spRegistrarEmpleado (
    IN nombre VARCHAR(100),
    IN apellido VARCHAR(100),
    IN fecha_nacimiento DATE,
    IN genero VARCHAR(10),
    IN telefono VARCHAR(15),
    IN email VARCHAR(100),
    IN contrasena VARCHAR(100)
)
BEGIN
    DECLARE nuevo_id INT;
    INSERT INTO PERSONAL (nombre, apellido, fecha_nacimiento, genero, telefono, activo)
    VALUES (nombre, apellido, fecha_nacimiento, genero, telefono);

    SET nuevo_id = LAST_INSERT_ID();

    INSERT INTO USUARIO (usuario, contra, email, rol)
    VALUES (
        nuevo_id,
        contrasena,
        email,
        2
    );
END;
//
DELIMITER ;


-- Registrar un nuevo familiar
DELIMITER //

CREATE PROCEDURE spRegistrarFamiliar (
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    genero VARCHAR(10),
    telefono VARCHAR(15),
    id_residente INT,
    id_parentesco INT,
    email VARCHAR(100),
    contrasena VARCHAR(100)
)
BEGIN
    DECLARE nuevo_id INT;

    INSERT INTO FAMILIAR (nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco)
    VALUES (nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco);

    SET nuevo_id = LAST_INSERT_ID();

    INSERT INTO USUARIO (usuario, contra, email, rol)
    VALUES (
        nuevo_id,
        contrasena
        email,
        3
    );
END;
//

DELIMITER ;
