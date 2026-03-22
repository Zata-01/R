// SUCURSAL MODEL
const pool = require('../config/db');

const obtenerTodas = async () => {
    try {
        const [rows] = await pool.query('SELECT * FROM sucursales');
        return rows;
    } catch (error) {
        throw error;
    }
};

const obtenerPorId = async (id) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sucursales WHERE id = ?', [id]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};

module.exports = { obtenerTodas, obtenerPorId };