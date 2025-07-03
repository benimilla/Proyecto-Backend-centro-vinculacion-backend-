import { prisma } from '../config/db.js';

// Función auxiliar para verificar conflictos de horario en citas
async function verificarConflictoCita(lugarId, fecha, horaInicio, horaFin, citaId = null) {
  const searchDate = new Date(fecha);
  searchDate.setHours(0, 0, 0, 0);

  const conflicto = await prisma.cita.findFirst({
    where: {
      lugarId,
      fecha: searchDate,
      OR: [
        {
          horaInicio: { lt: horaFin },
          horaFin: { gt: horaInicio },
        },
      ],
      estado: { not: 'Cancelada' },
      NOT: citaId ? { id: citaId } : undefined,
    },
  });

  if (conflicto) {
    return `El lugar ya está ocupado el ${fecha.toISOString().split('T')[0]} de ${conflicto.horaInicio} a ${conflicto.horaFin}`;
  }
  return null;
}

// Crear cita (puntual o periódica)
export async function createCita(req, res) {
  try {
    const {
      actividadId,
      lugarId,
      fecha,
      horaInicio,
      horaFin,
      periodicidadTipo,
      fechaInicioPeriodica,
      fechaFinPeriodica,
    } = req.body;

    if (!actividadId || !lugarId || !fecha || !horaInicio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: actividadId, lugarId, fecha, horaInicio' });
    }

    const fechaCita = new Date(fecha);
    if (isNaN(fechaCita.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida para la cita' });
    }

    if (horaFin && horaInicio >= horaFin) {
      return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const actividadExistente = await prisma.actividad.findUnique({
      where: { id: actividadId }
    });

    if (!actividadExistente) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (periodicidadTipo === 'Puntual') {
      const conflicto = await verificarConflictoCita(lugarId, fechaCita, horaInicio, horaFin);
      if (conflicto) return res.status(409).json({ error: conflicto });

      const cita = await prisma.cita.create({
        data: {
          actividadId: Number(actividadId),
          lugarId: Number(lugarId),
          fecha: fechaCita,
          horaInicio,
          horaFin: horaFin || null,
          estado: 'Programada',
          creadoPorId: req.user.id,
        },
      });

      return res.status(201).json({ message: 'Cita puntual creada exitosamente', cita });

    } else if (periodicidadTipo === 'Periódica') {
      if (!fechaInicioPeriodica || !fechaFinPeriodica) {
        return res.status(400).json({ error: 'Debe proporcionar fechaInicioPeriodica y fechaFinPeriodica' });
      }

      const inicioPeriodica = new Date(fechaInicioPeriodica);
      const finPeriodica = new Date(fechaFinPeriodica);

      if (isNaN(inicioPeriodica.getTime()) || isNaN(finPeriodica.getTime())) {
        return res.status(400).json({ error: 'Fechas de rango inválidas' });
      }
      if (inicioPeriodica > finPeriodica) {
        return res.status(400).json({ error: 'La fecha de inicio no puede ser mayor que la de fin' });
      }

      const citasAcrear = [];
      let currentDate = new Date(inicioPeriodica);

      while (currentDate <= finPeriodica) {
        const conflicto = await verificarConflictoCita(lugarId, currentDate, horaInicio, horaFin);
        if (conflicto) {
          return res.status(409).json({ error: conflicto + ` (Fecha: ${currentDate.toISOString().split('T')[0]})` });
        }

        citasAcrear.push({
          actividadId: Number(actividadId),
          lugarId: Number(lugarId),
          fecha: new Date(currentDate),
          horaInicio,
          horaFin: horaFin || null,
          estado: 'Programada',
          creadoPorId: req.user.id,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (citasAcrear.length > 0) {
        await prisma.cita.createMany({ data: citasAcrear });
      }

      return res.status(201).json({ message: `Se crearon ${citasAcrear.length} citas periódicas exitosamente` });

    } else {
      return res.status(400).json({ error: 'Tipo de periodicidad no reconocido' });
    }

  } catch (error) {
    console.error('Error al crear cita:', error);
    return res.status(500).json({ error: 'Error al crear cita', detalle: error.message });
  }
}

// Obtener todas las citas
export async function getAllCitas(req, res) {
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
export async function getByIdCita(req, res) {
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

    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });

    return res.json(cita);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    return res.status(500).json({ error: 'Error al obtener cita' });
  }
}

// Actualizar cita
export async function updateCita(req, res) {
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

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (citaExistente.creadoPorId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta cita' });
    }

    const fechaCita = fecha ? new Date(fecha) : citaExistente.fecha;
    if (fecha && isNaN(fechaCita.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    const actualHoraInicio = horaInicio || citaExistente.horaInicio;
    const actualHoraFin = horaFin || citaExistente.horaFin;

    if (actualHoraInicio && actualHoraFin && actualHoraInicio >= actualHoraFin) {
      return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
    }

    const updatedLugarId = lugarId !== undefined ? lugarId : citaExistente.lugarId;

    if (
      (lugarId !== undefined && lugarId !== citaExistente.lugarId) ||
      (fecha !== undefined && fechaCita.getTime() !== citaExistente.fecha.getTime()) ||
      (horaInicio !== undefined && horaInicio !== citaExistente.horaInicio) ||
      (horaFin !== undefined && horaFin !== citaExistente.horaFin)
    ) {
      const conflicto = await verificarConflictoCita(
        updatedLugarId,
        fechaCita,
        actualHoraInicio,
        actualHoraFin,
        citaExistente.id
      );
      if (conflicto) {
        return res.status(409).json({ error: conflicto });
      }
    }

    const dataToUpdate = {};
    if (lugarId !== undefined) dataToUpdate.lugarId = Number(lugarId);
    if (fecha !== undefined) dataToUpdate.fecha = fechaCita;
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

// Cancelar cita
export async function cancelCita(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Debe proporcionar un motivo para la cancelación' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const cita = await prisma.cita.findUnique({ where: { id: Number(id) } });
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.creadoPorId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para cancelar esta cita' });
    }

    await prisma.cita.update({
      where: { id: Number(id) },
      data: { estado: 'Cancelada', motivoCancelacion: motivo },
    });

    return res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return res.status(500).json({ error: 'Error al cancelar cita', detalle: error.message });
  }
}

// Eliminar cita
export async function removeCita(req, res) {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const cita = await prisma.cita.findUnique({ where: { id: Number(id) } });
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.creadoPorId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para eliminar esta cita' });
    }

    await prisma.cita.delete({ where: { id: Number(id) } });
    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return res.status(500).json({ error: 'Error al eliminar cita' });
  }
}
