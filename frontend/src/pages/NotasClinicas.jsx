import { useEffect, useState } from 'react';
import styles from './NotasClinicas.module.css';
import * as citasService from '../services/citas.service';

export default function NotasClinicas() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [citas, setCitas] = useState([]);
  const [notasActuales, setNotasActuales] = useState([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevaNota, setNuevaNota] = useState('');
  const [notaEnEdicion, setNotaEnEdicion] = useState(null);
  const [contenidoEdicion, setContenidoEdicion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // INITIALIZATION
  useEffect(() => {
    if (!usuario.sucursal_id) return;

    const cargarCitas = async () => {
      try {
        setLoading(true);
        const todasLasCitas = await citasService.getCitasBySucursal(usuario.sucursal_id);
        
        if (usuario.role_id === 2) {
          const citasEspecialista = todasLasCitas.filter(cita => cita.especialista_id === usuario.id);
          setCitas(citasEspecialista);
        } else {
          setCitas(todasLasCitas);
        }
      } catch (err) {
        setError(err.message || 'Error al cargar citas');
      } finally {
        setLoading(false);
      }
    };

    cargarCitas();
  }, [usuario.sucursal_id, usuario.role_id, usuario.id]);

  const cargarNotas = async (citaId) => {
    try {
      const notas = await citasService.getNotasCita(citaId);
      setNotasActuales(notas);
      setCitaSeleccionada(citaId);
      setNuevaNota('');
      setNotaEnEdicion(null);
    } catch (err) {
      setError(err.message || 'Error al cargar notas');
    }
  };

  const agregarNota = async () => {
    if (!nuevaNota.trim()) {
      setError('La nota no puede estar vacía');
      return;
    }

    try {
      await citasService.createNotaCita(citaSeleccionada, nuevaNota, usuario.id);
      setNuevaNota('');
      cargarNotas(citaSeleccionada);
    } catch (err) {
      setError(err.message || 'Error al crear nota');
    }
  };

  const actualizarNota = async (notaId) => {
    if (!contenidoEdicion.trim()) {
      setError('La nota no puede estar vacía');
      return;
    }

    try {
      await citasService.updateNotaCita(notaId, contenidoEdicion);
      setNotaEnEdicion(null);
      setContenidoEdicion('');
      cargarNotas(citaSeleccionada);
    } catch (err) {
      setError(err.message || 'Error al actualizar nota');
    }
  };

  const eliminarNota = async (notaId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) return;

    try {
      await citasService.deleteNotaCita(notaId);
      cargarNotas(citaSeleccionada);
    } catch (err) {
      setError(err.message || 'Error al eliminar nota');
    }
  };

  const citaActual = citas.find(c => c.id === citaSeleccionada);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>Notas Clínicas</h1>
          </div>
        </div>

        {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

        <div className={styles.gridContainer}>
          {/* Panel izquierdo - Lista de citas */}
          <div className={styles.citasPanel}>
            <h2 className={styles.panelTitle}>📋 Mis Citas</h2>
            <div className={styles.citasList}>
              {citas.length > 0 ? (
                citas.map(cita => (
                  <div
                    key={cita.id}
                    onClick={() => cargarNotas(cita.id)}
                    className={`${styles.citaItem} ${citaSeleccionada === cita.id ? styles.active : ''}`}
                  >
                    <div className={styles.citaDate}>
                      {new Date(cita.fecha_hora).toLocaleDateString('es-ES')} • {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={styles.citaPatient}>👤 {cita.paciente_nombre}</div>
                    <div className={styles.citaArea}>📂 {cita.area}</div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>No hay citas disponibles</p>
              )}
            </div>
          </div>

          {/* Panel derecho - Notas de la cita seleccionada */}
          <div className={styles.notasPanel}>
            {citaActual ? (
              <>
                <h2 className={styles.panelTitle}>Notas Clínicas</h2>

                {/* Notas existentes */}
                <div className={styles.notasListContainer}>
                  {notasActuales.length > 0 ? (
                    notasActuales.map(nota => (
                      <div key={nota.id} className={styles.notaItem}>
                        {notaEnEdicion === nota.id ? (
                          <>
                            <textarea
                              value={contenidoEdicion}
                              onChange={(e) => setContenidoEdicion(e.target.value)}
                              className={styles.notaTextarea}
                            />
                            <div className={styles.notaActions}>
                              <button
                                onClick={() => actualizarNota(nota.id)}
                                className={`${styles.notaBtn} ${styles.saveBtnSmall}`}
                              >
                                ✓ Guardar
                              </button>
                              <button
                                onClick={() => setNotaEnEdicion(null)}
                                className={`${styles.notaBtn} ${styles.cancelBtnSmall}`}
                              >
                                ✕ Cancelar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p style={{ margin: '0 0 8px 0', color: '#333', fontSize: '13px', lineHeight: '1.5' }}>
                              {nota.nota}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
                              <span style={{ color: '#999' }}>
                                📅 {new Date(nota.fecha_creacion).toLocaleDateString('es-ES')} {new Date(nota.fecha_creacion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setNotaEnEdicion(nota.id);
                                    setContenidoEdicion(nota.nota);
                                  }}
                                  className={`${styles.notaBtn} ${styles.editBtn}`}
                                >
                                  ✎ Editar
                                </button>
                                <button
                                  onClick={() => eliminarNota(nota.id)}
                                  className={`${styles.notaBtn} ${styles.deleteBtn}`}
                                >
                                  ✕ Eliminar
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', paddingTop: '20px' }}>📄 Sin notas aún</p>
                  )}
                </div>

                {/* Agregar nueva nota */}
                {notasActuales.length === 0 ? (
                  <div className={styles.newNoteSection}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#002147', fontSize: '16px', fontWeight: '600' }}>➕ Agregar Nota Clínica</h3>
                    <textarea
                      value={nuevaNota}
                      onChange={(e) => setNuevaNota(e.target.value)}
                      placeholder="Escribe aquí tu nota clínica..."
                      className={styles.newNoteInput}
                    />
                    <button
                      onClick={agregarNota}
                      className={styles.addBtn}
                    >
                      📝 Guardar Nota
                    </button>
                  </div>
                ) : (
                  <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '20px', background: '#f0f4ff', padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#003d7a', borderLeft: '4px solid #002147' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>📌 Ya existe una nota para esta cita. Edítala o elimínala para agregar una nueva.</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 20px' }}>
                <p style={{ fontSize: '14px' }}>👈 Selecciona una cita para ver o agregar notas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
