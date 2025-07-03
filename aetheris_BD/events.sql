-- evento para desactivar notas antiguas despues de 5 dias
SET GLOBAL event_scheduler = ON;

-- Crear el evento que se ejecuta diariamente
CREATE EVENT IF NOT EXISTS desactivar_notas_antiguas
ON SCHEDULE EVERY 1 DAY
DO
  UPDATE NOTAS
  SET activo = FALSE
  WHERE activo = TRUE AND fecha < NOW() - INTERVAL 5 DAY;
