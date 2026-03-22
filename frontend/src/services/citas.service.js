import axios from 'axios';
import API_BASE_URL from '../config';

const API_URL = `${API_BASE_URL}/citas`;
const API_BASE = API_BASE_URL;

const getToken = () => localStorage.getItem('token');

const getAuthHeaders = () => ({
    Authorization: `Bearer ${getToken()}`
});

export const getCitasBySucursal = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/sucursal/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener citas');
    }
};

export const getCitasHoy = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/hoy/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener citas del día');
    }
};

export const getCitasPendientes = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/pendientes/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener citas pendientes');
    }
};

export const getPacientesEnEspera = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/espera/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener pacientes en espera');
    }
};

export const getMetricasDashboard = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/metricas/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener métricas');
    }
};

export const getPacientes = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_BASE}/pacientes/sucursal/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener pacientes');
    }
};

export const getEspecialistas = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_BASE}/usuarios/especialistas/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener especialistas');
    }
};

export const getServicios = async () => {
    try {
        const response = await axios.get(`${API_BASE}/servicios`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener servicios');
    }
};

export const createCita = async (citaData) => {
    try {
        const response = await axios.post(API_URL, citaData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al crear cita');
    }
};

export const updateCita = async (citaId, citaData) => {
    try {
        const response = await axios.put(`${API_URL}/${citaId}`, citaData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al actualizar cita');
    }
};

export const deleteCita = async (citaId) => {
    try {
        const response = await axios.delete(`${API_URL}/${citaId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al eliminar cita');
    }
};

export const getNotasCita = async (citaId) => {
    try {
        const response = await axios.get(`${API_URL}/notas/${citaId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener notas');
    }
};

export const createNotaCita = async (citaId, nota, usuarioId, observaciones = null, diagnostico = null, tratamiento_realizado = null) => {
    try {
        const response = await axios.post(`${API_URL}/notas`, {
            cita_id: citaId,
            nota: nota,
            usuario_id: usuarioId,
            observaciones: observaciones,
            diagnostico: diagnostico,
            tratamiento_realizado: tratamiento_realizado
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al crear nota');
    }
};

export const updateNotaCita = async (notaId, nota, observaciones = null, diagnostico = null, tratamiento_realizado = null) => {
    try {
        const response = await axios.put(`${API_URL}/notas/${notaId}`, {
            nota: nota,
            observaciones: observaciones,
            diagnostico: diagnostico,
            tratamiento_realizado: tratamiento_realizado
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al actualizar nota');
    }
};

export const deleteNotaCita = async (notaId) => {
    try {
        const response = await axios.delete(`${API_URL}/notas/${notaId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al eliminar nota');
    }
};

export const getCitasSiguienteSemana = async (especialistaId) => {
    try {
        const response = await axios.get(`${API_URL}/especialista/${especialistaId}/siguiente-semana`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener citas de siguiente semana');
    }
};

export const getEstadisticasEspecialista = async (especialistaId) => {
    try {
        const response = await axios.get(`${API_URL}/especialista/${especialistaId}/estadisticas`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener estadísticas');
    }
};

export const getCitasPorMes = async (sucursalId, mes, anio) => {
    try {
        const response = await axios.get(`${API_URL}/mes/${sucursalId}`, {
            params: {
                mes: mes,
                anio: anio
            },
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener citas del mes');
    }
};

export const verificarDisponibilidad = async (especialista_id, fecha_hora, cita_id = null) => {
    try {
        const response = await axios.post(`${API_URL}/verificar-disponibilidad`, {
            especialista_id: especialista_id,
            fecha_hora: fecha_hora,
            cita_id: cita_id
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al verificar disponibilidad');
    }
};

export const getRendimientoPersonal = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/rendimiento/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener rendimiento del personal');
    }
};

export const getAlertasInventario = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/alertas-inventario/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener alertas de inventario');
    }
};

export const getGanancias = async (sucursalId) => {
    try {
        const response = await axios.get(`${API_URL}/ganancias/${sucursalId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Error al obtener ganancias');
    }
};
