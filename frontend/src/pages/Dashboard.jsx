import { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import logo from '../assets/logo.png';
import * as citasService from '../services/citas.service';

export default function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [fecha, setFecha] = useState('');
  const [metricas, setMetricas] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasDia, setCitasDia] = useState([]);
  const [citasSiguienteSemana, setCitasSiguienteSemana] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [notasCita, setNotasCita] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rendimientoPersonal, setRendimientoPersonal] = useState([]);
  const [alertasInventario, setAlertasInventario] = useState([]);
  const [ganancias, setGanancias] = useState(null);

  useEffect(() => {
    const hoy = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormato = hoy.toLocaleDateString('es-ES', opciones);
    setFecha(fechaFormato);
  }, []);

  useEffect(() => {
    const shouldRefresh = localStorage.getItem('refreshDashboard');
    if (shouldRefresh === 'true') {
      localStorage.removeItem('refreshDashboard');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!usuario.sucursal_id) return;

    const cargarDatos = async () => {
      try {
        setLoading(true);

        if (usuario.role_id === 2) {
          // Para especialistas: cargar citas de hoy filtradas por especialista
          const citasData = await citasService.getCitasHoy(usuario.sucursal_id);
          const citasEspecialista = citasData.filter(cita => cita.especialista_id === usuario.id);
          setCitasHoy(citasEspecialista);
          setCitasDia(citasEspecialista);

          // Cargar citas de la siguiente semana
          const citasSemana = await citasService.getCitasSiguienteSemana(usuario.id);
          setCitasSiguienteSemana(citasSemana);

          // Cargar todas las citas para obtener completadas del especialista
          const todasLasCitas = await citasService.getCitasBySucursal(usuario.sucursal_id);

          // Total de citas del día (todas, incluyendo completadas)
          const totalCitasHoy = todasLasCitas.filter(
            cita => cita.especialista_id === usuario.id &&
              new Date(cita.fecha_hora).toDateString() === new Date().toDateString()
          ).length;

          // Citas completadas de hoy
          const completadasHoy = todasLasCitas.filter(
            cita => cita.especialista_id === usuario.id &&
              cita.estado === 'Completada' &&
              new Date(cita.fecha_hora).toDateString() === new Date().toDateString()
          ).length;

          // Citas completadas en general (todos los días)
          const completadasTotal = todasLasCitas.filter(
            cita => cita.especialista_id === usuario.id &&
              cita.estado === 'Completada'
          ).length;

          // Citas completadas esta semana
          const hoy = new Date();
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - hoy.getDay());
          const completadasSemana = todasLasCitas.filter(
            cita => cita.especialista_id === usuario.id &&
              cita.estado === 'Completada' &&
              new Date(cita.fecha_hora) >= inicioSemana
          ).length;

          // Citas completadas este mes
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          const completadasMes = todasLasCitas.filter(
            cita => cita.especialista_id === usuario.id &&
              cita.estado === 'Completada' &&
              new Date(cita.fecha_hora) >= inicioMes
          ).length;

          setMetricas({
            citas_hoy: totalCitasHoy,
            completadas_hoy: completadasHoy,
            completadas_total: completadasTotal,
            completadas_semana: completadasSemana,
            completadas_mes: completadasMes
          });
        } else if (usuario.role_id === 3) {
          // Para recepcionistas: cargar citas y métricas de la sucursal
          // Cargar especialistas de la sucursal para validar
          const especialistas = await citasService.getEspecialistas(usuario.sucursal_id);
          const idsEspecialistasDeSucursal = especialistas.map(e => e.id);

          let citasData = await citasService.getCitasHoy(usuario.sucursal_id);
          // Filtrar para mostrar solo citas de especialistas de esta sucursal
          citasData = citasData.filter(cita => idsEspecialistasDeSucursal.includes(cita.especialista_id));
          setCitasHoy(citasData);
          setCitasDia(citasData);

          // Cargar todas las citas para obtener completadas
          let todasLasCitas = await citasService.getCitasBySucursal(usuario.sucursal_id);
          // Filtrar para mostrar solo citas de especialistas de esta sucursal
          todasLasCitas = todasLasCitas.filter(cita => idsEspecialistasDeSucursal.includes(cita.especialista_id));

          // Total de citas del día
          const totalCitasHoy = todasLasCitas.filter(
            cita => new Date(cita.fecha_hora).toDateString() === new Date().toDateString()
          ).length;

          // Citas completadas de hoy
          const completadasHoy = todasLasCitas.filter(
            cita => cita.estado === 'Completada' &&
              new Date(cita.fecha_hora).toDateString() === new Date().toDateString()
          ).length;

          // Citas completadas en general (todos los días)
          const completadasTotal = todasLasCitas.filter(
            cita => cita.estado === 'Completada'
          ).length;

          // Citas completadas esta semana
          const hoy = new Date();
          const inicioSemana = new Date(hoy);
          inicioSemana.setDate(hoy.getDate() - hoy.getDay());
          const completadasSemana = todasLasCitas.filter(
            cita => cita.estado === 'Completada' &&
              new Date(cita.fecha_hora) >= inicioSemana
          ).length;

          // Citas completadas este mes
          const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          const completadasMes = todasLasCitas.filter(
            cita => cita.estado === 'Completada' &&
              new Date(cita.fecha_hora) >= inicioMes
          ).length;

          setMetricas({
            citas_hoy: totalCitasHoy,
            completadas_hoy: completadasHoy,
            completadas_total: completadasTotal,
            completadas_semana: completadasSemana,
            completadas_mes: completadasMes
          });
        } else {
          // Para gerentes: cargar métricas, citas, rendimiento y alertas de inventario
          // Cargar especialistas de la sucursal para validar
          const especialistas = await citasService.getEspecialistas(usuario.sucursal_id);
          const idsEspecialistasDeSucursal = especialistas.map(e => e.id);

          let todasCitas = await citasService.getCitasBySucursal(usuario.sucursal_id);
          // Filtrar para mostrar solo citas de especialistas de esta sucursal
          todasCitas = todasCitas.filter(cita => idsEspecialistasDeSucursal.includes(cita.especialista_id));
          
          // Calcular métricas basadas en citas filtradas
          const hoy = new Date();
          const hoyStr = hoy.toDateString();
          const citasHoyData = todasCitas.filter(c => new Date(c.fecha_hora).toDateString() === hoyStr);
          
          // Inicio de semana (lunes de esta semana)
          const inicioSemana = new Date(hoy);
          const dia = inicioSemana.getDay();
          const diasAlLunes = dia === 0 ? 1 : 1 - dia; // Si es domingo suma 1, si es otro va atrás al lunes
          inicioSemana.setDate(inicioSemana.getDate() + diasAlLunes);
          
          // Citas completadas de hoy
          const completadasHoy = citasHoyData.filter(c => c.estado === 'Completada').length;
          
          // Citas completadas en total
          const completadasTotal = todasCitas.filter(c => c.estado === 'Completada').length;
          
          setMetricas({
            citas_hoy: citasHoyData.length,
            completadas_hoy: completadasHoy,
            completadas_total: completadasTotal,
            pacientes_activos: 0 // Placeholder
          });
          
          const citasData = citasHoyData;
          setCitasHoy(citasData);
          setCitasDia(citasData);

          const rendimiento = await citasService.getRendimientoPersonal(usuario.sucursal_id);
          setRendimientoPersonal(rendimiento);

          const alertas = await citasService.getAlertasInventario(usuario.sucursal_id);
          setAlertasInventario(alertas);

          // Cargar ganancias para gerentes
          const gananciasData = await citasService.getGanancias(usuario.sucursal_id);
          setGanancias(gananciasData);
          
          // Actualizar métricas con datos exactos del backend
          setMetricas(prev => ({
            ...prev,
            completadas_semana: gananciasData.completadas_semana,
            completadas_mes: gananciasData.completadas_mes
          }));
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [usuario.sucursal_id, usuario.role_id, usuario.id]);

  // Si es gerente, mostrar dashboard especial
  if (usuario.role_id === 1) {
    if (loading) {
      return (
        <div className={styles.dashboardContainer}>
          <p>Cargando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.dashboardContainer}>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      );
    }

    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="RENOVA Logo" style={{ width: '80px', height: '80px' }} />
            <div>
              <h1 className={styles.title}>{usuario.sucursal_nombre}</h1>
              <p className={styles.subtitle}>👤 {usuario.nombre} • {fecha}</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>📅</div>
            <div className={styles.cardContent}>
              <h3>{metricas?.citas_hoy || 0}</h3>
              <p>Citas Hoy</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>✅</div>
            <div className={styles.cardContent}>
              <h3>{metricas?.completadas_hoy || 0}</h3>
              <p>Completadas Hoy</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardContent}>
              <h3>{metricas?.completadas_semana || 0}</h3>
              <p>Completadas Semana</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>📈</div>
            <div className={styles.cardContent}>
              <h3>{metricas?.completadas_mes || 0}</h3>
              <p>Completadas Mes</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>💰</div>
            <div className={styles.cardContent}>
              <h3>${ganancias?.ganancias_hoy || 0}</h3>
              <p>Ganancias Hoy</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>💵</div>
            <div className={styles.cardContent}>
              <h3>${ganancias?.ganancias_semana || 0}</h3>
              <p>Ganancias Semana</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardIcon}>💸</div>
            <div className={styles.cardContent}>
              <h3>${ganancias?.ganancias_mes || 0}</h3>
              <p>Ganancias Mes</p>
              <span className={styles.subtitle2}>Esta sucursal</span>
            </div>
          </div>
        </div>

        {/* Secciones Principales */}
        <div className={styles.mainContent}>
          {/* Citas de Hoy */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              ⏰ Citas de Hoy
              <span className={styles.badge}>{citasHoy.length} citas</span>
            </h2>
            <div className={styles.appointmentsList}>
              {citasHoy.length > 0 ? (
                citasHoy.slice(0, 3).map((cita) => (
                  <div key={cita.id} className={styles.appointmentItem}>
                    <span className={styles.time}>{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className={styles.appointmentInfo}>
                      <strong>{cita.paciente_nombre}</strong>
                      <p>{cita.profesional_nombre}</p>
                    </div>
                    <span className={styles.tag}>{cita.especialidad}</span>
                    <span className={cita.estado === 'confirmada' ? styles.tagConfirmed : styles.tagPending}>
                      {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </span>
                  </div>
                ))
              ) : (
                <p>No hay citas hoy</p>
              )}
            </div>
          </div>

          {/* Alertas de Inventario */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>⚠️ Alertas de Inventario</h2>
            <div className={styles.alertsList}>
              {alertasInventario.length > 0 ? (
                alertasInventario.map((item, idx) => (
                  <div key={idx} className={styles.alertItem}>
                    <div className={styles.alertName}>{item.nombre}</div>
                    <span className={styles.alertTag}>{item.categoria}</span>
                    <div className={styles.alertProgress}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${Math.round((item.cantidad / Math.max(item.stock_minimo, 1)) * 100)}%` }}
                      ></div>
                      <span className={styles.alertStock}>{item.cantidad}/{item.stock_minimo}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#4caf50', fontWeight: 500 }}>✅ Sin alertas de stock por el momento</p>
              )}
            </div>
          </div>
        </div>

        {/* Rendimiento del Personal */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👥 Rendimiento del Personal</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Área</th>
                <th>Citas (mes)</th>
              </tr>
            </thead>
            <tbody>
              {rendimientoPersonal.length > 0 ? (
                rendimientoPersonal.map((esp) => (
                  <tr key={esp.id}>
                    <td>{esp.nombre}</td>
                    <td><span className={styles.badge2}>{esp.area}</span></td>
                    <td>{esp.citas_mes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>Sin especialistas registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Dashboard para RECEPCIONISTA (role_id = 3)
  if (usuario.role_id === 3) {
    if (loading) {
      return (
        <div className={styles.receptionDashboard}>
          <p>Cargando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.receptionDashboard}>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      );
    }

    return (
      <div className={styles.receptionDashboard}>
        <div className={styles.receptionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="RENOVA Logo" style={{ width: '80px', height: '80px' }} />
            <div>
              <h1 className={styles.receptionTitle}>Recepción - {usuario.sucursal_nombre}</h1>
              <p className={styles.receptionDate}>👤 {usuario.nombre} • {fecha}</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className={styles.receptionMetrics}>
          <div className={styles.metricCard3}>
            <div className={styles.icon}>📅</div>
            <div className={styles.content}>
              <h3>{metricas?.citas_hoy || 0}</h3>
              <p>Citas de hoy</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>✅</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_hoy || 0}</h3>
              <p>Completadas hoy</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>🎯</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_total || 0}</h3>
              <p>Completadas en total</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>📅</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_semana || 0}</h3>
              <p>Completadas esta semana</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>📊</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_mes || 0}</h3>
              <p>Completadas este mes</p>
            </div>
          </div>
        </div>

        {/* Agenda del Día */}
        <div className={styles.scheduleSection}>
          <div className={styles.scheduleHeader}>
            <h2>⏰ Agenda del Día</h2>
            <input
              type="text"
              placeholder="Buscar por nombre del paciente..."
              className={styles.searchBox}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>

          <div className={styles.appointmentsList2}>
            {citasDia.filter(cita => cita.paciente_nombre.toLowerCase().includes(searchTerm)).length > 0 ? (
              citasDia.filter(cita => cita.paciente_nombre.toLowerCase().includes(searchTerm)).map((cita) => (
                <div key={cita.id} className={styles.appointmentRow}>
                  <span className={styles.appointmentTime}>{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className={styles.appointmentDetails}>
                    <strong>{cita.paciente_nombre}</strong>
                    <span>📞 {cita.telefono} • {cita.profesional_nombre}</span>
                  </div>
                  <span className={styles.appointmentType}>{cita.especialidad}</span>
                  <span className={cita.estado === 'confirmada' ? styles.statusConfirmed : styles.statusPending}>
                    {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                  </span>
                </div>
              ))
            ) : (
              <p>No hay citas para hoy</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard para ESPECIALISTA (role_id = 2)
  if (usuario.role_id === 2) {
    if (loading) {
      return (
        <div className={styles.receptionDashboard}>
          <p>Cargando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.receptionDashboard}>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      );
    }

    return (
      <div className={styles.receptionDashboard}>
        <div className={styles.receptionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logo} alt="RENOVA Logo" style={{ width: '80px', height: '80px' }} />
            <div>
              <h1 className={styles.receptionTitle}>Mi Agenda - {usuario.sucursal_nombre}</h1>
              <p className={styles.receptionDate}>👤 {usuario.nombre} • {fecha}</p>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className={styles.receptionMetrics}>
          <div className={styles.metricCard3}>
            <div className={styles.icon}>📅</div>
            <div className={styles.content}>
              <h3>{metricas?.citas_hoy || 0}</h3>
              <p>Citas de hoy</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>✅</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_hoy || 0}</h3>
              <p>Completadas hoy</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>🎯</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_total || 0}</h3>
              <p>Completadas en total</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>📅</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_semana || 0}</h3>
              <p>Completadas esta semana</p>
            </div>
          </div>

          <div className={styles.metricCard3}>
            <div className={styles.icon}>📊</div>
            <div className={styles.content}>
              <h3>{metricas?.completadas_mes || 0}</h3>
              <p>Completadas este mes</p>
            </div>
          </div>
        </div>

        {/* Agenda del Día */}
        <div className={styles.scheduleSection}>
          <div className={styles.scheduleHeader}>
            <h2>⏰ Mis Citas</h2>
            <input
              type="text"
              placeholder="Buscar por nombre del paciente..."
              className={styles.searchBox}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>

          <div className={styles.appointmentsList2}>
            {citasDia
              .filter(cita =>
                cita.paciente_nombre.toLowerCase().includes(searchTerm) &&
                cita.estado !== 'Completada'
              ).length > 0 ? (
              citasDia
                .filter(cita =>
                  cita.paciente_nombre.toLowerCase().includes(searchTerm) &&
                  cita.estado !== 'Completada'
                )
                .map((cita) => (
                  <div key={cita.id} className={styles.appointmentRow}>
                    <span className={styles.appointmentTime}>{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className={styles.appointmentDetails}>
                      <strong>{cita.paciente_nombre}</strong>
                      <span>📞 {cita.telefono} • 📧 {cita.paciente_email}</span>
                      <span>💼 {cita.especialidad} • 📂 {cita.area}</span>
                    </div>
                    <span className={styles.appointmentType}>{cita.area}</span>
                    <span className={cita.estado === 'confirmada' ? styles.statusConfirmed : styles.statusPending}>
                      {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </span>
                  </div>
                ))
            ) : (
              <p>No hay citas para hoy</p>
            )}
          </div>
        </div>

        {/* Próximas Citas de la Siguiente Semana */}
        <div className={styles.scheduleSection}>
          <div className={styles.scheduleHeader}>
            <h2>📅 Próximas Citas (Siguiente Semana)</h2>
          </div>
          <div className={styles.appointmentsList2}>
            {citasSiguienteSemana && citasSiguienteSemana.length > 0 ? (
              citasSiguienteSemana.map((cita) => (
                <div key={cita.id} className={styles.appointmentRow}>
                  <span className={styles.appointmentTime}>
                    {new Date(cita.fecha_hora).toLocaleDateString('es-ES')} • {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={styles.appointmentDetails}>
                    <strong>{cita.paciente_nombre}</strong>
                    <span>📞 {cita.telefono} • 📧 {cita.paciente_email}</span>
                    <span>💼 {cita.especialidad} • 📂 {cita.area}</span>
                  </div>
                  <span className={styles.appointmentType}>{cita.area}</span>
                  <span className={cita.estado === 'confirmada' ? styles.statusConfirmed : styles.statusPending}>
                    {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                  </span>
                </div>
              ))
            ) : (
              <p>No hay citas programadas para la siguiente semana</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard para otros roles
  return (
    <div>
      <h1>Panel Principal</h1>
      <p>Bienvenido al sistema RENOVA</p>
    </div>
  );
}