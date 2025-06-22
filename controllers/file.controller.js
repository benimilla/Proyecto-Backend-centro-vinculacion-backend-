// controllers/file.controller.js
import { prisma } from '../config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obtener __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function upload(req, res) {
  try {
    const { actividadId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }
    const filePath = req.file.path;
    const fileUrl = `/uploads/${req.file.filename}`;

    const archivo = await prisma.archivo.create({
      data: {
        url: fileUrl,
        descripcion: req.body.descripcion || '',
        actividad: { connect: { id: Number(actividadId) } },
      },
    });
    res.status(201).json(archivo);
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo', detalle: error.message });
  }
}

export function download(req, res) {
  try {
    const { filename } = req.params;
    const fullPath = path.join(__dirname, '../uploads', filename);
    res.download(fullPath);
  } catch (error) {
    res.status(500).json({ error: 'Error al descargar archivo', detalle: error.message });
  }
}
