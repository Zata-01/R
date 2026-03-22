// SUCURSAL CONTROLLER
const SucursalModel = require('../models/sucursal.model');

const obtenerSucursales = async (req, res) => {
    try {
        const sucursales = await SucursalModel.obtenerTodas();
        res.status(200).json(sucursales);
    } catch (error) {
        console.error('Error al obtener las sucursales:', error);
        res.status(500).json({ mensaje: 'Error interno al obtener las sucursales' });
    }
};

const obtenerSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const sucursal = await SucursalModel.obtenerPorId(id);

        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        res.status(200).json(sucursal);
    } catch (error) {
        console.error('Error al obtener la sucursal:', error);
        res.status(500).json({ mensaje: 'Error interno al obtener la sucursal' });
    }
};

module.exports = { obtenerSucursales, obtenerSucursal };