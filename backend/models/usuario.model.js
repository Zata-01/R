const pool = require('../config/db');

const obtenerPorEmail = async (email) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};

const crear = async (usuarioData) => {
    const { nombre, email, password_hash, role_id, sucursal_id, especialidad_area_id } = usuarioData;
    try {
        const [result] = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash, role_id, sucursal_id, especialidad_area_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, email, password_hash, role_id, sucursal_id, especialidad_area_id]
        );
        return result.insertId;
    } catch (error) {
        throw error;
    }
};

module.exports = { obtenerPorEmail, crear };