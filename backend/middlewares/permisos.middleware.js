// PERMISSIONS MIDDLEWARE
const PERMISOS = {
    'crear_cita': [1, 3],
    'editar_cita': [1, 3],
    'cambiar_estado_cita': [1, 2, 3],
    'eliminar_cita': [1, 3],
    'ver_inventario': [1, 3],
    'editar_inventario': [1],
    'crear_nota_clinica': [1, 2],
    'editar_nota_clinica': [1, 2],
    'ver_reportes': [1, 2],
    'crear_paciente': [1, 3],
    'editar_paciente': [1, 3],
    'crear_usuario': [1],
    'editar_usuario': [1],
};

const verificarPermiso = (operacion) => {
    return (req, res, next) => {
        if (!PERMISOS[operacion]) {
            return res.status(400).json({ mensaje: 'Operación no definida', operacion });
        }

        const roleUsuario = req.usuario?.role_id;
        if (!roleUsuario) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        if (!PERMISOS[operacion].includes(roleUsuario)) {
            return res.status(403).json({ 
                mensaje: `No tienes permiso para: ${operacion}`,
                tu_rol: roleUsuario,
                roles_permitidos: PERMISOS[operacion],
                operacion
            });
        }

        next();
    };
};

const soloEspecialista = (req, res, next) => {
    if (req.usuario?.role_id !== 2) {
        return res.status(403).json({ mensaje: 'Solo especialistas pueden acceder', tu_rol: req.usuario?.role_id });
    }
    next();
};

const soloGerente = (req, res, next) => {
    if (req.usuario?.role_id !== 1) {
        return res.status(403).json({ mensaje: 'Solo gerentes pueden acceder', tu_rol: req.usuario?.role_id });
    }
    next();
};

const especialistaOGerente = (req, res, next) => {
    if (![1, 2].includes(req.usuario?.role_id)) {
        return res.status(403).json({ mensaje: 'Necesitas ser especialista o gerente', tu_rol: req.usuario?.role_id });
    }
    next();
};

const validarEspecialistaPropiaCita = (req, res, next) => {
    const citaEspecialistaId = req.cita?.especialista_id;
    const usuarioId = req.usuario?.id;

    if (req.usuario?.role_id === 2 && citaEspecialistaId !== usuarioId) {
        return res.status(403).json({ mensaje: 'No puedes acceder a citas de otros especialistas' });
    }

    next();
};

module.exports = { verificarPermiso, soloEspecialista, soloGerente, especialistaOGerente, validarEspecialistaPropiaCita, PERMISOS };
