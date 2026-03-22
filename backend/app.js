const express = require('express');
const cors = require('cors');
require('./config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
const sucursalRoutes = require('./routes/sucursal.routes');
const authRoutes = require('./routes/auth.routes');
const citasRoutes = require('./routes/citas.routes');
const pacientesRoutes = require('./routes/pacientes.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const productosRoutes = require('./routes/productos.routes');

app.get('/', (req, res) => {
  res.send('Server running');
});

app.use('/api/sucursales', sucursalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});