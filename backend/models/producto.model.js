const pool = require('../config/db');

// PRODUCTO MODEL
const obtenerTodos = async () => {
    try {
        const [rows] = await pool.query(
            `SELECT p.id, p.nombre, p.descripcion, p.unidad, p.categoria_id, c.nombre as categoria,
                    CAST(COALESCE(SUM(inv.cantidad), 0) AS UNSIGNED) as cantidad,
                    CAST(COALESCE(MAX(inv.stock_minimo), 0) AS UNSIGNED) as stock_minimo
             FROM productos p
             LEFT JOIN categorias_productos c ON p.categoria_id = c.id
             LEFT JOIN inventario_sucursal inv ON p.id = inv.producto_id
             GROUP BY p.id, p.nombre, p.descripcion, p.unidad, p.categoria_id, c.nombre
             ORDER BY p.id ASC`
        );
        return rows;
    } catch (error) {
        throw error;
    }
};

const obtenerPorSucursal = async (sucursal_id) => {
    try {
        const [rows] = await pool.query(
            `SELECT DISTINCT p.id, p.nombre, p.descripcion, p.unidad, p.categoria_id, c.nombre as categoria, 
                    inv.cantidad, inv.stock_minimo
             FROM productos p
             LEFT JOIN categorias_productos c ON p.categoria_id = c.id
             INNER JOIN inventario_sucursal inv ON p.id = inv.producto_id
             WHERE inv.sucursal_id = ?
             ORDER BY p.id ASC`,
            [sucursal_id]
        );
        return rows;
    } catch (error) {
        throw error;
    }
};

const obtenerPorId = async (id) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.id, p.nombre, p.descripcion, p.unidad, p.categoria_id, c.nombre as categoria
             FROM productos p
             LEFT JOIN categorias_productos c ON p.categoria_id = c.id
             WHERE p.id = ?`,
            [id]
        );
        return rows[0];
    } catch (error) {
        throw error;
    }
};

const crear = async (productoData) => {
    const { nombre, descripcion, categoria_id, unidad } = productoData;
    try {
        const [result] = await pool.query(
            `INSERT INTO productos (nombre, descripcion, categoria_id, unidad)
             VALUES (?, ?, ?, ?)`,
            [nombre, descripcion, categoria_id, unidad]
        );
        return result.insertId;
    } catch (error) {
        throw error;
    }
};

const actualizar = async (id, productoData) => {
    const { nombre, descripcion, categoria_id, unidad } = productoData;
    try {
        const [result] = await pool.query(
            `UPDATE productos SET nombre = ?, descripcion = ?, categoria_id = ?, unidad = ? WHERE id = ?`,
            [nombre, descripcion, categoria_id, unidad, id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
};

const eliminar = async (id) => {
    try {
        await pool.query('DELETE FROM inventario_sucursal WHERE producto_id = ?', [id]);
        const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    }
};

const actualizarCantidadInventario = async (productoId, sucursalId, cantidad, stock_minimo = 10) => {
    try {
        const [result] = await pool.query(
            `UPDATE inventario_sucursal SET cantidad = ?, stock_minimo = ? WHERE producto_id = ? AND sucursal_id = ?`,
            [cantidad, stock_minimo, productoId, sucursalId]
        );

        if (result.affectedRows === 0) {
            const [insertResult] = await pool.query(
                `INSERT INTO inventario_sucursal (producto_id, sucursal_id, cantidad, stock_minimo) VALUES (?, ?, ?, ?)`,
                [productoId, sucursalId, cantidad, stock_minimo]
            );
            return insertResult.affectedRows > 0;
        }
        return true;
    } catch (error) {
        throw error;
    }
};

module.exports = { obtenerTodos, obtenerPorSucursal, obtenerPorId, crear, actualizar, eliminar, actualizarCantidadInventario };
