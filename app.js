import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

import * as logger from './utils/logger.js';
import { auth } from './middlewares/auth.middleware.js';

import { router as authRoutes } from './routes/auth.routes.js';
import { router as userRoutes } from './routes/user.routes.js';
import { router as activityRoutes } from './routes/activity.routes.js';
import { router as citaRoutes } from './routes/cita.routes.js';
import { router as fileRoutes } from './routes/file.routes.js';
import { router as tipoActividadRoutes } from './routes/tipoActividad.routes.js';
import { router as lugarRoutes } from './routes/lugar.routes.js';
import { router as oferenteRoutes } from './routes/oferente.routes.js';
import { router as socioRoutes } from './routes/socio.routes.js';
import { router as proyectoRoutes } from './routes/proyecto.routes.js';
import { router as reportesRoutes } from './routes/reportes.routes.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// 🔽 Configurar __dirname para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔽 Servir carpeta /uploads de forma pública
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔽 Configuración CORS
const allowedOrigins = [
  'http://localhost:4000',
  'https://tudominio-frontend.com', // Reemplaza por el dominio real si tienes uno
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

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🔽 Rutas públicas sin autenticación
app.use('/api/auth', authRoutes);

// 🔽 Middleware de autenticación para rutas protegidas
app.use(auth);

// 🔽 Rutas protegidas
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/tipos-actividad', tipoActividadRoutes);
app.use('/api/lugares', lugarRoutes);
app.use('/api/oferentes', oferenteRoutes);
app.use('/api/socios', socioRoutes);
app.use('/api/proyectos', proyectoRoutes);

// 🔽 404 - Endpoint no encontrado
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// 🔽 Manejador de errores
app.use((err, req, res, next) => {
  (logger.error || logger.default?.error)(err.stack || err.message || 'Error desconocido');
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});