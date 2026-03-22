import { useEffect, useState } from 'react';
import styles from './Usuarios.module.css';
import * as usuariosService from '../services/usuarios.service';
import * as sucursalesService from '../services/sucursal.service';

export default function Usuarios() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    role_id: 2,
    sucursal_id: usuario.sucursal_id || ''
  });

  const roles = {
    1: 'Gerente',
    2: 'Especialista',
    3: 'Recepcionista',
    4: 'Administrador de Inventario'
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const usuariosData = await usuariosService.getUsuarios();
      const sucursalesData = await sucursalesService.getSucursales();
      
      setUsuarios(usuariosData);
      setSucursales(sucursalesData);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregar = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      role_id: 2,
      sucursal_id: usuario.sucursal_id || ''
    });
    setEditando(null);
    setModalAbierto(true);
  };

  const handleEditar = (usr) => {
    setFormData({
      nombre: usr.nombre,
      email: usr.email,
      password: '',
      role_id: usr.role_id,
      sucursal_id: usr.sucursal_id || ''
    });
    setEditando(usr.id);
    setModalAbierto(true);
  };

  const handleEliminar = async (id) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await usuariosService.eliminarUsuario(id);
        setSuccess('Usuario eliminado correctamente');
        cargarDatos();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Error al eliminar usuario');
        console.error(err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleGuardar = async () => {
    try {
      setError(null);

      // Validaciones
      if (!formData.nombre || !formData.email || (!editando && !formData.password)) {
        setError('Por favor complete todos los campos');
        return;
      }

      if (editando) {
        // Actualizar
        await usuariosService.actualizarUsuario(editando, formData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        // Crear
        await usuariosService.crearUsuario(formData);
        setSuccess('Usuario creado correctamente');
      }

      setModalAbierto(false);
      cargarDatos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar usuario');
      console.error(err);
    }
  };

  const usuariosFiltrados = usuarios.filter(usr => {
    const cumpleRol = roleFilter === '' || usr.role_id === parseInt(roleFilter);
    const cumpleBusqueda = 
      usr.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usr.email.toLowerCase().includes(searchTerm.toLowerCase());
    return cumpleRol && cumpleBusqueda;
  });

  const getRoloBadge = (roleId) => {
    const rolClass = {
      1: 'gerente',
      2: 'especialista',
      3: 'recepcionista',
      4: 'especialista'
    }[roleId];
    return (
      <span className={`${styles.rolBadge} ${styles[rolClass]}`}>
        {roles[roleId]}
      </span>
    );
  };

  if (loading) {
    return <div className={styles.loading}>Cargando usuarios...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Gestión de Especialistas y Recepcionistas</h1>
          <button className={styles.btnAgregar} onClick={handleAgregar}>
            + Agregar Usuario
          </button>
        </div>

        <div className={styles.messagesSection}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
        </div>

        <div className={styles.filtrosSection}>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Filtrar por rol...</option>
            <option value="2">Especialista</option>
            <option value="3">Recepcionista</option>
          </select>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      {usuariosFiltrados.length === 0 ? (
        <div className={styles.noResultados}>
          No hay usuarios que coincidan con los filtros
        </div>
      ) : (
        <div className={styles.tablaContainer}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Sucursal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(usr => (
                <tr key={usr.id} style={usuario.id === usr.id ? { backgroundColor: '#e8f4f8' } : {}}>
                  <td>
                    {usr.nombre}
                    {usuario.id === usr.id && <span className={styles.tuCuenta}> (Tu cuenta)</span>}
                  </td>
                  <td>{usr.email}</td>
                  <td>{getRoloBadge(usr.role_id)}</td>
                  <td>
                    {sucursales.find(s => s.id === usr.sucursal_id)?.nombre || 'N/A'}
                  </td>
                  <td>
                    <div className={styles.acciones}>
                      <button
                        className={styles.btnEditar}
                        onClick={() => handleEditar(usr)}
                        disabled={usuario.id === usr.id}
                        title={usuario.id === usr.id ? 'No puedes editar tu propia cuenta' : 'Editar usuario'}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnEliminar}
                        onClick={() => handleEliminar(usr.id)}
                        disabled={usuario.id === usr.id}
                        title={usuario.id === usr.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className={styles.modalOverlay} onClick={() => setModalAbierto(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar Usuario' : 'Agregar Usuario'}</h2>

            <div className={styles.formGroup}>
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Nombre completo"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
              />
            </div>

            {!editando && (
              <div className={styles.formGroup}>
                <label>Contraseña *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Contraseña"
                />
              </div>
            )}

            {editando && (
              <div className={styles.formGroup}>
                <label>Nueva Contraseña (dejar en blanco para mantener la actual)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nueva contraseña (opcional)"
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Rol *</label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
              >
                <option value="2">Especialista</option>
                <option value="3">Recepcionista</option>
              </select>
            </div>

            {!editando ? (
              <div className={styles.formGroup}>
                <label>Sucursal</label>
                <div className={styles.inputReadOnly}>
                  {sucursales.find(s => s.id === usuario.sucursal_id)?.nombre || 'Tu sucursal'}
                </div>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label>Sucursal</label>
                <div className={styles.inputReadOnly}>
                  {sucursales.find(s => s.id === formData.sucursal_id)?.nombre || 'N/A'}
                </div>
              </div>
            )}

            <div className={styles.formAcciones}>
              <button
                className={styles.btnCancelar}
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnGuardar}
                onClick={handleGuardar}
              >
                {editando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
