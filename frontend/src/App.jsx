import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

import Citas from './pages/Citas';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Login from './pages/Login';
import Configuracion from './pages/Configuracion';
import Historial from './pages/Historial';
import NotasClinicas from './pages/NotasClinicas';
import Productos from './pages/Productos';
import { logout } from './services/auth.service';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Sucursales from './pages/Sucursales';


function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuarioStr = localStorage.getItem('usuario');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload();
  };

  if (!token) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar usuario={usuario} />
      
      <div style={{ flex: 1, marginLeft: '250px', overflow: 'auto' }}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={[1]} />}>
            <Route path="/sucursales" element={<Sucursales />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={[1, 2]} />}>
            <Route path="/productos" element={<Productos />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={[1, 4]} />}>
            <Route path="/inventario" element={<Inventario />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={[1, 2]} />}>
            <Route path="/historial-clinico" element={<Historial />} />
            <Route path="/notas-clinicas" element={<NotasClinicas />} />
          </Route>

          <Route element={<ProtectedRoute rolesPermitidos={[1, 2, 3]} />}>
            <Route path="/citas" element={<Citas />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;