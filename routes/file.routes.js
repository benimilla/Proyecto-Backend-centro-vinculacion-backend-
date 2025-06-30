import express from 'express';
import { uploadMultiple, download } from '../controllers/file.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';

// Almacenamiento con nombre único pero preserva extensión
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const uploadMiddleware = multer({ storage });

const router = express.Router();

// Múltiples archivos, hasta 10
router.post('/:actividadId', auth, uploadMiddleware.array('files', 10), uploadMultiple);

// Descarga
router.get('/download/:filename', auth, download);

export { router };
