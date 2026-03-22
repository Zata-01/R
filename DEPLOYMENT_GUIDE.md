# 🚀 Guía de Despliegue en Railway

## Paso 1: Instalar Railway CLI
```bash
npm install -g @railway/cli
```

## Paso 2: Iniciar Sesión en Railway
```bash
railway login
```
Se abrirá una ventana del navegador. Inicia sesión o crea una cuenta (GRATIS).

## Paso 3: Crear Proyecto en Railway
```bash
cd c:\Users\angel\Desktop\RENOVA
railway init
```
Selecciona:
- Nombre del proyecto: `renova`
- Environment: deja en blanco (default)

## Paso 4: Agregar Base de Datos MySQL

### Opción A: Usar MySQL de Railway (RECOMENDADO)
```bash
railway add
```
Selecciona **MySQL** de la lista de servicios disponibles.

Esto creará automáticamente:
- Base de datos MySQL en Railway
- Variables de entorno con credenciales (DB_HOST, DB_USER, DB_PASSWORD, etc.)

### Opción B: Usar tu MySQL actual (más complicado)
Si tienes un servidor MySQL externo, necesitarás:
- Host del servidor (IP pública)
- Puerto (3306)
- Usuario y contraseña
- Nombre de base de datos

## Paso 5: Configurar Variables de Entorno

### Backend
En Railway dashboard:
1. Ve a tu proyecto → Backend service → Settings → Variables
2. Agrega o actualiza:
```
PORT=3000
DB_HOST=<tu_host_mysql>
DB_USER=<tu_usuario>
DB_PASSWORD=<tu_password>
DB_NAME=renova_clinica
JWT_SECRET=tu_secreto_seguro_aqui_cambialo
NODE_ENV=production
```

### Frontend
Las variables del frontend se configuran en el archivo `.env` durante build:
```
VITE_API_URL=https://tu-backend-url.railway.app/api
```

## Paso 6: Migrar Base de Datos

### 6.1 Backup de tu base de datos local
```bash
mysqldump -u root -p12345 renova_clinica > renova_backup.sql
```

### 6.2 Restaurar en el servidor MySQL de Railway

Una vez que Railway cree la BD MySQL, obtén las credenciales:
```bash
railway run mysql -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> renova_clinica < renova_backup.sql
```

O desde MySQL Workbench:
1. Connection type: MySQL
2. Hostname: (de Railway)
3. Port: (de Railway)
4. Username: (de Railway)
5. Password: (de Railway)
6. Database: renova_clinica
7. File → Open SQL Script → renova_backup.sql
8. Ejecutar

## Paso 7: Desplegar Backend

```bash
cd c:\Users\angel\Desktop\RENOVA\backend
railway add # si es primera vez
railway up
```

O desde Railway dashboard:
1. Conecta tu repositorio GitHub
2. Deploy automático con cada push

## Paso 8: Desplegar Frontend

El frontend se puede:

### Opción A: Usar Vercel (RECOMENDADO - Gratis)
```bash
npm install -g vercel
cd c:\Users\angel\Desktop\RENOVA\frontend
vercel --prod
```

Durante el deploy, configura la variable:
```
VITE_API_URL=https://tu-backend-url.railway.app/api
```

### Opción B: Desplegar en Railway
1. Railway detectará automáticamente el build de Vite
2. El frontend se servirá en: `https://tu-proyecto.railway.app`

## Paso 9: Actualizar URLs del Frontend

Una vez que tengas la URL de tu backend en Railway:

**Frontend - archivo `.env.production`:**
```
VITE_API_URL=https://tu-backend-railway.app/api
VITE_FRONTEND_URL=https://tu-frontend-url.app
```

## ✅ Checklist Final

- [ ] Instalé Railway CLI
- [ ] Creé proyecto en Railway  
- [ ] Agregué MySQL a Railway
- [ ] Migraré la base de datos
- [ ] Configuré variables de entorno del backend
- [ ] Desplegué el backend
- [ ] Desplegué el frontend (Vercel o Railway)
- [ ] Actualicé la URL de API en frontend
- [ ] Probé login en producción
- [ ] Probé crear una cita
- [ ] Probé ver dashboard

## 🔗 URLs Importantes

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard (opcional)
- Backend URL: `https://[nombre-proyecto].railway.app`
- Frontend URL: Según donde la despliegues

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que DB_HOST esté correcto (no usar localhost)
- Revisa que la contraseña no tenga caracteres especiales sin escaping
- Asegúrate de que la BD MySQL está funcionando en Railway

### Error: "Frontend no puede conectarse a backend"
- Verifica que VITE_API_URL sea la URL completa del backend en Railway
- Comprueba que el backend esté online (ver logs en Railway dashboard)
- Revisa CORS en backend (`app.js` - permitir origine del frontend)

### Error: "JWT_SECRET no definido"
- Asegúrate de que JWT_SECRET esté en las variables de entorno de Railway
- No lo hardcodees en el código

## 📞 Preguntas Comunes

**¿Cuánto cuesta Railway?**
- Gratis hasta $5 USD mensuales. Después pagas solo lo que uses.

**¿Mi base de datos será segura?**
- Sí, Railway usa encriptación y está en servidores seguros.

**¿Puedo usar mi dominio propio?**
- Sí, Railway te permite agregar dominios personalizados. Configuración: Project → Settings → Domains.

---

**¿Necesitas ayuda con algún paso específico? Dímelo y te guío.**
