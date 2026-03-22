import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { login } from '../services/auth.service';
import API_BASE_URL from '../config';
import logo from '../assets/logo.png';
import styles from './Login.module.css';

export default function Login() {
    const [rol, setRol] = useState('');
    const [contextoId, setContextoId] = useState(''); // Guarda ID de Sucursal o Especialista
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const [listaSucursales, setListaSucursales] = useState([]);
    const [listaEspecialistas, setListaEspecialistas] = useState([]);
    
    const navigate = useNavigate();

    // INITIALIZATION
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resSuc = await axios.get(`${API_BASE_URL}/auth/sucursales-public`);
                const resEsp = await axios.get(`${API_BASE_URL}/auth/especialistas-public`);
                setListaSucursales(resSuc.data);
                setListaEspecialistas(resEsp.data);
            } catch (err) {
                console.error("Error al cargar datos iniciales:", err);
            }
        };
        cargarDatos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const sucursalSeleccionada = listaSucursales.find(s => s.id === parseInt(contextoId));
            const nombreSucursal = sucursalSeleccionada ? sucursalSeleccionada.nombre : 'Sucursal';
            
            await login(email, password, contextoId, rol, nombreSucursal);
            navigate('/');
        } catch (err) {
            setError(err.mensaje || 'Credenciales o datos inválidos');
        }
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.loginCard}>
                <div style={{marginBottom: '2rem', display: 'flex', justifyContent: 'center'}}>
                    <img src={logo} alt="RENOVA Logo" style={{width: '100px', height: '100px'}} />
                </div>
                
                <h2 className={styles.title}>Bienvenido a Renova</h2>
                <p className={styles.subtitle}>Selecciona tu rol para acceder al sistema</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Tipo de usuario</label>
                        <select 
                            className={styles.selectInput}
                            value={rol}
                            onChange={(e) => {
                                setRol(e.target.value);
                                setContextoId('');
                            }}
                            required
                        >
                            <option value="">Seleccionar rol...</option>
                            <option value="gerente">Gerente</option>
                            <option value="recepcionista">Recepcionista</option>
                            <option value="especialista">Especialista</option>
                        </select>
                    </div>

                    {(rol === 'recepcionista' || rol === 'gerente' || rol === 'especialista') && (
                        <div className={styles.formGroup}>
                            <label>Sucursal</label>
                            <select 
                                className={styles.selectInput} 
                                value={contextoId}
                                onChange={(e) => setContextoId(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar sucursal...</option>
                                {listaSucursales.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Correo electrónico</label>
                        <input 
                            type="email" 
                            className={styles.textInput} 
                            placeholder="usuario@renova.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Contraseña</label>
                        <input 
                            type="password" 
                            className={styles.textInput} 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p style={{color: 'red', fontSize: '0.8rem', marginBottom: '1rem'}}>{error}</p>}

                    <button type="submit" className={styles.btnIniciar}>
                        <span>➔</span> Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
}