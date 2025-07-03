import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadMultiple, download, getArchivosPorActividad } from '../controllers/file.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 💾 Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const uploadMiddleware = multer({ storage });

// ✅ Obtener archivos de una actividad (nuevo endpoint)
router.get('/:actividadId', auth, getArchivosPorActividad);

// ✅ Subir múltiples archivos
router.post('/:actividadId', auth, uploadMiddleware.array('files', 10), uploadMultiple);

// ✅ Descargar archivo

export { router as publicFiles }; // 👈 Así ase

//aaa