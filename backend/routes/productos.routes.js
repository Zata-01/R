const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { verificarPermiso } = require('../middlewares/permisos.middleware');
const productoController = require('../controllers/producto.controller');

// PRODUCTOS ROUTES
router.get('/', verificarToken, productoController.obtenerProductos);
router.get('/sucursal/:sucursal_id', verificarToken, productoController.obtenerProductosEspecialista);
router.get('/:id', verificarToken, productoController.obtenerProducto);
router.post('/', verificarToken, verificarPermiso('editar_inventario'), productoController.crearProducto);
router.put('/:id/cantidad', verificarToken, verificarPermiso('editar_inventario'), productoController.actualizarCantidadInventario);
router.put('/:id', verificarToken, verificarPermiso('editar_inventario'), productoController.actualizarProducto);
router.delete('/:id', verificarToken, verificarPermiso('editar_inventario'), productoController.eliminarProducto);

module.exports = router;