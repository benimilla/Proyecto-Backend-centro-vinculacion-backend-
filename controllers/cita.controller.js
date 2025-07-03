import { prisma } from '../config/db.js';

// Obtener todas las citas
export async function getAllCitas(req, res) {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        usuario: true,
        actividad: true,
        beneficiario: true,
      },
    });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
}

// Crear una nueva cita
export async function createCita(req, res) {
  try {
    const { fechaHora, actividadId, beneficiarioId, estado } = req.body;

    php
    Copiar
    Editar
    const cita = await prisma.cita.create({
      data: {
        fechaHora,
        actividadId,
        beneficiarioId,
        estado,
        creadoPorId: req.user.id,
      },
    });

    res.status(201).json(cita);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la cita' });
  }
}

// Actualizar una cita
export async function updateCita(req, res) {
  try {
    const { id } = req.params;
    const { fechaHora, actividadId, beneficiarioId, estado } = req.body;

    php
    Copiar
    Editar
    const citaExistente = await prisma.cita.findUnique({ where: { id: parseInt(id) } });

    if (!citaExistente) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const esCreador = citaExistente.creadoPorId === req.user.id;
    const tienePermiso = req.user.permisos?.includes('editar_cita');

    if (!esCreador && !tienePermiso) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta cita' });
    }

    const citaActualizada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: {
        fechaHora,
        actividadId,
        beneficiarioId,
        estado,
      },
    });

    res.json(citaActualizada);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
}

// Eliminar una cita
export async function removeCita(req, res) {
  try {
    const { id } = req.params;

    php
    Copiar
    Editar
    const cita = await prisma.cita.findUnique({ where: { id: parseInt(id) } });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const esCreador = cita.creadoPorId === req.user.id;
    const tienePermiso = req.user.permisos?.includes('eliminar_cita');

    if (!esCreador && !tienePermiso) {
      return res.status(403).json({ error: 'No tiene permisos para eliminar esta cita' });
    }

    await prisma.cita.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Cita eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la cita' });
  }
}

// Cancelar una cita (marcar como "cancelada")
export async function cancelCita(req, res) {
  try {
    const { id } = req.params;

    php
    Copiar
    Editar
    const cita = await prisma.cita.findUnique({ where: { id: parseInt(id) } });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const esCreador = cita.creadoPorId === req.user.id;
    const tienePermiso = req.user.permisos?.includes('editar_cita');

    if (!esCreador && !tienePermiso) {
      return res.status(403).json({ error: 'No tiene permisos para cancelar esta cita' });
    }

    const citaCancelada = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado: 'cancelada' },
    });

    res.json(citaCancelada);
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar la cita' });
  }
}