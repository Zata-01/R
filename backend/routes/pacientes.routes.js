const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middlewares/auth.middleware');

// PACIENTES ROUTES
router.get('/sucursal/:sucursalId', verificarToken, async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const [pacientes] = await pool.query(
            'SELECT id, nombre, apellido, telefono, email FROM pacientes WHERE sucursal_registro_id = ? ORDER BY nombre ASC',
            [sucursalId]
        );
        res.json(pacientes);
    } catch (error) {
        console.error('Error en pacientes:', error);
        res.status(500).json({ mensaje: 'Error al obtener pacientes', error: error.message });
    }
});

router.get('/', verificarToken, async (req, res) => {
    try {
        const [pacientes] = await pool.query(
            'SELECT id, nombre, apellido, telefono, email FROM pacientes ORDER BY nombre ASC'
        );
        res.json(pacientes);
    } catch (error) {
        console.error('Error en pacientes:', error);
        res.status(500).json({ mensaje: 'Error al obtener pacientes', error: error.message });
    }
});

module.exports = router;