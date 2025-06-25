import { prisma } from '../config/db.js';

// Crear nueva cita
export async function create(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      actividadId,
      lugarId,
      fecha,
      horaInicio,
      horaFin,
      estado,
      motivoCancelacion
    } = req.body;

    // Validaciones básicas
    if (!actividadId) return res.status(400).json({ error: 'actividadId es obligatorio' });
    if (!lugarId) return res.status(400).json({ error: 'lugarId es obligatorio' });
    if (!fecha) return res.status(400).json({ error: 'fecha es obligatorio' });
    if (!horaInicio) return res.status(400).json({ error: 'horaInicio es obligatorio' });

    const data = {
      actividadId,
      lugarId,
      fecha: new Date(fecha), // Asegura que sea Date
      horaInicio,
      horaFin,
      estado: estado || 'Programada',
      motivoCancelacion,
      creadoPorId: req.user.userId
    };

    const cita = await prisma.cita.create({ data });

    res.status(201).json(cita);
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
}

// Obtener todas las citas
export async function getAll(req, res) {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        actividad: true,
        lugar: true,
        creadoPor: {
          select: { id: true, nombre: true, email: true }
        }
      }
    });
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
}

// Obtener cita por ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const cita = await prisma.cita.findUnique({
      where: { id: Number(id) },
      include: {
        actividad: true,
        lugar: true,
        creadoPor: {
          select: { id: true, nombre: true, email: true }
        }
      }
    });

    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    res.json(cita);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    res.status(500).json({ error: 'Error al obtener cita' });
  }
}

// Actualizar cita
export async function update(req, res) {
  try {
    const { id } = req.params;
    const {
      actividadId,
      lugarId,
      fecha,
      horaInicio,
      horaFin,
      estado,
      motivoCancelacion
    } = req.body;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const data = {};
    if (actividadId !== undefined) data.actividadId = actividadId;
    if (lugarId !== undefined) data.lugarId = lugarId;
    if (fecha !== undefined) data.fecha = new Date(fecha);
    if (horaInicio !== undefined) data.horaInicio = horaInicio;
    if (horaFin !== undefined) data.horaFin = horaFin;
    if (estado !== undefined) data.estado = estado;
    if (motivoCancelacion !== undefined) data.motivoCancelacion = motivoCancelacion;

    const cita = await prisma.cita.update({
      where: { id: Number(id) },
      data
    });

    res.json(cita);
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
}

// Eliminar cita
export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.cita.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
}
