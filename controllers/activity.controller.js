import { prisma } from '../config/db.js';

// Crear nueva actividad
export async function create(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const data = {
      ...req.body,
      creadoPor: req.user.userId // campo correcto según tu modelo
    };

    const actividad = await prisma.actividad.create({ data });

    res.status(201).json(actividad);
  } catch (error) {
    console.error('Error al crear actividad:', error);
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
