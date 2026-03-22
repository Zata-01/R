import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ rolesPermitidos }) => {
    const token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const usuario = JSON.parse(usuarioStr);

    if (rolesPermitidos && !rolesPermitidos.includes(usuario.role_id)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;