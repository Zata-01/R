import { useEffect, useState } from 'react';
import * as citasService from '../services/citas.service';
import styles from './Citas.module.css';

export default function Citas() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCita, setEditingCita] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [formData, setFormData] = useState({
    paciente_id: '',
    especialista_id: '',
    servicio_id: '',
    fecha_hora: '',
    estado: 'Pendiente'
  });

  // Initialization
  useEffect(() => {
    if (!usuario.sucursal_id) return;
    cargarDatos();
  }, [usuario.sucursal_id, mes, anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Cargar citas filtradas por mes
      let citasData = await citasService.getCitasPorMes(usuario.sucursal_id, mes, anio);
      
      // Cargar especialistas primero para validar
      const especialistasData = await citasService.getEspecialistas(usuario.sucursal_id);
      const idsEspecialistasDeSucursal = especialistasData.map(e => e.id);
      
      // Filtrar citas para que solo muestren especialistas de esta sucursal
      citasData = citasData.filter(cita => idsEspecialistasDeSucursal.includes(cita.especialista_id));
      
      // Si es especialista, filtrar solo sus citas
      if (usuario.role_id === 2) {
        citasData = citasData.filter(cita => cita.especialista_id === usuario.id);
      }
      
      const citasOrdenadas = citasData.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      setCitas(citasOrdenadas);
      
      // Cargar pacientes
      const pacientesData = await citasService.getPacientes(usuario.sucursal_id);
      setPacientes(pacientesData);
      
      // Establecer especialistas
      setEspecialistas(especialistasData);
      
      // Cargar servicios
      const serviciosData = await citasService.getServicios();
      setServicios(serviciosData);
      
      setError(null);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cita = null) => {
    // Especialistas no pueden crear ni editar citas
    if (usuario.role_id === 2) {
      alert('No tienes permiso para crear o editar citas');
      return;
    }

    // Resetear disponibilidad al abrir modal
    setDisponibilidad(null);

    if (cita) {
      setEditingCita(cita);
      
      try {
        if (!cita.fecha_hora) {
          console.error('Error: cita.fecha_hora está vacío', cita);
          throw new Error('fecha_hora no disponible');
        }
        
        let fechaFormato = cita.fecha_hora.substring(0, 16);
        
        setFormData({
          paciente_id: cita.paciente_id,
          especialista_id: cita.especialista_id,
          servicio_id: cita.servicio_id,
          fecha_hora: fechaFormato,
          estado: cita.estado
        });
      } catch (err) {
        console.error('Error procesando fecha:', err);
        
        const fechaFormato = cita?.fecha_hora ? cita.fecha_hora.substring(0, 16) : '';
        
        setFormData({
          paciente_id: cita.paciente_id,
          especialista_id: cita.especialista_id,
          servicio_id: cita.servicio_id,
          fecha_hora: fechaFormato,
          estado: cita.estado
        });
      }
    } else {
      setEditingCita(null);
      // Inicializar con fecha de hoy y hora 10:00
      const hoy = new Date().toISOString().split('T')[0];
      setFormData({
        paciente_id: '',
        especialista_id: '',
        servicio_id: '',
        fecha_hora: `${hoy}T10:00`,
        estado: 'Pendiente'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCita(null);
    setDisponibilidad(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const verificarDisponibilidadEspecialista = async (especialista_id, fecha_hora, cita_id = null) => {
    if (especialista_id && fecha_hora) {
      try {
        const resultado = await citasService.verificarDisponibilidad(
          parseInt(especialista_id), 
          fecha_hora,
          cita_id
        );
        setDisponibilidad(resultado);
      } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        setDisponibilidad({ 
          disponible: false, 
          mensaje: 'Error al verificar disponibilidad' 
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Especialistas no pueden crear ni editar citas
    if (usuario.role_id === 2) {
      alert('No tienes permiso para crear o editar citas');
      return;
    }

    try {
      // Validar que todos los campos estén completos
      if (!formData.paciente_id || !formData.especialista_id || !formData.servicio_id || !formData.fecha_hora) {
        alert('Por favor completa todos los campos del formulario');
        return;
      }

      if (!usuario.sucursal_id) {
        alert('Error: No se encontró la sucursal del usuario');
        return;
      }
      
      // Verificar disponibilidad ANTES de enviar
      // Si ya verificamos en tiempo real y hay conflicto, no permitir guardar
      if (disponibilidad && !disponibilidad.disponible) {
        alert('⚠️ No se puede guardar: ' + disponibilidad.mensaje);
        return;
      }

      console.log('=== GUARDANDO CITA ===');
      console.log('Hora seleccionada en input:', formData.fecha_hora);
      
      // El input datetime-local tiene exactamente la hora que el usuario seleccionó
      // Formateamos como ISO 8601: "2026-03-21T10:30" → "2026-03-21T10:30:00.000Z"
      const fechaISO = formData.fecha_hora + ':00.000Z';
      
      console.log('Guardando como ISO 8601:', fechaISO);
      
      const dataToSend = {
        paciente_id: parseInt(formData.paciente_id),
        especialista_id: parseInt(formData.especialista_id),
        servicio_id: parseInt(formData.servicio_id),
        sucursal_id: usuario.sucursal_id,
        fecha_hora: fechaISO,
        estado: formData.estado
      };
      
      console.log('Datos enviados al servidor:', dataToSend);
      
      if (editingCita) {
        console.log('Actualizando cita ID:', editingCita.id);
        await citasService.updateCita(editingCita.id, {
          estado: formData.estado,
          fecha_hora: fechaISO
        });
      } else {
        console.log('Creando nueva cita');
        await citasService.createCita(dataToSend);
      }
      
      console.log('Cita guardada exitosamente');
      handleCloseModal();
      cargarDatos();
      alert('Cita guardada exitosamente');
    } catch (err) {
      console.error('Error guardando cita:', err);
      alert('Error al guardar la cita: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleDelete = async (citaId) => {
    // Especialistas no pueden eliminar citas
    if (usuario.role_id === 2) {
      alert('No tienes permiso para eliminar citas');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      try {
        await citasService.deleteCita(citaId);
        cargarDatos();
      } catch (err) {
        console.error('Error eliminando cita:', err);
        alert('Error al eliminar la cita: ' + (err.message || 'Error desconocido'));
      }
    }
  };

  if (loading) {
    return <div className={styles.container}><p>Cargando citas...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p style={{color: 'red'}}>Error: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Control de Citas</h1>
          {usuario.role_id !== 2 && (
            <button className={styles.newBtn} onClick={() => handleOpenModal()}>
              + Nueva Cita
            </button>
          )}
        </div>

        {/* Filtro de Mes y Año */}
        <div style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <label style={{fontWeight: 'bold', marginRight: '5px'}}>Mes:</label>
          <select 
            value={mes} 
            onChange={(e) => setMes(parseInt(e.target.value))}
            style={{padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'}}
          >
            <option value={1}>Enero</option>
            <option value={2}>Febrero</option>
            <option value={3}>Marzo</option>
            <option value={4}>Abril</option>
            <option value={5}>Mayo</option>
            <option value={6}>Junio</option>
            <option value={7}>Julio</option>
            <option value={8}>Agosto</option>
            <option value={9}>Septiembre</option>
            <option value={10}>Octubre</option>
            <option value={11}>Noviembre</option>
            <option value={12}>Diciembre</option>
          </select>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <label style={{fontWeight: 'bold', marginRight: '5px'}}>Año:</label>
          <select 
            value={anio} 
            onChange={(e) => setAnio(parseInt(e.target.value))}
            style={{padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px'}}
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <span style={{color: '#666', fontSize: '14px'}}>
          Mostrando citas de {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mes - 1]} de {anio}
        </span>
      </div>

      {citas.length === 0 ? (
        <p className={styles.empty}>No hay citas registradas</p>
      ) : (
        <>
          <div className={styles.searchSection} style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px'}}>
            <input
              type="text"
              placeholder={usuario.role_id === 2 ? "Buscar por paciente..." : "Buscar por paciente o especialista..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Teléfono</th>
                {usuario.role_id !== 2 && <th>Profesional</th>}
                <th>Especialidad</th>
                <th>Estado</th>
                {usuario.role_id !== 2 && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {citas
                .filter(cita => {
                  const pacienteMatch = cita.paciente_nombre.toLowerCase().includes(searchTerm);
                  const especialistaMatch = cita.profesional_nombre.toLowerCase().includes(searchTerm);
                  
                  // Especialistas solo pueden filtrar por paciente
                  if (usuario.role_id === 2) {
                    return pacienteMatch;
                  }
                  
                  // Recepcionistas y gerentes pueden filtrar por paciente o especialista
                  return pacienteMatch || especialistaMatch;
                })
                .map(cita => (
                <tr key={cita.id}>
                  <td>{new Date(cita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit' })}</td>
                  <td>{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{cita.paciente_nombre}</td>
                  <td>{cita.telefono}</td>
                  {usuario.role_id !== 2 && <td>{cita.profesional_nombre}</td>}
                  <td><span className={styles.badge}>{cita.especialidad}</span></td>
                  <td>
                    <span className={`${styles.status} ${styles[`status_${cita.estado}`]}`}>
                      {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </span>
                  </td>
                  {usuario.role_id !== 2 && (
                    <td>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleOpenModal(cita)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(cita.id)}
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingCita ? 'Editar Cita' : 'Nueva Cita'}</h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Paciente</label>
                <select 
                  name="paciente_id"
                  value={formData.paciente_id}
                  onChange={handleInputChange}
                  disabled={editingCita ? true : false}
                  required
                >
                  <option value="">-- Seleccionar paciente --</option>
                  {pacientes.map(paciente => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nombre} {paciente.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Especialista</label>
                <select 
                  name="especialista_id"
                  value={formData.especialista_id}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setFormData(prev => ({...prev, especialista_id: valor}));
                    // Verificar disponibilidad cuando cambia el especialista
                    verificarDisponibilidadEspecialista(valor, formData.fecha_hora, editingCita?.id);
                  }}
                  disabled={editingCita ? true : false}
                  required
                >
                  <option value="">-- Seleccionar especialista --</option>
                  {especialistas.map(especialista => (
                    <option key={especialista.id} value={especialista.id}>
                      {especialista.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Servicio</label>
                <select 
                  name="servicio_id"
                  value={formData.servicio_id}
                  onChange={handleInputChange}
                  disabled={editingCita ? true : false}
                  required
                >
                  <option value="">-- Seleccionar servicio --</option>
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Fecha y Hora</label>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                  <div>
                    <label style={{fontSize: '12px', color: '#666'}}>Fecha</label>
                    <input 
                      type="date"
                      name="fecha"
                      value={formData.fecha_hora.split('T')[0] || ''}
                      onChange={(e) => {
                        const fecha = e.target.value;
                        const hora = formData.fecha_hora.split('T')[1] || '10:00';
                        const nuevaFechaHora = `${fecha}T${hora}`;
                        setFormData(prev => ({...prev, fecha_hora: nuevaFechaHora}));
                        // Verificar disponibilidad cuando cambia la fecha
                        verificarDisponibilidadEspecialista(formData.especialista_id, nuevaFechaHora, editingCita?.id);
                      }}
                      required
                      style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize: '12px', color: '#666'}}>Hora</label>
                    <select 
                      name="hora"
                      value={formData.fecha_hora.split('T')[1]?.substring(0, 5) || '10:00'}
                      onChange={(e) => {
                        const hora = e.target.value;
                        const fecha = formData.fecha_hora.split('T')[0] || new Date().toISOString().split('T')[0];
                        const nuevaFechaHora = `${fecha}T${hora}`;
                        setFormData(prev => ({...prev, fecha_hora: nuevaFechaHora}));
                        // Verificar disponibilidad cuando cambia la hora
                        verificarDisponibilidadEspecialista(formData.especialista_id, nuevaFechaHora, editingCita?.id);
                      }}
                      required
                      style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                    >
                      {Array.from({length: 48}, (_, i) => {
                        const horas = Math.floor(i / 2);
                        const minutos = (i % 2) === 0 ? '00' : '30';
                        const hora = String(horas).padStart(2, '0');
                        return (
                          <option key={i} value={`${hora}:${minutos}`}>
                            {hora}:{minutos}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Estado</label>
                <select 
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                  <option value="No Asistió">No Asistió</option>
                </select>
              </div>

              {/* Alerta de disponibilidad */}
              {disponibilidad && !disponibilidad.disponible && (
                <div style={{
                  backgroundColor: '#fee',
                  border: '2px solid #d32f2f',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '15px',
                  color: '#d32f2f',
                  fontWeight: '500'
                }}>
                  ⚠️ {disponibilidad.mensaje}
                </div>
              )}

              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={disponibilidad && !disponibilidad.disponible}
                  style={{
                    opacity: (disponibilidad && !disponibilidad.disponible) ? 0.5 : 1,
                    cursor: (disponibilidad && !disponibilidad.disponible) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {editingCita ? 'Actualizar' : 'Crear'} Cita
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}