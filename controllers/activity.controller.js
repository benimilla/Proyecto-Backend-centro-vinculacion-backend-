import { prisma } from '../config/db.js';

// Función auxiliar para verificar conflictos de horario en citas
async function verificarConflicto(lugarId, fecha, horaInicio, horaFin) {
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
    },
  });

  if (conflicto) {
    return `El lugar ya está ocupado el ${fecha.toISOString().split('T')[0]} de ${horaInicio} a ${horaFin}`;
  }
  return null;
}

// Función auxiliar para generar citas periódicas según días entre fechas
async function generarCitasPeriodicas(
  actividadId,
  fechaInicio,
  fechaFin,
  lugarId,
  horaInicio,
  horaFin,
  creadoPorId
) {
  const citas = [];
  let currentDate = new Date(fechaInicio);
  while (currentDate <= fechaFin) {
    // Verificar conflicto
    const conflicto = await verificarConflicto(lugarId, currentDate, horaInicio, horaFin);
    if (conflicto) {
      return { error: conflicto };
    }

    citas.push({
      actividadId,
      lugarId,
      fecha: new Date(currentDate),
      horaInicio,
      horaFin,
      estado: 'Programada',
      creadoPorId,
    });

    currentDate.setDate(currentDate.getDate() + 7); // Cada semana, cambia según periodicidad real
  }

  await prisma.cita.createMany({ data: citas });
  return { success: true };
}

// Crear actividad (y generar citas)
export async function create(req, res) {
  try {
    const {
      nombre,
      tipoActividadId,
      periodicidad,
      fechaInicio,
      fechaFin,
      socioComunitarioId,
      proyectoId,
      cupo,
      lugarId,
      horaInicio,
      horaFin,
    } = req.body;

    // Validaciones básicas
    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipoActividadId) errores.tipoActividadId = 'El campo tipoActividadId es obligatorio';
    if (!periodicidad) errores.periodicidad = 'El campo periodicidad es obligatorio';
    if (!fechaInicio) errores.fechaInicio = 'El campo fechaInicio es obligatorio';
    if (!socioComunitarioId) errores.socioComunitarioId = 'El campo socioComunitarioId es obligatorio';
    if (!lugarId) errores.lugarId = 'El campo lugarId es obligatorio';
    if (!horaInicio) errores.horaInicio = 'El campo horaInicio es obligatorio';
    if (!horaFin) errores.horaFin = 'El campo horaFin es obligatorio';

    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : null;

    if (isNaN(inicio)) errores.fechaInicio = 'Fecha de inicio inválida';
    if (fechaFin && isNaN(fin)) errores.fechaFin = 'Fecha de fin inválida';
    if (fin && fin < inicio) errores.fechaFin = 'La fecha de fin no puede ser menor que la de inicio';
    if (horaInicio >= horaFin) errores.horas = 'La hora de inicio debe ser menor que la de fin';

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Crear la actividad
    const actividad = await prisma.actividad.create({
      data: {
        nombre,
        tipoActividadId,
        periodicidad,
        fechaInicio: inicio,
        fechaFin: fin,
        socioComunitarioId,
        proyectoId: proyectoId || null,
        cupo: cupo ?? undefined,
        creadoPorId: req.user.userId,
        estado: 'Programada',
      },
    });

    // Crear citas según periodicidad
    if (periodicidad === 'Puntual') {
      // Verificar conflicto
      const conflicto = await verificarConflicto(lugarId, inicio, horaInicio, horaFin);
      if (conflicto) {
        return res.status(409).json({ error: conflicto });
      }

      await prisma.cita.create({
        data: {
          actividadId: actividad.id,
          lugarId,
          fecha: inicio,
          horaInicio,
          horaFin,
          estado: 'Programada',
          creadoPorId: req.user.userId,
        },
      });
    } else if (periodicidad === 'Periódica') {
      if (!fin) {
        return res.status(400).json({ error: 'Debe proporcionar fechaFin para actividades periódicas' });
      }

      const result = await generarCitasPeriodicas(
        actividad.id,
        inicio,
        fin,
        lugarId,
        horaInicio,
        horaFin,
        req.user.userId
      );

      if (result.error) return res.status(409).json({ error: result.error });
    }

    return res.status(201).json({ message: 'Actividad creada exitosamente', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ error: 'Error al crear actividad', detalle: error.message });
  }
}

// Actualizar actividad
export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const actividad = await prisma.actividad.findUnique({ where: { id: Number(id) } });
    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (actividad.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta actividad' });
    }

    if (actividad.estado === 'Completada') {
      return res.status(400).json({ error: 'No se puede modificar una actividad completada' });
    }

    const {
      nombre,
      tipoActividadId,
      periodicidad,
      fechaInicio,
      fechaFin,
      socioComunitarioId,
      proyectoId,
      cupo,
    } = req.body;

    const dataToUpdate = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (tipoActividadId !== undefined) dataToUpdate.tipoActividadId = tipoActividadId;
    if (periodicidad !== undefined) dataToUpdate.periodicidad = periodicidad;
    if (fechaInicio !== undefined) {
      const inicio = new Date(fechaInicio);
      if (isNaN(inicio)) return res.status(400).json({ error: 'Fecha de inicio inválida' });
      dataToUpdate.fechaInicio = inicio;
    }
    if (fechaFin !== undefined) {
      const fin = new Date(fechaFin);
      if (isNaN(fin)) return res.status(400).json({ error: 'Fecha de fin inválida' });
      dataToUpdate.fechaFin = fin;
    }
    if (socioComunitarioId !== undefined) dataToUpdate.socioComunitarioId = socioComunitarioId;
    if (proyectoId !== undefined) dataToUpdate.proyectoId = proyectoId || null;
    if (cupo !== undefined) dataToUpdate.cupo = cupo;

    const actividadActualizada = await prisma.actividad.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return res.json({ message: 'Actividad actualizada exitosamente', actividad: actividadActualizada });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la actividad', detalle: error.message });
  }
}

// Cancelar actividad + cancelar todas sus citas
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

    const actividadId = Number(id);
    if (isNaN(actividadId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    await prisma.actividad.update({
      where: { id: actividadId },
      data: { estado: 'Cancelada' },
    });

    await prisma.cita.updateMany({
      where: { actividadId: actividadId },
      data: {
        estado: 'Cancelada',
        motivoCancelacion: motivo,
      },
    });

    return res.json({ message: 'Actividad cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar actividad:', error);
    return res.status(500).json({ error: 'Error al cancelar actividad', detalle: error.message });
  }
}

// Obtener todas las actividades
export async function getAll(req, res) {
  try {
    const actividades = await prisma.actividad.findMany({
      orderBy: { fechaInicio: 'desc' },
      select: {
        id: true,
        nombre: true,
        tipoActividadId: true,
        periodicidad: true,
        fechaInicio: true,
        fechaFin: true,
        cupo: true,
        socioComunitarioId: true,
        proyectoId: true,
        estado: true,
        fechaCreacion: true,
        creadoPorId: true,
      },
    });

    return res.json(actividades);
  } catch (error) {
    console.error('Error al obtener las actividades:', error);
    return res.status(500).json({ error: 'Error al obtener las actividades' });
  }
}

// Obtener actividad por ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) },
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    return res.json(actividad);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    return res.status(500).json({ error: 'Error al obtener actividad' });
  }
}

// Eliminar actividad
export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.actividad.delete({ where: { id: Number(id) } });
    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    return res.status(500).json({ error: 'Error al eliminar actividad' });
  }
}
