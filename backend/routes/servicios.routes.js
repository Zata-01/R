const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middlewares/auth.middleware');

// SERVICIOS ROUTES
router.get('/', verificarToken, async (req, res) => {
    try {
        const [servicios] = await pool.query(
            `SELECT s.id, s.nombre, s.duracion_minutos, a.nombre as area_nombre 
             FROM servicios s
             LEFT JOIN areas_servicio a ON s.area_id = a.id
             ORDER BY a.nombre ASC, s.nombre ASC`
        );
        res.json(servicios);
    } catch (error) {
        console.error('Error en servicios:', error);
        res.status(500).json({ mensaje: 'Error al obtener servicios', error: error.message });
    }
});

router.get('/area/:areaId', verificarToken, async (req, res) => {
    try {
        const { areaId } = req.params;
        const [servicios] = await pool.query(
            'SELECT id, nombre, duracion_minutos FROM servicios WHERE area_id = ? ORDER BY nombre ASC',
            [areaId]
        );
        res.json(servicios);
    } catch (error) {
        console.error('Error en servicios:', error);
        res.status(500).json({ mensaje: 'Error al obtener servicios', error: error.message });
    }
});

module.exports = router;