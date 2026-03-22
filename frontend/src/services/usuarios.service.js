import axios from 'axios';
import config from '../config.js';

const API_BASE_URL = config;

export async function getUsuarios() {
    try {
        const response = await axios.get(`${API_BASE_URL}/usuarios`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
}

export async function getUsuariosPorRol(roleId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/usuarios/por-rol/${roleId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener usuarios por rol:', error);
        throw error;
    }
}

export async function crearUsuario(usuario) {
    try {
        const response = await axios.post(`${API_BASE_URL}/usuarios`, usuario);
        return response.data;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
}

export async function actualizarUsuario(id, usuario) {
    try {
        const response = await axios.put(`${API_BASE_URL}/usuarios/${id}`, usuario);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
}

export async function eliminarUsuario(id) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/usuarios/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
}
