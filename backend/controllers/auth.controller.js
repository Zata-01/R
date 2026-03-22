const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

// AUTH CONTROLLER
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password, role_id, sucursal_id, especialidad_area_id } = req.body;

        const usuarioExistente = await UsuarioModel.obtenerPorEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'Este correo ya está registrado.' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const nuevoUsuarioId = await UsuarioModel.crear({
            nombre, email, password_hash, role_id,
            sucursal_id: sucursal_id || null,
            especialidad_area_id: especialidad_area_id || null
        });

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito',
            usuarioId: nuevoUsuarioId
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al registrar' });
    }
};

const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await UsuarioModel.obtenerPorEmail(email);
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const passwordCorrecto = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordCorrecto) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const payload = { id: usuario.id, role_id: usuario.role_id, sucursal_id: usuario.sucursal_id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            mensaje: 'Login exitoso',
            token: token,
            usuario: { id: usuario.id, nombre: usuario.nombre, role_id: usuario.role_id, sucursal_id: usuario.sucursal_id }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

module.exports = { registrarUsuario, loginUsuario };