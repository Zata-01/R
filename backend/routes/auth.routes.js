const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// PUBLIC ROUTES
router.get('/sucursales-public', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre FROM sucursales');
        res.json(rows);
    } catch (error) {
        console.error('Error en sucursales-public:', error);
        res.status(500).json({ mensaje: "Error al obtener sucursales", error: error.message });
    }
});

router.get('/especialistas-public', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre FROM usuarios WHERE role_id = 2');
        res.json(rows);
    } catch (error) {
        console.error('Error en especialistas-public:', error);
        res.status(500).json({ mensaje: "Error al obtener especialistas", error: error.message });
    }
});

// REGISTRATION
router.post('/registro', async (req, res) => {
    const { nombre, email, password, role_id, sucursal_id } = req.body;
    try {
        const [existingUser] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, role_id, sucursal_id) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, passwordHash, role_id, sucursal_id || null]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuarioId: result.insertId,
            usuario: { id: result.insertId, nombre, email, role_id }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password, sucursalId } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }

        let usuario = rows[0];
        const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordCorrecta) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        if (usuario.role_id === 1) {
            if (!usuario.sucursal_id) {
                return res.status(403).json({ mensaje: 'Gerente sin sucursal asignada' });
            }
            if (sucursalId && parseInt(sucursalId) !== usuario.sucursal_id) {
                return res.status(403).json({ mensaje: 'No tienes acceso a esa sucursal' });
            }
        }

        if (usuario.role_id === 2) {
            if (!usuario.sucursal_id && !sucursalId) {
                return res.status(403).json({ mensaje: 'Especialista sin sucursal asignada' });
            }
            if (!usuario.sucursal_id && sucursalId) {
                await pool.query('UPDATE usuarios SET sucursal_id = ? WHERE id = ?', [sucursalId, usuario.id]);
                usuario.sucursal_id = parseInt(sucursalId);
            }
            if (sucursalId && parseInt(sucursalId) !== usuario.sucursal_id) {
                return res.status(403).json({ mensaje: 'No tienes acceso a esa sucursal' });
            }
        }

        if (usuario.role_id === 3) {
            if (!usuario.sucursal_id && !sucursalId) {
                return res.status(403).json({ mensaje: 'Recepcionista sin sucursal asignada' });
            }
            if (!usuario.sucursal_id && sucursalId) {
                await pool.query('UPDATE usuarios SET sucursal_id = ? WHERE id = ?', [sucursalId, usuario.id]);
                usuario.sucursal_id = parseInt(sucursalId);
            }
            if (sucursalId && parseInt(sucursalId) !== usuario.sucursal_id) {
                return res.status(403).json({ mensaje: 'No tienes acceso a esa sucursal' });
            }
        }

        const token = jwt.sign(
            { id: usuario.id, role_id: usuario.role_id, sucursal_id: usuario.sucursal_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, role_id: usuario.role_id, sucursal_id: usuario.sucursal_id }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

module.exports = router;