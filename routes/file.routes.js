// routes/file.routes.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const auth = require('../middlewares/auth.middleware');
const multer = require('multer');

// Configuración básica de multer para subir archivos
const upload = multer({ dest: 'uploads/' });

// Ruta para subir un archivo ligado a una actividad (actividadId en params)
router.post('/:actividadId', auth, upload.single('file'), fileController.upload);

// Ruta para descargar un archivo por nombre
router.get('/download/:filename', auth, fileController.download);

module.exports = router;
