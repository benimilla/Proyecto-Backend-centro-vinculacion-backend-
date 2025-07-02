import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import * as logger from './utils/logger.js';
import { auth } from './middlewares/auth.middleware.js';

// Importar routers
import { router as authRoutes } from './routes/auth.routes.js';
import { router as userRoutes } from './routes/user.routes.js';
import { router as permissionsRoutes } from './routes/permissions.routes.js';  // <- Aquí
// ... importa los demás routers que tengas

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir carpeta pública uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS configuración
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

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rutas públicas
app.use('/api/auth', authRoutes);

// Middleware autenticación para rutas protegidas
app.use(auth);

// Rutas protegidas
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionsRoutes); // <---- Aquí integras las rutas de permisos

// ... integra los demás routers protegidos según tu proyecto

// 404 para endpoints no encontrados
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Middleware manejo de errores
app.use((err, req, res, next) => {
  (logger.error || logger.default?.error)(err.stack || err.message || 'Error desconocido');
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
