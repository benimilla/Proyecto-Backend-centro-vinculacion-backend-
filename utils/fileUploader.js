// utils/fileUploader.js
import multer from 'multer';
import path from 'path';

// Configuración básica de almacenamiento con multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');  // carpeta donde se guardan los archivos
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

export default upload;
