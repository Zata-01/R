import axios from 'axios';
import API_BASE_URL from '../config';

const API_URL = `${API_BASE_URL}/productos`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
    };
};

export const getProductos = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener productos');
    }
};

export const getProductosSucursal = async (sucursal_id) => {
    try {
        const response = await axios.get(`${API_URL}/sucursal/${sucursal_id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener productos de la sucursal');
    }
};

export const createProducto = async (productoData) => {
    try {
        const response = await axios.post(API_URL, productoData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al crear producto');
    }
};

export const updateProducto = async (productoId, productoData) => {
    try {
        const response = await axios.put(`${API_URL}/${productoId}`, productoData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al actualizar producto');
    }
};

export const deleteProducto = async (productoId) => {
    try {
        const response = await axios.delete(`${API_URL}/${productoId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al eliminar producto');
    }
};

export const updateCantidadInventario = async (productoId, sucursalId, cantidad, stock_minimo = 10) => {
    try {
        const response = await axios.put(`${API_URL}/${productoId}/cantidad`, 
            { cantidad, stock_minimo, sucursal_id: sucursalId },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al actualizar cantidad');
    }
};

export default {
    getProductos,
    getProductosSucursal,
    createProducto,
    updateProducto,
    deleteProducto,
    updateCantidadInventario
};
