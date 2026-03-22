import axios from 'axios';
import API_BASE_URL from '../config';

const API_URL = `${API_BASE_URL}/sucursales`;

export const getSucursales = async () => {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error al obtener sucursales');
    }
};