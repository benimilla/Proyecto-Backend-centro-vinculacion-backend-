import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';

import logger from './utils/logger.js';
import authMiddleware from './middlewares/auth.middleware.js';
import csrfMiddleware from './middlewares/csrf.middleware.js';

// Routers
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import activityRoutes from './routes/activity.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import fileRoutes from './routes/file.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';

// Carga variables de entorno
dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// CORS - ajusta allowedOrigins con tus dominios frontend permitidos
const allowedOrigins = [
  'http://localhost:3000',
  'https://tudominio-frontend.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origin (postman, curl)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'La política de CORS no permite este origen.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Seguridad HTTP headers
app.use(helmet());

// Limitar peticiones para evitar ataques DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 solicitudes por IP
});
app.use(limiter);

// Parseo JSON y cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF middleware (si usas cookies)
app.use(csrfMiddleware);

// Rutas públicas (auth)
app.use('/api/auth', authRoutes);

// Middleware para rutas protegidas
app.use(authMiddleware);

// Rutas protegidas
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
