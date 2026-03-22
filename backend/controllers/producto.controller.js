const ProductoModel = require('../models/producto.model');

// PRODUCTO CONTROLLER
const obtenerProductos = async (req, res) => {
    try {
        const productos = await ProductoModel.obtenerTodos();
        res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
    }
};

const obtenerProductosEspecialista = async (req, res) => {
    try {
        const { sucursal_id } = req.params;
        const productos = await ProductoModel.obtenerPorSucursal(sucursal_id);
        res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener productos de la sucursal:', error);
        res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
    }
};

const obtenerProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await ProductoModel.obtenerPorId(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.status(200).json(producto);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ mensaje: 'Error al obtener producto', error: error.message });
    }
};

const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, categoria_id, unidad } = req.body;

        if (!nombre || !categoria_id || !unidad) {
            return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
        }

        const productoId = await ProductoModel.crear({ nombre, descripcion, categoria_id, unidad });
        res.status(201).json({ mensaje: 'Producto creado exitosamente', productoId });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
    }
};

const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoria_id, unidad } = req.body;

        if (!nombre || !categoria_id || !unidad) {
            return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
        }

        const actualizado = await ProductoModel.actualizar(id, { nombre, descripcion, categoria_id, unidad });

        if (!actualizado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.status(200).json({ mensaje: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await ProductoModel.eliminar(id);

        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.status(200).json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
    }
};

const actualizarCantidadInventario = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, sucursal_id, stock_minimo = 10 } = req.body;

        if (cantidad === undefined || sucursal_id === undefined) {
            return res.status(400).json({ mensaje: 'Faltan cantidad o sucursal_id' });
        }

        const actualizado = await ProductoModel.actualizarCantidadInventario(id, sucursal_id, cantidad, stock_minimo);

        if (!actualizado) {
            return res.status(404).json({ mensaje: 'Registro de inventario no encontrado' });
        }

        res.status(200).json({ mensaje: 'Cantidad actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        res.status(500).json({ mensaje: 'Error al actualizar cantidad', error: error.message });
    }
};

module.exports = { obtenerProductos, obtenerProductosEspecialista, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, actualizarCantidadInventario };
