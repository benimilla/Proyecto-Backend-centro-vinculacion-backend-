import { prisma } from '../config/db.js';

// Verificar conflicto de horario para cita puntual
async function verificarConflictoCita(lugarId, fecha, horaInicio, horaFin, citaId = null) {
  const conflicto = await prisma.cita.findFirst({
    where: {
      lugarId,
      fecha,
      OR: [
        {
          horaInicio: {
            lt: horaFin,
          },
          horaFin: {
            gt: horaInicio,
          },
        },
      ],
      estado: { not: 'Cancelada' },
      NOT: citaId ? { id: citaId } : undefined,
    },
  });

  if (conflicto) {
    return `El lugar ${conflicto.lugarId} ya está ocupado el ${fecha.toISOString().split('T')[0]} de ${horaInicio} a ${horaFin}`;
  }
  return null;
}

// Crear cita puntual independiente
export async function create(req, res) {
  try {
    const {
      actividadId,
      lugarId,
      fecha,
      horaInicio,
      horaFin,
    } = req.body;

    if (!actividadId || !lugarId || !fecha || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const fechaCita = new Date(fecha);
    if (isNaN(fechaCita)) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    if (horaInicio >= horaFin) {
      return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar conflicto
    const conflicto = await verificarConflictoCita(lugarId, fechaCita, horaInicio, horaFin);
    if (conflicto) {
      return res.status(409).json({ error: conflicto });
    }

    const cita = await prisma.cita.create({
      data: {
        actividadId,
        lugarId,
        fecha: fechaCita,
        horaInicio,
        horaFin,
        estado: 'Programada',
        creadoPorId: req.user.userId,
      },
    });

    return res.status(201).json({ message: 'Cita creada exitosamente', cita });
  } catch (error) {
    console.error('Error al crear cita:', error);
    return res.status(500).json({ error: 'Error al crear cita', detalle: error.message });
  }
}

// Obtener todas las citas
export async function getAll(req, res) {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        actividad: true,
        lugar: true,
        creadoPor: true,
      },
      orderBy: { fecha: 'asc' },
    });
    return res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return res.status(500).json({ error: 'Error al obtener citas' });
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
        creadoPor: true,
      },
    });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    return res.json(cita);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    return res.status(500).json({ error: 'Error al obtener cita' });
  }
}

// Actualizar cita
export async function update(req, res) {
  try {
    const { id } = req.params;
    const {
      lugarId,
      fecha,
      horaInicio,
      horaFin,
      estado,
      motivoCancelacion,
    } = req.body;

    const citaExistente = await prisma.cita.findUnique({ where: { id: Number(id) } });
    if (!citaExistente) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (citaExistente.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta cita' });
    }

    // Validaciones
    if (fecha) {
      const fechaCita = new Date(fecha);
      if (isNaN(fechaCita)) return res.status(400).json({ error: 'Fecha inválida' });
    }

    if (horaInicio && horaFin && horaInicio >= horaFin) {
      return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
    }

    // Verificar conflicto solo si cambian lugar o fecha o horas
    if (
      (lugarId && lugarId !== citaExistente.lugarId) ||
      (fecha && new Date(fecha).getTime() !== citaExistente.fecha.getTime()) ||
      (horaInicio && horaInicio !== citaExistente.horaInicio) ||
      (horaFin && horaFin !== citaExistente.horaFin)
    ) {
      const conflicto = await verificarConflictoCita(
        lugarId || citaExistente.lugarId,
        fecha ? new Date(fecha) : citaExistente.fecha,
        horaInicio || citaExistente.horaInicio,
        horaFin || citaExistente.horaFin,
        citaExistente.id
      );
      if (conflicto) {
        return res.status(409).json({ error: conflicto });
      }
    }

    const dataToUpdate = {};
    if (lugarId !== undefined) dataToUpdate.lugarId = lugarId;
    if (fecha !== undefined) dataToUpdate.fecha = new Date(fecha);
    if (horaInicio !== undefined) dataToUpdate.horaInicio = horaInicio;
    if (horaFin !== undefined) dataToUpdate.horaFin = horaFin;
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (motivoCancelacion !== undefined) dataToUpdate.motivoCancelacion = motivoCancelacion;

    const citaActualizada = await prisma.cita.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return res.json({ message: 'Cita actualizada exitosamente', cita: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la cita', detalle: error.message });
  }
}

// Cancelar cita (motivo obligatorio)
export async function cancel(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Debe proporcionar un motivo para la cancelación' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const citaId = Number(id);
    if (isNaN(citaId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const cita = await prisma.cita.findUnique({ where: { id: citaId } });
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para cancelar esta cita' });
    }

    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: 'Cancelada', motivoCancelacion: motivo },
    });

    return res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return res.status(500).json({ error: 'Error al cancelar cita', detalle: error.message });
  }
}

// Eliminar cita
export async function remove(req, res) {
  try {
    const { id } = req.params;

    const cita = await prisma.cita.findUnique({ where: { id: Number(id) } });
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (cita.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para eliminar esta cita' });
    }

    await prisma.cita.delete({ where: { id: Number(id) } });
    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return res.status(500).json({ error: 'Error al eliminar cita' });
  }
}
