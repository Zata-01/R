const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middlewares/auth.middleware');

router.get('/especialistas', verificarToken, async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            'SELECT id, nombre FROM usuarios WHERE role_id = 2 ORDER BY nombre ASC'
        );
        res.json(usuarios);
    } catch (error) {
        console.error('Error en especialistas:', error);
        res.status(500).json({ mensaje: 'Error al obtener especialistas', error: error.message });
    }
});

router.get('/especialistas/:sucursalId', verificarToken, async (req, res) => {
    try {
        const { sucursalId } = req.params;
        const [usuarios] = await pool.query(
            'SELECT id, nombre FROM usuarios WHERE role_id = 2 AND sucursal_id = ? ORDER BY nombre ASC',
            [sucursalId]
        );
        res.json(usuarios);
    } catch (error) {
        console.error('Error en especialistas:', error);
        res.status(500).json({ mensaje: 'Error al obtener especialistas', error: error.message });
    }
});

router.get('/', verificarToken, async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            'SELECT id, nombre, email, role_id, sucursal_id FROM usuarios ORDER BY nombre ASC'
        );
        res.json(usuarios);
    } catch (error) {
        console.error('Error en usuarios:', error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
    }
});

module.exports = router;