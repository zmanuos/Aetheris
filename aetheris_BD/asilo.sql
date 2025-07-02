-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 02-07-2025 a las 21:06:13
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

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `asilo`
--
ALTER TABLE `asilo`
  ADD PRIMARY KEY (`id_asilo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `asilo`
--
ALTER TABLE `asilo`
  MODIFY `id_asilo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
