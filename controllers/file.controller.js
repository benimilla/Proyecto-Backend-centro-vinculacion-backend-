import { prisma } from '../config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Subida múltiple con req.user.id
export async function uploadMultiple(req, res) {
  try {
    const { actividadId } = req.params;
    const { tipoAdjunto, descripcion } = req.body;
    const usuarioId = req.user.id; // Cambiado aquí para usar user.id
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron archivos' });
    }

    const archivos = [];

    for (const file of files) {
      const archivo = await prisma.archivo.create({
        data: {
          nombre: file.originalname,
          ruta: `/uploads/${file.filename}`,
          tipo: file.mimetype,
          tamano: file.size,
          actividadId: Number(actividadId),
          tipoAdjunto: tipoAdjunto || 'Otro',
          descripcion: descripcion || '',
          cargadoPorId: usuarioId,
        },
      });
      archivos.push(archivo);
    }

    res.status(201).json({
      mensaje: 'Archivos subidos correctamente',
      archivos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir archivos', detalle: error.message });
  }
}

// ✅ Descarga con nombre original
export async function download(req, res) {
  try {
    const { filename } = req.params;

    const archivo = await prisma.archivo.findFirst({
      where: {
        ruta: {
          endsWith: filename,
        },
      },
    });

    if (!archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado en BD' });
    }

    const fullPath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Archivo físico no encontrado' });
    }

    res.download(fullPath, archivo.nombre); // descarga con nombre original
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al descargar archivo', detalle: error.message });
  }
}

// ✅ Obtener todos los archivos de una actividad
export async function getArchivosPorActividad(req, res) {
  try {
    const { actividadId } = req.params;

    const archivos = await prisma.archivo.findMany({
      where: {
        actividadId: Number(actividadId),
      },
      orderBy: {
        fechaCarga: 'desc',
      },
    });

    res.json(archivos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener archivos', detalle: error.message });
  }
}
