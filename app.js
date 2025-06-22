import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import * as logger from './utils/logger.js';
import * as csrfMiddleware from './middlewares/csrf.middleware.js';
import { auth } from './middlewares/auth.middleware.js';

import { router as authRoutes } from './routes/auth.routes.js';
import { router as userRoutes } from './routes/user.routes.js';
import { router as activityRoutes } from './routes/activity.routes.js';
import { router as appointmentRoutes } from './routes/appointment.routes.js';
import { router as fileRoutes } from './routes/file.routes.js';
import { router as maintenanceRoutes } from './routes/maintenance.routes.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Configuración CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://tudominio-frontend.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('La política de CORS no permite este origen.'), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Seguridad y parsing
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware CSRF
app.use(csrfMiddleware.csrfProtection || csrfMiddleware.default || csrfMiddleware);

// Ruta para obtener token CSRF
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rutas públicas
app.use('/api/auth', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use(auth);

// Rutas protegidas
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejador de errores
app.use((err, req, res, next) => {
  (logger.error || logger.default?.error)(err.stack || err.message || 'Error desconocido');
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
