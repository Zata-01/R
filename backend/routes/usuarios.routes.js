const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken } = require('../middlewares/auth.middleware');
const bcrypt = require('bcrypt');

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

// Obtener usuarios por rol (especialistas y recepcionistas)
router.get('/por-rol/:roleId', verificarToken, async (req, res) => {
    try {
        const { roleId } = req.params;
        const [usuarios] = await pool.query(
            'SELECT id, nombre, email, role_id, sucursal_id FROM usuarios WHERE role_id = ? ORDER BY nombre ASC',
            [roleId]
        );
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios por rol:', error);
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
    }
});

// Crear nuevo usuario
router.post('/', verificarToken, async (req, res) => {
    try {
        const { nombre, email, password, role_id, sucursal_id } = req.body;

        // Validar datos
        if (!nombre || !email || !password || !role_id) {
            return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
        }

        // Verificar si el email ya existe
        const [existingUser] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya existe' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, role_id, sucursal_id) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, hashedPassword, role_id, sucursal_id || null]
        );

        res.json({
            mensaje: 'Usuario creado exitosamente',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ mensaje: 'Error al crear usuario', error: error.message });
    }
});

// Actualizar usuario
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, role_id, sucursal_id, password } = req.body;

        // Validar datos
        if (!nombre || !email || !role_id) {
            return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
        }

        // Verificar si el email ya existe para otro usuario
        const [existingUser] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ? AND id != ?',
            [email, id]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya existe' });
        }

        // Si se proporciona contraseña, hashearla
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE usuarios SET nombre = ?, email = ?, password_hash = ?, role_id = ?, sucursal_id = ? WHERE id = ?',
                [nombre, email, hashedPassword, role_id, sucursal_id || null, id]
            );
        } else {
            await pool.query(
                'UPDATE usuarios SET nombre = ?, email = ?, role_id = ?, sucursal_id = ? WHERE id = ?',
                [nombre, email, role_id, sucursal_id || null, id]
            );
        }

        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ mensaje: 'Error al actualizar usuario', error: error.message });
    }
});

// Eliminar usuario
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar eliminar el último gerente
        const [gerentes] = await pool.query('SELECT id FROM usuarios WHERE role_id = 1');
        if (gerentes.length === 1 && parseInt(id) === gerentes[0].id) {
            return res.status(400).json({ mensaje: 'No puedes eliminar el último gerente' });
        }

        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);

        res.json({ mensaje: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: error.message });
    }
});

module.exports = router;