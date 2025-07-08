-- Tabla: ALERTA_TIPO
INSERT INTO ALERTA_TIPO (nombre, descripcion) VALUES
('Baja', 'Condición no urgente. Monitoreo recomendado.'),
('Media', 'Atención requerida, posible complicación.'),
('Crítica', 'Emergencia médica o situación crítica.');

-- Tabla: AREA
INSERT INTO AREA (nombre, descripcion) VALUES
('Dormitorio', 'Área donde descansan los residentes.'),
('Comedor', 'Zona común para alimentos.'),
('Sala común', 'Espacio recreativo para convivencia.'),
('Chequeo médico', 'Área de revisión de signos vitales.'),
('Recepción', 'Ingreso principal al asilo.');

-- Tabla: ASILO
INSERT INTO ASILO (nombre, direccion, pais, ciudad, codigo_postal, telefono, correo, cantidad_residentes, cantidad_empleados) VALUES
('Aetheris Asylum', 'Av. Esperanza 456, Col. Tranquilidad', 'México', 'Tijuana', '22210', '6641234567', 'contacto@aetheris.mx', 3, 2);

-- Tabla: DISPOSITIVO
INSERT INTO DISPOSITIVO (direccion_MAC, estado) VALUES
('00:1A:7D:DA:71:01', TRUE),
('00:1A:7D:DA:71:02', TRUE),
('00:1A:7D:DA:71:03', FALSE); -- Este estará libre, no asignado a ningún residente

-- Tabla: RESIDENTE
INSERT INTO RESIDENTE (nombre, apellido, fecha_nacimiento, genero, telefono, dispositivo, foto) VALUES
('María', 'González', '1945-05-14', 'Femenino', '6649876543', 1, 'maria.jpg'),
('Jorge', 'Martínez', '1938-09-23', 'Masculino', '6641122334', 2, 'jorge.jpg'),
('Luz', 'Ramírez', '1940-01-30', 'Femenino', '6649988776', NULL, 'luz.jpg'); -- sin dispositivo aún

-- Tabla: PARENTESCO
INSERT INTO PARENTESCO (id_parentesco, parentesco) VALUES
(1, 'Hijo/a'),
(2, 'Cónyuge'),
(3, 'Hermano/a'),
(4, 'Nieto/a'),
(5, 'Sobrino/a');
(6, 'Otro');



-- Carlos González (Hijo de María González, id_residente = 1, id_parentesco = 1)
INSERT INTO FAMILIAR (
    nombre, apellido, fecha_nacimiento, genero,
    telefono, id_residente, id_parentesco, firebase_uid
) VALUES (
    'Carlos', 'González', '1975-08-10', 'Masculino',
    '6645551111', 1, 1, 'carlos_firebase_uid_1234567890'
);

-- Ana Martínez (Nieta de Jorge Martínez, id_residente = 2, id_parentesco = 2)
INSERT INTO FAMILIAR (
    nombre, apellido, fecha_nacimiento, genero,
    telefono, id_residente, id_parentesco, firebase_uid
) VALUES (
    'Ana', 'Martínez', '2000-03-22', 'Femenino',
    '6644442222', 2, 2, 'ana_firebase_uid_1234567890'
);

-- Elihu Moreno (Nieta de Jorge Martínez, id_residente = 3, id_parentesco = 2)
INSERT INTO FAMILIAR (
    nombre, apellido, fecha_nacimiento, genero,
    telefono, id_residente, id_parentesco, firebase_uid
) VALUES (
    'Elihu', 'Moreno', '2005-03-29', 'Masculino',
    '6644442222', 3, 2, 'elihu_firebase_uid_1234567890'
);


-- Luisa Mendoza (Administrador)
INSERT INTO PERSONAL (
    nombre, apellido, fecha_nacimiento, genero,
    telefono, firebase_uid
) VALUES (
    'Luisa', 'Mendoza', '1985-02-15', 'Femenino',
    '6643217890', 'luisa_firebase_uid_1234567890'
);

-- Roberto Delgado (Empleado)
INSERT INTO PERSONAL (
    nombre, apellido, fecha_nacimiento, genero,
    telefono, firebase_uid
) VALUES (
    'Roberto', 'Delgado', '1990-07-03', 'Masculino',
    '6646543210', 'roberto_firebase_uid_1234567890'
);



-- Tabla: CHEQUEO
INSERT INTO CHEQUEO (id_residente, frecuencia_cardiaca, oxigeno, peso, observaciones) VALUES
(1, 72, 97.5, 60.2, 'Chequeo normal.'),
(2, 88, 94.2, 72.4, 'Frecuencia cardíaca algo elevada.'),
(1, 76, 98.0, 60.0, 'Todo en orden.'),
(3, 80, 96.7, 55.1, 'Nuevo ingreso, chequeo inicial.');

-- Tabla: ALERTA
-- Solo se requiere una de las llaves foráneas (por ejemplo, residente y tipo)
INSERT INTO ALERTA (id_residente, id_alerta_tipo, mensaje) VALUES
(2, 3, 'Frecuencia cardíaca crítica detectada.'),
(1, 2, 'Oxigenación ligeramente baja.'),
(3, 1, 'Chequeo normal sin anomalías.');


-- Tabla: OBSERVACIONES

INSERT INTO OBSERVACIONES (id_residente, observacion) VALUES
(1, 'Alergia severa a la penicilina. No administrar bajo ninguna circunstancia.'),
(2, 'Diagnóstico reciente de hipertensión. Bajo tratamiento con Losartán.'),
(3, 'Historial de caídas nocturnas. Requiere revisión cada 2 horas por la noche.'),
(1, 'Residente con dieta especial: bajo sodio y sin azúcares refinados.'),
(2, 'Uso de marcapasos. Se debe evitar el uso de dispositivos electromagnéticos cercanos.');


-- Tabla: NOTAS
INSERT INTO NOTAS (id_familiar, nota) VALUES
(1, 'El residente será operado el 10 de julio. Favor de informar cualquier cambio en su estado.'),
(2, 'El residente recibirá la visita de su hermana, Carmen Ruiz, el próximo viernes.'),
(3, 'Solicito notificación inmediata si hay cambios en su medicación.'),
(1, 'Estaremos fuera del país del 15 al 30 de julio. Cualquier emergencia comunicarse con la tía del residente.'),
(2, 'Favor de permitir videollamada con el nieto del residente el domingo por la tarde.');

