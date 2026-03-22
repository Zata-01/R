import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth.service';
import styles from './Sidebar.module.css';

export default function Sidebar({ usuario }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload();
  };

  const getLinksByRole = () => {
    const role_id = usuario?.role_id;

    // GERENTE (role_id = 1)
    if (role_id === 1) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Sucursales', path: '/sucursales' },
        { label: 'Inventario', path: '/productos' },
        { label: 'Citas', path: '/citas' },
        { label: 'Notas Clínicas', path: '/notas-clinicas' },
      ];
    }

    // ESPECIALISTA (role_id = 2)
    if (role_id === 2) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Productos', path: '/productos' },
        { label: 'Notas Clínicas', path: '/notas-clinicas' },
        { label: 'Citas', path: '/citas' },
      ];
    }

    // RECEPCIONISTA (role_id = 3)
    if (role_id === 3) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Citas', path: '/citas' },
      ];
    }

    return [];
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.logo}>RENOVA</h2>
      </div>

      <nav className={styles.nav}>
        {getLinksByRole().map((link, idx) => (
          <Link key={idx} to={link.path} className={styles.navLink}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
