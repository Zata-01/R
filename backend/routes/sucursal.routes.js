const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursal.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// SUCURSAL ROUTES
router.get('/', verificarToken, sucursalController.obtenerSucursales);
router.get('/:id', verificarToken, sucursalController.obtenerSucursal);

module.exports = router;