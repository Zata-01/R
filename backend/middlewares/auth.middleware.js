const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ mensaje: "Acceso denegado. No se envió el header Authorization." });
    }

    const partes = authHeader.trim().split(' ');
    if (partes.length !== 2 || partes[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({ mensaje: "Acceso denegado. Formato de token inválido (se esperaba 'Bearer TOKEN')." });
    }

    const token = partes[1];

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        next();
    } catch (error) {
        console.error("Error al verificar JWT:", error.message);
        return res.status(401).json({ mensaje: "Token inválido o expirado." });
    }
};

module.exports = { verificarToken };