import axios from 'axios';
import API_BASE_URL from '../config';

const API_URL = `${API_BASE_URL}/auth`;

export const login = async (email, password, contextoId, rol, nombreSucursal = '') => {
    try {
        const loginData = {
            email,
            password,
            sucursalId: (rol === 'recepcionista' || rol === 'gerente' || rol === 'especialista') ? contextoId : null
        };

        const response = await axios.post(`${API_URL}/login`, loginData);
        
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            const usuarioConSucursal = {
                ...response.data.usuario,
                sucursal_nombre: nombreSucursal
            };
            localStorage.setItem('usuario', JSON.stringify(usuarioConSucursal));
        }
        
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Error de conexión');
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
};