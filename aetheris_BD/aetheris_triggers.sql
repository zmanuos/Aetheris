    -- Incrementar empleados del asilo
    DELIMITER //
    CREATE TRIGGER agregar_empleados
    AFTER INSERT ON PERSONAL
    FOR EACH ROW
    UPDATE ASILO
    SET cantidad_empleados = cantidad_empleados + 1;
    // DELIMITER ;


    -- Actualizar cantidad de empleados al cambiar el estado del personal
    DELIMITER //
    CREATE TRIGGER total_empleados
    AFTER UPDATE ON PERSONAL
    FOR EACH ROW
    BEGIN
        IF OLD.activo != NEW.activo THEN
            UPDATE ASILO
            SET cantidad_empleados = (
                SELECT COUNT(*) FROM PERSONAL WHERE activo = TRUE
            );
        END IF;
    END;
    // DELIMITER ;

    -- Incrementar residentes del asilo
    DELIMITER //
    CREATE TRIGGER agregar_residentes
    AFTER INSERT ON RESIDENTE
    FOR EACH ROW
    UPDATE ASILO
    SET cantidad_residentes = cantidad_residentes + 1;
    // DELIMITER ;


    -- Actualizar cantidad de residentes al cambiar el estado de un residente
    DELIMITER //
    CREATE TRIGGER total_residentes
    AFTER UPDATE ON RESIDENTE
    FOR EACH ROW
    BEGIN
        IF OLD.activo != NEW.activo THEN
            UPDATE ASILO
            SET cantidad_residentes = (
                SELECT COUNT(*) FROM RESIDENTE WHERE activo = TRUE
            );
        END IF;
    END;
    // DELIMITER ;


    DELIMITER //

    CREATE TRIGGER activar_dispositivo_update
    AFTER UPDATE ON RESIDENTE
    FOR EACH ROW
    BEGIN
        IF NEW.dispositivo IS NOT NULL AND NEW.dispositivo != OLD.dispositivo THEN
            UPDATE DISPOSITIVO
            SET estado = TRUE
            WHERE id_dispositivo = NEW.dispositivo;
        END IF;
    END;
    //

    DELIMITER ;

DELIMITER //

CREATE TRIGGER update_fecha_asignacion_on_estado_change
AFTER UPDATE ON dispositivo
FOR EACH ROW
BEGIN
    IF NEW.estado = 0 AND OLD.estado != 0 THEN
        UPDATE dispositivo
        SET fecha_asignacion = NULL
        WHERE id_dispositivo = NEW.id_dispositivo; 
    END IF;
END //

DELIMITER ;