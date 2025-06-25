// routes/file.routes.js
import express from 'express';
import { upload, download } from '../controllers/file.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import multer from 'multer';

const router = express.Router();

// Configuración básica de multer para subir archivos
const uploadMiddleware = multer({ dest: 'uploads/' });

router.post('/:actividadId', auth, uploadMiddleware.single('file'), upload);

router.get('/download/:filename', auth, download);

export { router };
