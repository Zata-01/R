import { useEffect, useState } from 'react';
import { getSucursales } from '../services/sucursal.service';
import styles from './Sucursales.module.css';

export default function Sucursales() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const data = await getSucursales();
                setSucursales(data);
            } catch (error) {
                console.error(error);
                alert("No se pudieron cargar las sucursales");
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const filteredSucursales = sucursales.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.direccion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <p>Cargando sucursales...</p>;

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1>Sucursales</h1>
                </div>

                <div className={styles.searchSection}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Dirección</th>
                                <th>Teléfono</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSucursales.length > 0 ? (
                                filteredSucursales.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.id}</td>
                                        <td>{s.nombre}</td>
                                        <td>{s.direccion}</td>
                                        <td>{s.telefono}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className={styles.empty}>
                                        No se encontraron sucursales
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}