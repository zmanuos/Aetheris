-- evento para desactivar notas antiguas despues de 5 dias
SET GLOBAL event_scheduler = ON;
-- Crear el evento que se ejecuta diariamente

CREATE EVENT IF NOT EXISTS desactivar_notas_antiguas
ON SCHEDULE EVERY 1 DAY
DO
  UPDATE NOTAS
  SET activo = FALSE
  WHERE activo = TRUE AND fecha < NOW() - INTERVAL 5 DAY;


DELIMITER $$

CREATE EVENT IF NOT EXISTS verificar_chequeos_atrasados
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
  -- Crear alertas para residentes sin chequeos en más de 7 días
  INSERT INTO ALERTA (id_residente, id_alerta_tipo, mensaje)
  SELECT r.id_residente, 1, CONCAT('El residente ', r.nombre, ' ', r.apellido, 'con ID ', r.id_residente ,' no ha tenido un chequeo en más de 7 días')
  FROM RESIDENTE r
  LEFT JOIN (
    SELECT id_residente, MAX(fecha) AS ultima_fecha
    FROM CHEQUEO
    GROUP BY id_residente
  ) c ON r.id_residente = c.id_residente
  WHERE r.activo = TRUE AND (c.ultima_fecha IS NULL OR c.ultima_fecha < NOW() - INTERVAL 7 DAY);
END $$

DELIMITER ;

DELIMITER $$

CREATE EVENT IF NOT EXISTS verificar_residentes_sin_chequeos
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
  -- Crear alertas solo para residentes que no tienen ningún chequeo
  INSERT INTO ALERTA (id_residente, id_alerta_tipo, mensaje)
  SELECT r.id_residente, 2, CONCAT('El residente ', r.nombre, ' ', r.apellido, ' con ID ', r.id_residente, ' no tiene ningún chequeo registrado.')
  FROM RESIDENTE r
  WHERE r.activo = TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM CHEQUEO c
      WHERE c.id_residente = r.id_residente
    );
END $$
DELIMITER ;
