const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middlewares/auth.middleware');
const { verificarPermiso, soloEspecialista } = require('../middlewares/permisos.middleware');

// === RUTAS PARA CITAS ===

// Obtener todas las citas de una sucursal
router.get('/sucursal/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const [citas] = await pool.query(
            `SELECT c.id, 
                    c.paciente_id,
                    c.especialista_id,
                    c.servicio_id,
                    c.sucursal_id,
                    DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i:%s') as fecha_hora,
                    c.estado,
                    CONCAT(COALESCE(p.nombre, 'Sin asignar'), ' ', COALESCE(p.apellido, '')) as paciente_nombre,
                    COALESCE(p.telefono, 'N/A') as telefono,
                    COALESCE(p.email, 'N/A') as paciente_email,
                    COALESCE(u.nombre, 'Sin asignar') as profesional_nombre,
                    COALESCE(s.nombre, 'Sin servicio') as especialidad,
                    COALESCE(s.duracion_minutos, 0) as duracion_minutos,
                    COALESCE(a.nombre, 'Sin área') as area
             FROM citas c
             LEFT JOIN pacientes p ON c.paciente_id = p.id
             LEFT JOIN usuarios u ON c.especialista_id = u.id
             LEFT JOIN servicios s ON c.servicio_id = s.id
             LEFT JOIN areas_servicio a ON s.area_id = a.id
             WHERE c.sucursal_id = ?
             ORDER BY c.fecha_hora ASC`,
            [sucursalId]
        );
        res.json(citas);
    } catch (error) {
        console.error('Error en sucursal:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas', error: error.message });
    }
});

// Obtener citas del día para dashboard (solo citas de hoy desde la hora actual)
router.get('/hoy/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;

        const [citas] = await pool.query(
            `SELECT c.id, 
                    c.paciente_id,
                    c.especialista_id,
                    c.servicio_id,
                    c.sucursal_id,
                    DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i:%s') as fecha_hora,
                    c.estado,
                    CONCAT(COALESCE(p.nombre, 'Sin asignar'), ' ', COALESCE(p.apellido, '')) as paciente_nombre,
                    COALESCE(p.telefono, 'N/A') as telefono,
                    COALESCE(p.email, 'N/A') as paciente_email,
                    COALESCE(u.nombre, 'Sin asignar') as profesional_nombre,
                    COALESCE(s.nombre, 'Sin servicio') as especialidad,
                    COALESCE(s.duracion_minutos, 0) as duracion_minutos,
                    COALESCE(a.nombre, 'Sin área') as area
             FROM citas c
             LEFT JOIN pacientes p ON c.paciente_id = p.id
             LEFT JOIN usuarios u ON c.especialista_id = u.id
             LEFT JOIN servicios s ON c.servicio_id = s.id
             LEFT JOIN areas_servicio a ON s.area_id = a.id
             WHERE c.sucursal_id = ? AND DATE(c.fecha_hora) = DATE(NOW()) AND TIME(c.fecha_hora) >= TIME(NOW())
             ORDER BY c.fecha_hora ASC`,
            [sucursalId]
        );
        res.json(citas);
    } catch (error) {
        console.error('Error en hoy:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas del día', error: error.message });
    }
});

// Obtener citas pendientes de confirmar
router.get('/pendientes/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const [citas] = await pool.query(
            `SELECT COUNT(*) as total FROM citas 
             WHERE sucursal_id = ? AND estado = 'Pendiente'`,
            [sucursalId]
        );
        res.json(citas[0]);
    } catch (error) {
        console.error('Error en pendientes:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas pendientes', error: error.message });
    }
});

// Obtener pacientes en sala de espera (citas de hoy pendientes o en progreso)
router.get('/espera/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const today = new Date().toISOString().split('T')[0];
        const [pacientes] = await pool.query(
            `SELECT c.id, 
                    c.paciente_id,
                    c.especialista_id,
                    c.servicio_id,
                    c.sucursal_id,
                    DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i:%s') as fecha_hora,
                    c.estado,
                    CONCAT(COALESCE(p.nombre, 'Sin asignar'), ' ', COALESCE(p.apellido, '')) as paciente_nombre,
                    COALESCE(u.nombre, 'Sin asignar') as profesional_nombre,
                    COALESCE(s.nombre, 'Sin servicio') as especialidad
             FROM citas c
             LEFT JOIN pacientes p ON c.paciente_id = p.id
             LEFT JOIN usuarios u ON c.especialista_id = u.id
             LEFT JOIN servicios s ON c.servicio_id = s.id
             WHERE c.sucursal_id = ? AND DATE(c.fecha_hora) = ? AND c.estado IN ('Pendiente', 'Completada')
             ORDER BY c.fecha_hora ASC`,
            [sucursalId, today]
        );
        res.json(pacientes);
    } catch (error) {
        console.error('Error en espera:', error);
        res.status(500).json({ mensaje: 'Error al obtener pacientes en espera', error: error.message });
    }
});

// Verificar disponibilidad de especialista en un horario
router.post('/verificar-disponibilidad', verificarToken, async (req, res) => {
    try {
        const { especialista_id, fecha_hora, cita_id } = req.body;

        if (!especialista_id || !fecha_hora) {
            return res.status(400).json({
                disponible: false,
                mensaje: 'Especialista y fecha/hora son requeridos'
            });
        }

        // Convertir formato DD/MM/YYYYTHH:MM a YYYY-MM-DDTHH:MM
        let fechaHoraFormatted = fecha_hora;
        
        // Si viene en formato DD/MM/YYYYTHH:MM
        if (fecha_hora.includes('/')) {
            const [fecha, hora] = fecha_hora.split('T');
            const [dia, mes, ano] = fecha.split('/');
            fechaHoraFormatted = `${ano}-${mes}-${dia}T${hora}`;
        }
        
        // Agrega :00 si falta segundos
        if (fechaHoraFormatted.includes(':') && fechaHoraFormatted.split(':').length === 2) {
            fechaHoraFormatted = fechaHoraFormatted + ':00';
        }

        console.log('Verificando disponibilidad:');
        console.log('  Especialista:', especialista_id);
        console.log('  FechaHora recibida:', fecha_hora);
        console.log('  FechaHora formateada:', fechaHoraFormatted);
        console.log('  CitaId (edición):', cita_id);

        // Buscar citas del especialista en la misma fecha y hora
        let query = `SELECT c.id FROM citas c
                     WHERE c.especialista_id = ? 
                     AND DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i') = ?
                     AND c.estado = 'Pendiente'`;

        let params = [especialista_id, fechaHoraFormatted.substring(0, 16)];

        // Si estamos editando, excluir la cita actual
        if (cita_id) {
            query += ` AND c.id != ?`;
            params.push(cita_id);
        }

        const [citasConflicto] = await pool.query(query, params);

        console.log('Citas encontradas con conflicto:', citasConflicto.length);

        if (citasConflicto.length > 0) {
            return res.json({
                disponible: false,
                mensaje: 'El especialista ya tiene una cita a esa hora',
                conflicto: true
            });
        }

        res.json({
            disponible: true,
            mensaje: 'Horario disponible'
        });
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        res.status(500).json({
            disponible: false,
            mensaje: 'Error al verificar disponibilidad',
            error: error.message
        });
    }
});

// Crear nueva cita
router.post('/', verificarToken, verificarPermiso('crear_cita'), async (req, res) => {
    try {
        const { paciente_id, especialista_id, servicio_id, sucursal_id, fecha_hora, estado } = req.body;

        console.log('Creando cita con datos:', {
            paciente_id, especialista_id, servicio_id, sucursal_id, fecha_hora, estado
        });

        // Convertir fecha ISO 8601 (2026-03-21T15:30:00.000Z) a formato MySQL (2026-03-21 15:30:00)
        let fechaFormato = fecha_hora;
        if (fecha_hora && fecha_hora.includes('T')) {
            // Es ISO 8601, convertir a YYYY-MM-DD HH:MM:SS
            const fecha = new Date(fecha_hora);
            fechaFormato = fecha.toISOString().slice(0, 19).replace('T', ' ');
            console.log('Fecha convertida de ISO 8601 a:', fechaFormato);
        }

        const [result] = await pool.query(
            `INSERT INTO citas (paciente_id, especialista_id, servicio_id, sucursal_id, fecha_hora, estado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [paciente_id, especialista_id, servicio_id, sucursal_id, fechaFormato, estado || 'Pendiente']
        );

        console.log('Cita creada con ID:', result.insertId);
        res.status(201).json({
            mensaje: 'Cita creada exitosamente',
            citaId: result.insertId
        });
    } catch (error) {
        console.error('Error detallado al crear cita:', error);
        res.status(500).json({
            mensaje: 'Error al crear cita',
            error: error.message
        });
    }
});

// Actualizar cita
router.put('/:citaId', verificarToken, verificarPermiso('editar_cita'), async (req, res) => {
    try {
        const { citaId } = req.params;
        const { estado, fecha_hora } = req.body;

        console.log('=== ACTUALIZANDO CITA ===');
        console.log('ID de cita:', citaId);
        console.log('Datos recibidos:', { estado, fecha_hora });

        // Convertir fecha ISO 8601 a formato MySQL si es necesario
        let fechaFormato = fecha_hora;
        if (fecha_hora && fecha_hora.includes('T')) {
            const fecha = new Date(fecha_hora);
            // Extraer solo la parte de tiempo sin convertir, porque ya viene en el formato que queremos
            const [datePart] = fecha_hora.split('T');
            const timePart = fecha_hora.split('T')[1].split('.')[0];
            fechaFormato = `${datePart} ${timePart}`;
            console.log('Fecha convertida a MySQL:', fechaFormato);
        }

        const [result] = await pool.query(
            `UPDATE citas SET estado = ?, fecha_hora = ? WHERE id = ?`,
            [estado, fechaFormato, citaId]
        );

        console.log('Resultado de actualizacion:', result);

        if (result.affectedRows === 0) {
            console.warn('Advertencia: No se actualizó ninguna cita');
            return res.status(404).json({
                mensaje: 'Cita no encontrada',
                error: 'No existe una cita con ese ID'
            });
        }

        console.log('Cita actualizada exitosamente');
        res.json({ mensaje: 'Cita actualizada exitosamente' });
    } catch (error) {
        console.error('Error detallado al actualizar cita:', error);
        res.status(500).json({
            mensaje: 'Error al actualizar cita',
            error: error.message
        });
    }
});

// Eliminar cita
router.delete('/:citaId', verificarToken, verificarPermiso('eliminar_cita'), async (req, res) => {
    try {
        const { citaId } = req.params;

        // Primero eliminar notas clínicas asociadas
        await pool.query('DELETE FROM notas_clinicas WHERE cita_id = ?', [citaId]);

        // Luego eliminar la cita
        await pool.query('DELETE FROM citas WHERE id = ?', [citaId]);

        res.json({ mensaje: 'Cita eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar cita' });
    }
});

// Obtener notas clínicas de una cita
router.get('/notas/:citaId', async (req, res) => {
    try {
        const { citaId } = req.params;
        const [notas] = await pool.query(
            `SELECT nc.id, nc.cita_id, nc.usuario_id, nc.nota, nc.observaciones, 
                    nc.diagnostico, nc.tratamiento_realizado, nc.created_at 
             FROM notas_clinicas nc 
             WHERE nc.cita_id = ? 
             ORDER BY nc.created_at DESC`,
            [citaId]
        );
        res.json(notas);
    } catch (error) {
        console.error('Error al obtener notas:', error);
        res.status(500).json({ mensaje: 'Error al obtener notas clínicas', error: error.message });
    }
});

// Crear nueva nota clínica
router.post('/notas', verificarToken, verificarPermiso('crear_nota_clinica'), async (req, res) => {
    try {
        const { cita_id, nota, usuario_id, observaciones, diagnostico, tratamiento_realizado } = req.body;

        if (!cita_id || !nota || !usuario_id) {
            return res.status(400).json({ mensaje: 'cita_id, nota y usuario_id son requeridos' });
        }

        const [result] = await pool.query(
            `INSERT INTO notas_clinicas (cita_id, usuario_id, nota, observaciones, diagnostico, tratamiento_realizado) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [cita_id, usuario_id, nota, observaciones || null, diagnostico || null, tratamiento_realizado || null]
        );

        res.status(201).json({
            mensaje: 'Nota clínica creada exitosamente',
            notaId: result.insertId
        });
    } catch (error) {
        console.error('Error al crear nota:', error);
        res.status(500).json({ mensaje: 'Error al crear nota clínica', error: error.message });
    }
});

// Actualizar nota clínica
router.put('/notas/:notaId', verificarToken, verificarPermiso('editar_nota_clinica'), async (req, res) => {
    try {
        const { notaId } = req.params;
        const { nota, observaciones, diagnostico, tratamiento_realizado } = req.body;

        if (!nota) {
            return res.status(400).json({ mensaje: 'La nota es requerida' });
        }

        await pool.query(
            `UPDATE notas_clinicas SET nota = ?, observaciones = ?, diagnostico = ?, tratamiento_realizado = ? WHERE id = ?`,
            [nota, observaciones || null, diagnostico || null, tratamiento_realizado || null, notaId]
        );

        res.json({ mensaje: 'Nota clínica actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar nota:', error);
        res.status(500).json({ mensaje: 'Error al actualizar nota clínica', error: error.message });
    }
});

// Eliminar nota clínica
router.delete('/notas/:notaId', verificarToken, verificarPermiso('editar_nota_clinica'), async (req, res) => {
    try {
        const { notaId } = req.params;

        await pool.query(
            `DELETE FROM notas_clinicas WHERE id = ?`,
            [notaId]
        );

        res.json({ mensaje: 'Nota clínica eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar nota:', error);
        res.status(500).json({ mensaje: 'Error al eliminar nota clínica', error: error.message });
    }
});

// Próximas citas de la siguiente semana (para especialista)
router.get('/especialista/:especialistaId/siguiente-semana', async (req, res) => {
    try {
        const { especialistaId } = req.params;

        // Obtener fechas: próximo lunes y domingo
        const hoy = new Date();
        const proximoLunes = new Date(hoy);
        proximoLunes.setDate(hoy.getDate() + (1 + 7 - hoy.getDay()) % 7);

        const proximoDomingo = new Date(proximoLunes);
        proximoDomingo.setDate(proximoLunes.getDate() + 6);

        const fechaInicio = proximoLunes.toISOString().split('T')[0];
        const fechaFin = proximoDomingo.toISOString().split('T')[0];

        const [citas] = await pool.query(
            `SELECT c.id, 
                    c.paciente_id,
                    c.especialista_id,
                    c.servicio_id,
                    c.sucursal_id,
                    DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i:%s') as fecha_hora,
                    c.estado,
                    CONCAT(COALESCE(p.nombre, 'Sin asignar'), ' ', COALESCE(p.apellido, '')) as paciente_nombre,
                    COALESCE(p.telefono, 'N/A') as telefono,
                    COALESCE(p.email, 'N/A') as paciente_email,
                    COALESCE(s.nombre, 'Sin servicio') as especialidad,
                    COALESCE(s.duracion_minutos, 0) as duracion_minutos,
                    COALESCE(a.nombre, 'Sin área') as area
             FROM citas c
             LEFT JOIN pacientes p ON c.paciente_id = p.id
             LEFT JOIN servicios s ON c.servicio_id = s.id
             LEFT JOIN areas_servicio a ON s.area_id = a.id
             WHERE c.especialista_id = ? AND DATE(c.fecha_hora) >= ? AND DATE(c.fecha_hora) <= ?
             ORDER BY c.fecha_hora ASC`,
            [especialistaId, fechaInicio, fechaFin]
        );

        res.json(citas);
    } catch (error) {
        console.error('Error en siguiente-semana:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas de siguiente semana', error: error.message });
    }
});

// Estadísticas de citas completadas por especialista
router.get('/especialista/:especialistaId/estadisticas', async (req, res) => {
    try {
        const { especialistaId } = req.params;

        // Completadas esta semana
        const [completadasSemana] = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as total FROM citas 
             WHERE especialista_id = ? AND estado = 'Completada' 
             AND YEARWEEK(fecha_hora) = YEARWEEK(NOW())`,
            [especialistaId]
        );

        // Completadas este mes
        const [completadasMes] = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as total FROM citas 
             WHERE especialista_id = ? AND estado = 'Completada' 
             AND YEAR(fecha_hora) = YEAR(NOW()) 
             AND MONTH(fecha_hora) = MONTH(NOW())`,
            [especialistaId]
        );

        // Completadas totales
        const [completadasTotal] = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as total FROM citas 
             WHERE especialista_id = ? AND estado = 'Completada'`,
            [especialistaId]
        );

        // Completadas por semana del mes actual
        const [porSemana] = await pool.query(
            `SELECT 
                WEEK(fecha_hora) as semana,
                COALESCE(COUNT(*), 0) as total
             FROM citas 
             WHERE especialista_id = ? AND estado = 'Completada' 
             AND YEAR(fecha_hora) = YEAR(NOW())
             AND MONTH(fecha_hora) = MONTH(NOW())
             GROUP BY WEEK(fecha_hora)
             ORDER BY WEEK(fecha_hora)`,
            [especialistaId]
        );

        res.json({
            completadas_semana: completadasSemana[0].total,
            completadas_mes: completadasMes[0].total,
            completadas_total: completadasTotal[0].total,
            por_semana: porSemana
        });
    } catch (error) {
        console.error('Error en estadísticas:', error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
    }
});

// Obtener citas filtradas por mes
router.get('/mes/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const { mes, anio } = req.query;

        // Si no se proporcionan mes y año, usar el mes actual
        const fecha = new Date();
        const mesActual = mes ? parseInt(mes) : fecha.getMonth() + 1;
        const anioActual = anio ? parseInt(anio) : fecha.getFullYear();

        const [citas] = await pool.query(
            `SELECT c.id, 
                    c.paciente_id,
                    c.especialista_id,
                    c.servicio_id,
                    c.sucursal_id,
                    DATE_FORMAT(c.fecha_hora, '%Y-%m-%dT%H:%i:%s') as fecha_hora,
                    c.estado,
                    CONCAT(COALESCE(p.nombre, 'Sin asignar'), ' ', COALESCE(p.apellido, '')) as paciente_nombre,
                    COALESCE(p.telefono, 'N/A') as telefono,
                    COALESCE(p.email, 'N/A') as paciente_email,
                    COALESCE(u.nombre, 'Sin asignar') as profesional_nombre,
                    COALESCE(s.nombre, 'Sin servicio') as especialidad,
                    COALESCE(s.duracion_minutos, 0) as duracion_minutos,
                    COALESCE(a.nombre, 'Sin área') as area
             FROM citas c
             LEFT JOIN pacientes p ON c.paciente_id = p.id
             LEFT JOIN usuarios u ON c.especialista_id = u.id
             LEFT JOIN servicios s ON c.servicio_id = s.id
             LEFT JOIN areas_servicio a ON s.area_id = a.id
             WHERE c.sucursal_id = ? AND YEAR(c.fecha_hora) = ? AND MONTH(c.fecha_hora) = ?
             ORDER BY c.fecha_hora ASC`,
            [sucursalId, anioActual, mesActual]
        );

        res.json(citas);
    } catch (error) {
        console.error('Error en mes:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas del mes', error: error.message });
    }
});

// Obtener métricas del dashboard
router.get('/metricas/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;

        const [citasHoy] = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as total FROM citas WHERE sucursal_id = ? AND DATE(fecha_hora) = DATE(NOW()) AND TIME(fecha_hora) >= TIME(NOW())`,
            [sucursalId]
        );

        const [pacientesActivos] = await pool.query(
            `SELECT COALESCE(COUNT(DISTINCT p.id), 0) as total FROM pacientes p
             LEFT JOIN citas c ON p.id = c.paciente_id
             WHERE c.sucursal_id = ?`,
            [sucursalId]
        );

        const [completadas] = await pool.query(
            `SELECT COALESCE(COUNT(*), 0) as total FROM citas WHERE sucursal_id = ? AND estado = 'Completada' AND DATE(fecha_hora) = DATE(NOW())`,
            [sucursalId]
        );

        res.json({
            citas_hoy: citasHoy[0].total || 0,
            pacientes_activos: pacientesActivos[0].total || 0,
            completadas: completadas[0].total || 0
        });
    } catch (error) {
        console.error('Error en metricas:', error);
        res.status(500).json({ mensaje: 'Error al obtener métricas', error: error.message });
    }
});

// Obtener rendimiento del personal (citas completadas por especialista en el mes)
router.get('/rendimiento/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;

        const [rendimiento] = await pool.query(
            `SELECT 
                u.id,
                u.nombre,
                COUNT(c.id) as citas_mes
             FROM usuarios u
             LEFT JOIN citas c ON u.id = c.especialista_id 
                AND c.estado = 'Completada'
                AND YEAR(c.fecha_hora) = YEAR(NOW())
                AND MONTH(c.fecha_hora) = MONTH(NOW())
             WHERE u.sucursal_id = ? AND u.role_id = 2
             GROUP BY u.id, u.nombre
             ORDER BY citas_mes DESC`,
            [sucursalId]
        );

        res.json(rendimiento);
    } catch (error) {
        console.error('Error en rendimiento:', error);
        res.status(500).json({ mensaje: 'Error al obtener rendimiento', error: error.message });
    }
});

// Obtener alertas de inventario (productos con stock bajo)
router.get('/alertas-inventario/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;

        const [alertas] = await pool.query(
            `SELECT 
                p.id,
                p.nombre,
                COALESCE(c.nombre, 'Sin categoría') as categoria,
                inv.cantidad,
                inv.stock_minimo,
                CASE 
                    WHEN inv.cantidad = 0 THEN 'Agotado'
                    WHEN inv.cantidad < inv.stock_minimo THEN 'Stock bajo'
                    ELSE 'Normal'
                END as estado
             FROM inventario_sucursal inv
             INNER JOIN productos p ON inv.producto_id = p.id
             LEFT JOIN categorias_productos c ON p.categoria_id = c.id
             WHERE inv.sucursal_id = ? 
             AND inv.cantidad < inv.stock_minimo
             ORDER BY inv.cantidad ASC`,
            [sucursalId]
        );

        res.json(alertas);
    } catch (error) {
        console.error('Error en alertas-inventario:', error);
        res.status(500).json({ mensaje: 'Error al obtener alertas de inventario', error: error.message });
    }
});

// Obtener ganancias por sucursal (precio fijo de $200 por consulta completada)
router.get('/ganancias/:sucursalId', async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const PRECIO_CONSULTA = 200;

        // Cargar especialistas de la sucursal
        const [especialistas] = await pool.query(
            `SELECT id FROM usuarios WHERE sucursal_id = ? AND role_id = 2`,
            [sucursalId]
        );
        const idsEspecialistas = especialistas.map(e => e.id);

        // Si no hay especialistas, devolver ceros
        if (idsEspecialistas.length === 0) {
            return res.json({
                completadas_hoy: 0,
                completadas_semana: 0,
                completadas_mes: 0,
                ganancias_hoy: 0,
                ganancias_semana: 0,
                ganancias_mes: 0
            });
        }

        const placeholders = idsEspecialistas.map(() => '?').join(',');

        // Ganancias de hoy
        const [ganHoy] = await pool.query(
            `SELECT COUNT(*) as completadas FROM citas 
             WHERE sucursal_id = ?
             AND especialista_id IN (${placeholders})
             AND estado = 'Completada'
             AND DATE(fecha_hora) = DATE(NOW())`,
            [sucursalId, ...idsEspecialistas]
        );

        // Ganancias de la semana (lunes a domingo)
        const [ganSemana] = await pool.query(
            `SELECT COUNT(*) as completadas FROM citas 
             WHERE sucursal_id = ?
             AND especialista_id IN (${placeholders})
             AND estado = 'Completada'
             AND DATE(fecha_hora) >= DATE_SUB(CURDATE(), INTERVAL IF(DAYOFWEEK(CURDATE()) = 1, 6, DAYOFWEEK(CURDATE()) - 2) DAY)
             AND DATE(fecha_hora) <= DATE_ADD(DATE_SUB(CURDATE(), INTERVAL IF(DAYOFWEEK(CURDATE()) = 1, 6, DAYOFWEEK(CURDATE()) - 2) DAY), INTERVAL 6 DAY)`,
            [sucursalId, ...idsEspecialistas]
        );

        // Ganancias del mes
        const [ganMes] = await pool.query(
            `SELECT COUNT(*) as completadas FROM citas 
             WHERE sucursal_id = ?
             AND especialista_id IN (${placeholders})
             AND estado = 'Completada'
             AND MONTH(fecha_hora) = MONTH(NOW())
             AND YEAR(fecha_hora) = YEAR(NOW())`,
            [sucursalId, ...idsEspecialistas]
        );

        res.json({
            completadas_hoy: ganHoy[0].completadas || 0,
            completadas_semana: ganSemana[0].completadas || 0,
            completadas_mes: ganMes[0].completadas || 0,
            ganancias_hoy: (ganHoy[0].completadas || 0) * PRECIO_CONSULTA,
            ganancias_semana: (ganSemana[0].completadas || 0) * PRECIO_CONSULTA,
            ganancias_mes: (ganMes[0].completadas || 0) * PRECIO_CONSULTA
        });
    } catch (error) {
        console.error('Error en ganancias:', error);
        res.status(500).json({ mensaje: 'Error al obtener ganancias', error: error.message });
    }
});

module.exports = router;
