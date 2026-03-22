-- ESTRUCTURA Y DATOS RENOVA CLINIC
-- Base de datos completa con todas las tablas y datos de prueba
DROP DATABASE IF EXISTS renova_clinica;
CREATE DATABASE IF NOT EXISTS renova_clinica;
USE renova_clinica;

-- ===========================
-- TABLAS
-- ===========================

-- Sucursales
CREATE TABLE IF NOT EXISTS sucursales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB;

-- Permisos
CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB;

-- Relación Role-Permisos
CREATE TABLE IF NOT EXISTS role_permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permiso_id INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permiso_id)
) ENGINE=InnoDB;

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  sucursal_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Áreas de Servicio
CREATE TABLE IF NOT EXISTS areas_servicio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB;

-- Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  duracion_minutos INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (area_id) REFERENCES areas_servicio(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  sucursal_registro_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (sucursal_registro_id) REFERENCES sucursales(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Citas
CREATE TABLE IF NOT EXISTS citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  especialista_id INT NOT NULL,
  servicio_id INT NOT NULL,
  sucursal_id INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
  notas_recepcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (especialista_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Notas Clínicas
CREATE TABLE IF NOT EXISTS notas_clinicas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cita_id INT NOT NULL,
  usuario_id INT NOT NULL,
  nota TEXT NOT NULL,
  observaciones TEXT,
  diagnostico TEXT,
  tratamiento_realizado TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Categorías de Productos
CREATE TABLE IF NOT EXISTS categorias_productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB;

-- Productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria_id INT NOT NULL,
  unidad VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (categoria_id) REFERENCES categorias_productos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Inventario por Sucursal
CREATE TABLE IF NOT EXISTS inventario_sucursal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  sucursal_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_product_sucursal (producto_id, sucursal_id)
) ENGINE=InnoDB;

-- Movimientos de Inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  sucursal_id INT NOT NULL,
  usuario_id INT NOT NULL,
  cantidad INT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===========================
-- DATOS DE PRUEBA
-- ===========================

-- SUCURSALES
INSERT INTO sucursales (nombre, direccion, telefono) VALUES 
('Sucursal Centro', 'Av. Principal 123', '555-123456'),
('Sucursal Norte', 'Calle Norte 456', '555-234567'),
('Sucursal Sur', 'Av. Sur 789', '555-345678');

-- ROLES
INSERT INTO roles (nombre) VALUES 
('Gerente'),
('Especialista'),
('Recepcionista');

-- PERMISOS
INSERT INTO permisos (nombre) VALUES 
('ver_citas'),
('crear_cita'),
('editar_cita'),
('eliminar_cita'),
('ver_pacientes'),
('crear_paciente'),
('editar_paciente'),
('ver_inventario'),
('editar_inventario'),
('ver_reportes'),
('crear_usuario'),
('editar_usuario');

-- ROLE_PERMISOS
-- Gerente: acceso total
INSERT INTO role_permisos (role_id, permiso_id) VALUES 
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12);

-- Especialista: ver citas, pacientes, reportes
INSERT INTO role_permisos (role_id, permiso_id) VALUES 
(2, 1), (2, 5), (2, 7), (2, 10);

-- Recepcionista: gestionar citas y pacientes
INSERT INTO role_permisos (role_id, permiso_id) VALUES 
(3, 1), (3, 2), (3, 3), (3, 5), (3, 6), (3, 7);

-- USUARIOS
INSERT INTO usuarios (nombre, email, password_hash, role_id, sucursal_id) VALUES 
-- Gerentes
('gerente1', 'gerente1@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 1, 1),
('gerente2', 'gerente2@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 1, 2),

-- Especialistas
('esp1', 'esp1@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 2, 1),
('esp2', 'esp2@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 2, 1),
('esp3', 'esp3@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 2, 2),

-- Recepcionistas
('recep1', 'recep1@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 3, 1),
('recep2', 'recep2@clinica.com', '$2b$10$zdxtSS7ggbHrt/yDJqbUte2Hl8IT4XSbzOoUFX9pzidXFbs8auMYi', 3, 2);

-- AREAS DE SERVICIO
INSERT INTO areas_servicio (nombre) VALUES 
('Dental'),
('Oftalmología'),
('Terapia y Spa');

-- SERVICIOS
INSERT INTO servicios (area_id, nombre, duracion_minutos) VALUES 
-- Dental
(1, 'Limpieza dental', 30),
(1, 'Empaste simple', 45),
(1, 'Extracción', 40),
(1, 'Ortodoncia consulta', 60),
(1, 'Blanqueamiento dental', 45),

-- Oftalmología
(2, 'Examen visual básico', 30),
(2, 'Ajuste de lentes', 20),
(2, 'Evaluación para anteojos', 45),
(2, 'Calibración de cristales', 25),

-- Terapia y Spa
(3, 'Masaje relajante', 60),
(3, 'Masaje terapéutico', 75),
(3, 'Tratamiento facial', 50),
(3, 'Reflexología', 45);

-- PACIENTES
INSERT INTO pacientes (nombre, apellido, telefono, email, sucursal_registro_id) VALUES 
('María', 'García López', '555-0001', 'maria.garcia@email.com', 1),
('Juan', 'Pérez Martínez', '555-0002', 'juan.perez@email.com', 1),
('Ana', 'Martínez Silva', '555-0003', 'ana.martinez@email.com', 1),
('Carlos', 'Rodríguez González', '555-0004', 'carlos.rodriguez@email.com', 1),
('Laura', 'Sánchez García', '555-0005', 'laura.sanchez@email.com', 1),
('Roberto', 'Díaz Torres', '555-0006', 'roberto.diaz@email.com', 1),
('Patricia', 'López Fernández', '555-0007', 'patricia.lopez@email.com', 1),
('Miguel', 'Gómez Ramírez', '555-0008', 'miguel.gomez@email.com', 1),
('Isabel', 'Fernández Ruiz', '555-0009', 'isabel.fernandez@email.com', 1),
('Francisco', 'Ramírez Molina', '555-0010', 'francisco.ramirez@email.com', 1);

-- CITAS
INSERT INTO citas (paciente_id, especialista_id, servicio_id, sucursal_id, fecha_hora, estado, notas_recepcion) VALUES 
-- Citas de hoy (21 marzo 2026) - Gerente puede ver estas
(1, 5, 1, 1, '2026-03-21 09:00:00', 'Completada', 'Paciente confirmado'),
(2, 5, 6, 1, '2026-03-21 10:30:00', 'Completada', 'Llegó 5 minutos temprano'),
(3, 5, 11, 1, '2026-03-21 11:00:00', 'Pendiente', 'Paciente en sala de espera'),
(4, 5, 2, 1, '2026-03-21 14:00:00', 'Pendiente', 'Paciente confirmó por teléfono'),
(5, 5, 12, 1, '2026-03-21 15:30:00', 'Pendiente', NULL),
(6, 5, 7, 1, '2026-03-21 16:00:00', 'Pendiente', 'Pendiente de confirmación'),

-- Citas pasadas
(7, 5, 3, 1, '2026-03-20 10:00:00', 'Completada', 'Extracción exitosa'),
(8, 5, 13, 1, '2026-03-20 11:30:00', 'Completada', 'Tratamiento completado'),
(9, 5, 8, 1, '2026-03-20 14:00:00', 'Completada', 'Ajuste satisfactorio'),

-- Citas futuras
(10, 5, 5, 1, '2026-03-22 09:30:00', 'Pendiente', NULL),
(1, 5, 10, 1, '2026-03-22 10:00:00', 'Pendiente', NULL),
(2, 5, 4, 1, '2026-03-22 11:00:00', 'Pendiente', NULL);

-- NOTAS CLÍNICAS
INSERT INTO notas_clinicas (cita_id, usuario_id, nota, observaciones, diagnostico, tratamiento_realizado) VALUES 
(1, 5, 'Paciente cooperativo, buena higiene', 'Paciente cooperativo, buena higiene', 'Placa dental moderada', 'Limpieza dental con ultrasonido'),
(2, 6, 'Sin problemas durante el procedimiento', 'Sin problemas durante el procedimiento', 'Astigmatismo leve OD', 'Prescripción de lentes actualizada'),
(8, 7, 'Anestesia local efectiva', 'Anestesia local efectiva', 'Pieza dental 37 cariada', 'Extracción dental con sutura');

-- CATEGORÍAS DE PRODUCTOS
INSERT INTO categorias_productos (nombre) VALUES 
('Material Dental'),
('Equipos Oftalmología'),
('Productos Spa'),
('Suministros Generales');

-- PRODUCTOS
INSERT INTO productos (nombre, descripcion, categoria_id, unidad) VALUES 
-- Material Dental
('Resina Composite A3', 'Resina dental de color A3 tipo universal', 1, 'jeringa'),
('Hilo Dental', 'Hilo dental para higiene', 1, 'metro'),
('Sellante Dental', 'Sellante dental preventivo', 1, 'frasco'),

-- Equipos Oftalmología
('Armazón Ray-Ban', 'Monturas de marca Ray-Ban', 2, 'unidad'),
('Lentes Anti-Reflejo', 'Cristales con filtro anti-reflejo', 2, 'par'),
('Solución Oftalmológica', 'Para limpieza de lentes', 2, 'frasco'),

-- Productos Spa
('Aceite de Lavanda', 'Aceite esencial puro de lavanda', 3, 'litro'),
('Crema Hidratante', 'Crema facial hidratante premium', 3, 'frasco'),
('Toallas de Algodón', 'Toallas premium para spa', 3, 'unidad'),

-- Suministros Generales
('Mascarilla Quirúrgica', 'Mascarilla triple capa', 4, 'caja'),
('Guantes de Nitrilo', 'Guantes para examinación', 4, 'caja'),
('Alcohol Desinfectante', 'Desinfectante 70%', 4, 'litro');

-- INVENTARIO POR SUCURSAL (Sucursal ID 1)
INSERT INTO inventario_sucursal (producto_id, sucursal_id, cantidad, stock_minimo) VALUES 
-- Material Dental
(1, 1, 5, 10),
(2, 1, 50, 20),
(3, 1, 8, 5),

-- Equipos Oftalmología  
(4, 1, 3, 8),
(5, 1, 12, 10),
(6, 1, 6, 5),

-- Productos Spa
(7, 1, 2, 5),
(8, 1, 15, 10),
(9, 1, 25, 20),

-- Suministros
(10, 1, 150, 100),
(11, 1, 200, 100),
(12, 1, 10, 5);

-- MOVIMIENTOS DE INVENTARIO
INSERT INTO movimientos_inventario (producto_id, sucursal_id, usuario_id, cantidad, tipo, comentario) VALUES 
-- Entradas (compras)
(1, 1, 1, 10, 'Entrada', 'Compra a proveedor dental'),
(2, 1, 1, 50, 'Entrada', 'Stock inicial'),
(4, 1, 1, 15, 'Entrada', 'Nuevo lote de armazones'),

-- Salidas (uso)
(1, 1, 2, 1, 'Salida', 'Usado en cita de María García'),
(4, 1, 3, 2, 'Salida', 'Vendidos a pacientes'),
(7, 1, 4, 1, 'Salida', 'Usado en masaje terapéutico'),

-- Ajustes
(3, 1, 1, 2, 'Ajuste', 'Ajuste de inventario fisico'),
(12, 1, 1, 5, 'Ajuste', 'Reposición por daño');
