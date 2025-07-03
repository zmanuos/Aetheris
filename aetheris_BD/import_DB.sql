-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-07-2025 a las 21:50:37
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `aetheris`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alerta`
--

CREATE TABLE `alerta` (
  `id_alerta` int(11) NOT NULL,
  `id_residente` int(11) DEFAULT NULL,
  `id_alerta_tipo` int(11) DEFAULT NULL,
  `id_area` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `mensaje` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alerta`
--

INSERT INTO `alerta` (`id_alerta`, `id_residente`, `id_alerta_tipo`, `id_area`, `fecha`, `mensaje`) VALUES
(1, 2, 3, NULL, '2025-07-03 16:27:46', 'Frecuencia cardíaca crítica detectada.'),
(2, 1, 2, NULL, '2025-07-03 16:27:46', 'Oxigenación ligeramente baja.'),
(3, 3, 1, NULL, '2025-07-03 16:27:46', 'Chequeo normal sin anomalías.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alerta_tipo`
--

CREATE TABLE `alerta_tipo` (
  `id_alerta_tipo` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alerta_tipo`
--

INSERT INTO `alerta_tipo` (`id_alerta_tipo`, `nombre`, `descripcion`) VALUES
(1, 'Baja', 'Condición no urgente. Monitoreo recomendado.'),
(2, 'Media', 'Atención requerida, posible complicación.'),
(3, 'Crítica', 'Emergencia médica o situación crítica.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `area`
--

CREATE TABLE `area` (
  `id_area` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `area`
--

INSERT INTO `area` (`id_area`, `nombre`, `descripcion`) VALUES
(1, 'Dormitorio', 'Área donde descansan los residentes.'),
(2, 'Comedor', 'Zona común para alimentos.'),
(3, 'Sala común', 'Espacio recreativo para convivencia.'),
(4, 'Chequeo médico', 'Área de revisión de signos vitales.'),
(5, 'Recepción', 'Ingreso principal al asilo.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asilo`
--

CREATE TABLE `asilo` (
  `id_asilo` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `direccion` text NOT NULL,
  `pais` varchar(50) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `codigo_postal` varchar(10) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `cantidad_residentes` int(11) DEFAULT 0,
  `cantidad_empleados` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asilo`
--

INSERT INTO `asilo` (`id_asilo`, `nombre`, `direccion`, `pais`, `ciudad`, `codigo_postal`, `telefono`, `correo`, `cantidad_residentes`, `cantidad_empleados`) VALUES
(1, 'Aetheris Asylum', 'Av. Esperanza 456, Col. Tranquilidad', 'México', 'Tijuana', '22210', '6641234567', 'contacto@aetheris.mx', 3, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chequeo`
--

CREATE TABLE `chequeo` (
  `id_chequeo` int(11) NOT NULL,
  `id_residente` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `frecuencia_cardiaca` int(11) DEFAULT NULL,
  `oxigeno` decimal(4,2) DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `chequeo`
--

INSERT INTO `chequeo` (`id_chequeo`, `id_residente`, `fecha`, `frecuencia_cardiaca`, `oxigeno`, `peso`, `observaciones`) VALUES
(1, 1, '2025-07-03 16:27:46', 72, 97.50, 60.20, 'Chequeo normal.'),
(2, 2, '2025-07-03 16:27:46', 88, 94.20, 72.40, 'Frecuencia cardíaca algo elevada.'),
(3, 1, '2025-07-03 16:27:46', 76, 98.00, 60.00, 'Todo en orden.'),
(4, 3, '2025-07-03 16:27:46', 80, 96.70, 55.10, 'Nuevo ingreso, chequeo inicial.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dispositivo`
--

CREATE TABLE `dispositivo` (
  `id_dispositivo` int(11) NOT NULL,
  `direccion_MAC` varchar(30) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_asignacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `dispositivo`
--

INSERT INTO `dispositivo` (`id_dispositivo`, `direccion_MAC`, `estado`, `fecha_asignacion`) VALUES
(1, '00:1A:7D:DA:71:01', 1, '2025-07-03 16:27:45'),
(2, '00:1A:7D:DA:71:02', 1, '2025-07-03 16:27:45'),
(3, '00:1A:7D:DA:71:03', 0, '2025-07-03 16:27:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `familiar`
--

CREATE TABLE `familiar` (
  `id_familiar` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` varchar(10) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `id_residente` int(11) DEFAULT NULL,
  `id_parentesco` int(11) DEFAULT NULL,
  `firebase_uid` varchar(28) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `familiar`
--

INSERT INTO `familiar` (`id_familiar`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `telefono`, `id_residente`, `id_parentesco`, `firebase_uid`) VALUES
(1, 'Carlos', 'González', '1975-08-10', 'Masculino', '6645551111', 1, 1, 'carlos_firebase_uid_12345678'),
(2, 'Ana', 'Martínez', '2000-03-22', 'Femenino', '6644442222', 2, 2, 'ana_firebase_uid_1234567890'),
(3, 'Elihu', 'Moreno', '2005-03-29', 'Masculino', '6644442222', 3, 2, 'elihu_firebase_uid_123456789');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notas`
--

CREATE TABLE `notas` (
  `id_notas` int(11) NOT NULL,
  `id_familiar` int(11) DEFAULT NULL,
  `nota` text DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notas`
--

INSERT INTO `notas` (`id_notas`, `id_familiar`, `nota`, `fecha`, `activo`) VALUES
(1, 1, 'El residente será operado el 10 de julio. Favor de informar cualquier cambio en su estado.', '2025-07-03 16:32:13', 1),
(2, 2, 'El residente recibirá la visita de su hermana, Carmen Ruiz, el próximo viernes.', '2025-07-03 16:32:13', 1),
(3, 3, 'Solicito notificación inmediata si hay cambios en su medicación.', '2025-07-03 16:32:13', 1),
(4, 1, 'Estaremos fuera del país del 15 al 30 de julio. Cualquier emergencia comunicarse con la tía del residente.', '2025-07-03 16:32:13', 1),
(5, 2, 'Favor de permitir videollamada con el nieto del residente el domingo por la tarde.', '2025-07-03 16:32:13', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `observaciones`
--

CREATE TABLE `observaciones` (
  `id_observaciones` int(11) NOT NULL,
  `id_residente` int(11) DEFAULT NULL,
  `observacion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `observaciones`
--

INSERT INTO `observaciones` (`id_observaciones`, `id_residente`, `observacion`) VALUES
(6, 1, 'Alergia severa a la penicilina. No administrar bajo ninguna circunstancia.'),
(7, 2, 'Diagnóstico reciente de hipertensión. Bajo tratamiento con Losartán.'),
(8, 3, 'Historial de caídas nocturnas. Requiere revisión cada 2 horas por la noche.'),
(9, 1, 'Residente con dieta especial: bajo sodio y sin azúcares refinados.'),
(10, 2, 'Uso de marcapasos. Se debe evitar el uso de dispositivos electromagnéticos cercanos.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `parentesco`
--

CREATE TABLE `parentesco` (
  `id_parentesco` int(11) NOT NULL,
  `parentesco` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `parentesco`
--

INSERT INTO `parentesco` (`id_parentesco`, `parentesco`) VALUES
(1, 'Padre'),
(2, 'Madre'),
(3, 'Esposo(a)'),
(4, 'Hijo(a)'),
(5, 'Otro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personal`
--

CREATE TABLE `personal` (
  `id_personal` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` varchar(10) DEFAULT NULL,
  `telefono` varchar(10) DEFAULT NULL,
  `firebase_uid` varchar(28) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `personal`
--

INSERT INTO `personal` (`id_personal`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `telefono`, `firebase_uid`, `activo`) VALUES
(1, 'Luisa', 'Mendoza', '1985-02-15', 'Femenino', '6643217890', 'luisa_firebase_uid_123456789', 0),
(2, 'Roberto', 'Delgado', '1990-07-03', 'Masculino', '6646543210', 'roberto_firebase_uid_1234567', 0);

--
-- Disparadores `personal`
--
DELIMITER $$
CREATE TRIGGER `agregar_empleados` AFTER INSERT ON `personal` FOR EACH ROW UPDATE ASILO
SET cantidad_empleados = cantidad_empleados + 1
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `total_empleados` AFTER UPDATE ON `personal` FOR EACH ROW BEGIN
    IF OLD.activo != NEW.activo THEN
        UPDATE ASILO
        SET cantidad_empleados = (
            SELECT COUNT(*) FROM PERSONAL WHERE activo = TRUE
        );
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `residente`
--

CREATE TABLE `residente` (
  `id_residente` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` varchar(10) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `dispositivo` int(11) DEFAULT NULL,
  `id_foto` varchar(255) DEFAULT 'default',
  `fecha_ingreso` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `residente`
--

INSERT INTO `residente` (`id_residente`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `telefono`, `dispositivo`, `id_foto`, `fecha_ingreso`, `activo`) VALUES
(1, 'María', 'González', '1945-05-14', 'Femenino', '6649876543', 1, 'maria.jpg', '2025-07-03 16:27:45', 1),
(2, 'Jorge', 'Martínez', '1938-09-23', 'Masculino', '6641122334', 2, 'jorge.jpg', '2025-07-03 16:27:45', 1),
(3, 'Luz', 'Ramírez', '1940-01-30', 'Femenino', '6649988776', NULL, 'luz.jpg', '2025-07-03 16:27:45', 1);

--
-- Disparadores `residente`
--
DELIMITER $$
CREATE TRIGGER `activar_dispositivo_update` AFTER UPDATE ON `residente` FOR EACH ROW BEGIN
    IF NEW.dispositivo IS NOT NULL AND NEW.dispositivo != OLD.dispositivo THEN
        UPDATE DISPOSITIVO
        SET estado = TRUE
        WHERE id_dispositivo = NEW.dispositivo;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `agregar_residentes` AFTER INSERT ON `residente` FOR EACH ROW UPDATE ASILO
SET cantidad_residentes = cantidad_residentes + 1
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `total_residentes` AFTER UPDATE ON `residente` FOR EACH ROW BEGIN
    IF OLD.activo != NEW.activo THEN
        UPDATE ASILO
        SET cantidad_residentes = (
            SELECT COUNT(*) FROM RESIDENTE WHERE activo = TRUE
        );
    END IF;
END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alerta`
--
ALTER TABLE `alerta`
  ADD PRIMARY KEY (`id_alerta`),
  ADD KEY `id_residente` (`id_residente`),
  ADD KEY `id_alerta_tipo` (`id_alerta_tipo`),
  ADD KEY `id_area` (`id_area`);

--
-- Indices de la tabla `alerta_tipo`
--
ALTER TABLE `alerta_tipo`
  ADD PRIMARY KEY (`id_alerta_tipo`);

--
-- Indices de la tabla `area`
--
ALTER TABLE `area`
  ADD PRIMARY KEY (`id_area`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `asilo`
--
ALTER TABLE `asilo`
  ADD PRIMARY KEY (`id_asilo`);

--
-- Indices de la tabla `chequeo`
--
ALTER TABLE `chequeo`
  ADD PRIMARY KEY (`id_chequeo`),
  ADD KEY `id_residente` (`id_residente`);

--
-- Indices de la tabla `dispositivo`
--
ALTER TABLE `dispositivo`
  ADD PRIMARY KEY (`id_dispositivo`),
  ADD UNIQUE KEY `direccion_MAC` (`direccion_MAC`);

--
-- Indices de la tabla `familiar`
--
ALTER TABLE `familiar`
  ADD PRIMARY KEY (`id_familiar`),
  ADD UNIQUE KEY `firebase_uid` (`firebase_uid`),
  ADD KEY `id_parentesco` (`id_parentesco`),
  ADD KEY `id_residente` (`id_residente`);

--
-- Indices de la tabla `notas`
--
ALTER TABLE `notas`
  ADD PRIMARY KEY (`id_notas`),
  ADD KEY `id_familiar` (`id_familiar`);

--
-- Indices de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD PRIMARY KEY (`id_observaciones`),
  ADD KEY `id_residente` (`id_residente`);

--
-- Indices de la tabla `parentesco`
--
ALTER TABLE `parentesco`
  ADD PRIMARY KEY (`id_parentesco`);

--
-- Indices de la tabla `personal`
--
ALTER TABLE `personal`
  ADD PRIMARY KEY (`id_personal`),
  ADD UNIQUE KEY `firebase_uid` (`firebase_uid`);

--
-- Indices de la tabla `residente`
--
ALTER TABLE `residente`
  ADD PRIMARY KEY (`id_residente`),
  ADD KEY `dispositivo` (`dispositivo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alerta`
--
ALTER TABLE `alerta`
  MODIFY `id_alerta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `alerta_tipo`
--
ALTER TABLE `alerta_tipo`
  MODIFY `id_alerta_tipo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `area`
--
ALTER TABLE `area`
  MODIFY `id_area` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `asilo`
--
ALTER TABLE `asilo`
  MODIFY `id_asilo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `chequeo`
--
ALTER TABLE `chequeo`
  MODIFY `id_chequeo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `dispositivo`
--
ALTER TABLE `dispositivo`
  MODIFY `id_dispositivo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `familiar`
--
ALTER TABLE `familiar`
  MODIFY `id_familiar` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `notas`
--
ALTER TABLE `notas`
  MODIFY `id_notas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `observaciones`
--
ALTER TABLE `observaciones`
  MODIFY `id_observaciones` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `parentesco`
--
ALTER TABLE `parentesco`
  MODIFY `id_parentesco` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `personal`
--
ALTER TABLE `personal`
  MODIFY `id_personal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `residente`
--
ALTER TABLE `residente`
  MODIFY `id_residente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alerta`
--
ALTER TABLE `alerta`
  ADD CONSTRAINT `alerta_ibfk_1` FOREIGN KEY (`id_residente`) REFERENCES `residente` (`id_residente`),
  ADD CONSTRAINT `alerta_ibfk_2` FOREIGN KEY (`id_alerta_tipo`) REFERENCES `alerta_tipo` (`id_alerta_tipo`),
  ADD CONSTRAINT `alerta_ibfk_3` FOREIGN KEY (`id_area`) REFERENCES `area` (`id_area`);

--
-- Filtros para la tabla `chequeo`
--
ALTER TABLE `chequeo`
  ADD CONSTRAINT `chequeo_ibfk_1` FOREIGN KEY (`id_residente`) REFERENCES `residente` (`id_residente`);

--
-- Filtros para la tabla `familiar`
--
ALTER TABLE `familiar`
  ADD CONSTRAINT `familiar_ibfk_1` FOREIGN KEY (`id_parentesco`) REFERENCES `parentesco` (`id_parentesco`),
  ADD CONSTRAINT `familiar_ibfk_2` FOREIGN KEY (`id_residente`) REFERENCES `residente` (`id_residente`);

--
-- Filtros para la tabla `notas`
--
ALTER TABLE `notas`
  ADD CONSTRAINT `notas_ibfk_1` FOREIGN KEY (`id_familiar`) REFERENCES `familiar` (`id_familiar`);

--
-- Filtros para la tabla `observaciones`
--
ALTER TABLE `observaciones`
  ADD CONSTRAINT `observaciones_ibfk_1` FOREIGN KEY (`id_residente`) REFERENCES `familiar` (`id_residente`);

--
-- Filtros para la tabla `residente`
--
ALTER TABLE `residente`
  ADD CONSTRAINT `residente_ibfk_1` FOREIGN KEY (`dispositivo`) REFERENCES `dispositivo` (`id_dispositivo`);

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `desactivar_notas_antiguas` ON SCHEDULE EVERY 1 DAY STARTS '2025-07-03 12:44:45' ON COMPLETION NOT PRESERVE ENABLE DO UPDATE NOTAS
  SET activo = FALSE
  WHERE activo = TRUE AND fecha < NOW() - INTERVAL 5 DAY$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
