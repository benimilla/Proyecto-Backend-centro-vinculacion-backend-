import { prisma } from '../config/db.js';

// Crear nueva actividad
export async function create(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      nombre,
      tipoId,
      periodicidadId
      // otros campos que consideres obligatorios
    } = req.body;

    // Validación básica
    if (!nombre) return res.status(400).json({ error: 'El campo nombre es obligatorio' });
    if (!tipoId) return res.status(400).json({ error: 'El campo tipoId es obligatorio' });
    if (!periodicidadId) return res.status(400).json({ error: 'El campo periodicidadId es obligatorio' });
    // Puedes validar más campos según tu modelo

    const data = {
      ...req.body,
      creadoPor: req.user.userId
    };

    const actividad = await prisma.actividad.create({ data });

    res.status(201).json(actividad);
  } catch (error) {
    console.error('Error al crear actividad:', error);

    // Manejar errores de Prisma para campos faltantes o inválidos
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Datos duplicados o conflicto' });
    }
    // Podrías agregar más códigos de error específicos

    res.status(500).json({ error: 'Error al crear actividad' });
  }
}

// Obtener todas las actividades
export async function getAll(req, res) {
  try {
    const actividades = await prisma.actividad.findMany({
      include: { citas: true, archivos: true }
    });
    res.json(actividades);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
}

// Obtener actividad por ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) },
      include: { citas: true, archivos: true }
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(actividad);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
}

// Actualizar actividad
export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { nombre, tipoId, periodicidadId } = req.body;

    // Si quieres campos obligatorios en update:
    if (nombre === '') return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
    if (tipoId !== undefined && !tipoId) return res.status(400).json({ error: 'El campo tipoId es obligatorio si se envía' });
    if (periodicidadId !== undefined && !periodicidadId) return res.status(400).json({ error: 'El campo periodicidadId es obligatorio si se envía' });

    const actividad = await prisma.actividad.update({
      where: { id: Number(id) },
      data: req.body
    });

    res.json(actividad);
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
}

// Eliminar actividad
export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.actividad.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
  }
}
