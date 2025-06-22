// app.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimiter from './middlewares/rateLimiter.js';
import csrfMiddleware from './middlewares/csrf.middleware.js';
import authMiddleware from './middlewares/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import activityRoutes from './routes/activity.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import fileRoutes from './routes/file.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middlewares globales
app.use(helmet());                     // Seguridad HTTP headers
app.use(cors());                       // CORS
app.use(morgan('dev'));                // Logging HTTP requests
app.use(express.json());               // Parsear JSON en body
app.use(express.urlencoded({ extended: true })); // Parsear body urlencoded

// Rate limiter (limitar peticiones)
app.use(rateLimiter);

// Middleware CSRF (ejemplo, solo en rutas protegidas)
app.use(csrfMiddleware);

// Rutas públicas
app.use('/api/auth', authRoutes);

// Middleware para proteger rutas con autenticación JWT
app.use(authMiddleware);

// Rutas protegidas
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Ruta para probar conexión Prisma
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Simple ping a BD
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error'
    }
  });
});

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
