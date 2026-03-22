import { useEffect, useState } from 'react';
import productoService from '../services/producto.service';
import styles from './Productos.module.css';

export default function Productos() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    const [productos, setProductos] = useState([]);
    const [todosProductos, setTodosProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria_id: '',
        unidad: '',
        cantidad: 0,
        stock_minimo: 10
    });

    const categorias = [
        { id: 1, nombre: 'Material Dental' },
        { id: 2, nombre: 'Equipos Oftalmología' },
        { id: 3, nombre: 'Productos Spa' },
        { id: 4, nombre: 'Suministros Generales' }
    ];

    const unidades = ['jeringa', 'metro', 'frasco', 'unidad', 'par', 'litro', 'caja'];

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            if (usuario.role_id === 2 || usuario.role_id === 1) {
                const data = await productoService.getProductosSucursal(usuario.sucursal_id);
                setProductos(data);
            } else {
                setProductos([]);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            alert('No se pudieron cargar los productos: ' + (error.mensaje || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (producto = null) => {
        if (usuario.role_id !== 1) {
            alert('No tienes permisos para agregar/editar productos');
            return;
        }
        
        if (producto) {
            setEditingProducto(producto);
            setFormData({
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                categoria_id: producto.categoria_id ? String(producto.categoria_id) : '',
                unidad: producto.unidad,
                cantidad: producto.cantidad || 0,
                stock_minimo: producto.stock_minimo || 10
            });
        } else {
            setEditingProducto(null);
            setFormData({
                nombre: '',
                descripcion: '',
                categoria_id: '',
                unidad: '',
                cantidad: 0,
                stock_minimo: 10
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProducto(null);
        setFormData({
            nombre: '',
            descripcion: '',
            categoria_id: '',
            unidad: '',
            cantidad: 0,
            stock_minimo: 10
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'cantidad' || name === 'stock_minimo') ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.categoria_id || !formData.unidad) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            if (editingProducto) {
                const { cantidad, stock_minimo, ...datosProducto } = formData;
                await productoService.updateProducto(editingProducto.id, datosProducto);
                
                // Actualizar inventario de su sucursal
                if (cantidad !== undefined) {
                    await productoService.updateCantidadInventario(editingProducto.id, usuario.sucursal_id, cantidad, stock_minimo);
                }
                // Forzar refresh del Dashboard cuando vuelva
                localStorage.setItem('refreshDashboard', 'true');
                alert('Producto actualizado exitosamente');
            } else {
                const { cantidad, stock_minimo, ...datosProducto } = formData;
                const response = await productoService.createProducto(datosProducto);
                
                // Guardar cantidad inicial para la sucursal del usuario
                if (cantidad >= 0 && response.productoId) {
                    await productoService.updateCantidadInventario(response.productoId, usuario.sucursal_id, cantidad, stock_minimo);
                }
                alert('Producto creado exitosamente');
            }
            handleCloseModal();
            cargarDatos();
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + (error.mensaje || 'Ocurrió un error'));
        }
    };

    const handleDelete = async (id) => {
        if (usuario.role_id !== 1) {
            alert('No tienes permisos para eliminar productos');
            return;
        }

        if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            try {
                await productoService.deleteProducto(id);
                alert('Producto eliminado exitosamente');
                cargarDatos();
            } catch (error) {
                console.error('Error al eliminar:', error);
                alert('Error al eliminar el producto');
            }
        }
    };

    const filteredProductos = productos.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <p>Cargando productos...</p>;

    if (!usuario || !usuario.id) {
        return (
            <div className={styles.container}>
                <p style={{color: 'red', padding: '20px'}}>
                    Error: No se encontró información del usuario. Por favor, vuelve a iniciar sesión.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1>Productos</h1>
                    {usuario.role_id === 1 && (
                        <button className={styles.newBtn} onClick={() => handleOpenModal()}>
                            + Nuevo Producto
                        </button>
                    )}
                </div>

                <div className={styles.searchSection}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.tableWrapper}>
                <table className={styles.productosTable}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Unidad</th>
                            <th>Cantidad</th>
                            {usuario.role_id === 1 && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProductos.length > 0 ? (
                            filteredProductos.map((producto) => (
                                <tr key={producto.id} className={producto.cantidad === 0 ? styles.agotado : producto.cantidad < producto.stock_minimo ? styles.bajStock : ''}>
                                    <td>{producto.id}</td>
                                    <td>{producto.nombre}</td>
                                    <td>{producto.descripcion || 'N/A'}</td>
                                    <td>{producto.categoria}</td>
                                    <td>{producto.unidad}</td>
                                    <td className={styles.cantidadCell}>
                                        <span>{producto.cantidad}</span>
                                    </td>
                                    {usuario.role_id === 1 && (
                                        <td className={styles.actions}>
                                            <button
                                                className={styles.editBtn}
                                                onClick={() => handleOpenModal(producto)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(producto.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={usuario.role_id === 1 ? 8 : 7} className={styles.empty}>
                                    No se encontraron productos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </div>

            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Categoría *</label>
                                <select
                                    name="categoria_id"
                                    value={formData.categoria_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">-- Seleccionar categoría --</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id.toString()}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Unidad *</label>
                                <select
                                    name="unidad"
                                    value={formData.unidad}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">-- Seleccionar unidad --</option>
                                    {unidades.map(unidad => (
                                        <option key={unidad} value={unidad}>
                                            {unidad}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Cantidad</label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="1"
                                />
                            </div>
                            {!editingProducto && (
                                <div className={styles.formGroup}>
                                    <label>Stock Mínimo</label>
                                    <input
                                        type="number"
                                        name="stock_minimo"
                                        value={formData.stock_minimo}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="1"
                                    />
                                </div>
                            )}
                            <div className={styles.modalButtons}>
                                <button type="submit" className={styles.submitBtn}>
                                    {editingProducto ? 'Actualizar' : 'Crear'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={handleCloseModal}
                                >
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
