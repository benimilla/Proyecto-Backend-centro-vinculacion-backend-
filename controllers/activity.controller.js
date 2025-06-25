import { prisma } from '../config/db.js';

export function generarFechasCitas(fechaInicio, fechaFin, periodicidad) {
  const fechas = [];
  let fechaActual = new Date(fechaInicio);

  while (fechaActual <= fechaFin) {
    fechas.push(new Date(fechaActual));

    switch (periodicidad) {
      case 'diaria':
        fechaActual.setDate(fechaActual.getDate() + 1);
        break;
      case 'semanal':
        fechaActual.setDate(fechaActual.getDate() + 7);
        break;
      case 'mensual':
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        break;
      default:
        throw new Error('Periodicidad no soportada');
    }
  }

  return fechas;
}

// Función para validar conflictos de horario
async function validarConflictosHorario(lugarId, fechas, horaInicio, horaFin, actividadIdExcluir = null) {
  // Buscar citas que se solapen con el horario dado en esas fechas y lugar
  for (const fecha of fechas) {
    const citasConflictivas = await prisma.cita.findMany({
      where: {
        lugarId,
        fecha,
        AND: [
          { horaInicio: { lte: horaFin } },
          { horaFin: { gte: horaInicio } },
        ],
        // Excluir citas de la actividad actual cuando se edita
        ...(actividadIdExcluir ? { actividadId: { not: actividadIdExcluir } } : {}),
      },
    });

    if (citasConflictivas.length > 0) {
      const lugar = await prisma.lugar.findUnique({ where: { id: lugarId } });
      throw {
        status: 409,
        message: `El lugar ${lugar?.nombre || lugarId} ya está ocupado el ${fecha.toLocaleDateString()} de ${horaInicio} a ${horaFin}`,
        sugerencias: [], // Aquí podrías agregar sugerencias reales si quieres
      };
    }
  }
}

// Obtener todas las actividades
export async function getAll(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const actividades = await prisma.actividad.findMany({
      skip,
      take: pageSize,
      orderBy: { fechaInicio: 'desc' },
      include: { citas: true, archivos: true },
    });

    const totalCount = await prisma.actividad.count();

    res.json({ page, pageSize, totalCount, actividades });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
}

// Crear nueva actividad (con citas si es periódica)
export async function create(req, res) {
  try {
    const {
      nombre,
      tipoId,
      periodicidadId,
      fechaInicio,
      fechaFin,
      lugarId,
      horaInicio,
      horaFin,
    } = req.body;

    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipoId) errores.tipoId = 'El campo tipoId es obligatorio';
    if (!periodicidadId) errores.periodicidadId = 'El campo periodicidadId es obligatorio';

    const isPeriodica = fechaInicio && fechaFin;
    if (isPeriodica) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (isNaN(inicio)) errores.fechaInicio = 'Fecha de inicio inválida';
      if (isNaN(fin)) errores.fechaFin = 'Fecha de fin inválida';
      if (fin < inicio) errores.fechaFin = 'La fecha de fin no puede ser menor que la fecha de inicio';

      if (!horaInicio) errores.horaInicio = 'Hora de inicio es obligatoria para actividad periódica';
      if (!horaFin) errores.horaFin = 'Hora de fin es obligatoria para actividad periódica';
      if (!lugarId) errores.lugarId = 'Lugar es obligatorio para actividad periódica';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Validar conflictos de horario antes de crear la actividad y citas
    if (isPeriodica) {
      const mapPeriodicidad = { 1: 'diaria', 2: 'semanal', 3: 'mensual' };
      const periodicidad = mapPeriodicidad[periodicidadId];
      if (!periodicidad) {
        return res.status(400).json({ error: 'Periodicidad no reconocida' });
      }

      const fechas = generarFechasCitas(new Date(fechaInicio), new Date(fechaFin), periodicidad);
      try {
        await validarConflictosHorario(lugarId, fechas, horaInicio, horaFin);
      } catch (conflicto) {
        return res.status(conflicto.status || 409).json({
          error: conflicto.message,
          sugerencias: conflicto.sugerencias,
        });
      }
    }

    const actividad = await prisma.actividad.create({
      data: {
        nombre,
        tipoActividadId: tipoId,
        periodicidadId,
        fechaInicio: isPeriodica ? new Date(fechaInicio) : null,
        fechaFin: isPeriodica ? new Date(fechaFin) : null,
        creadoPorId: req.user.userId,
      },
    });

    if (isPeriodica) {
      const mapPeriodicidad = { 1: 'diaria', 2: 'semanal', 3: 'mensual' };
      const periodicidad = mapPeriodicidad[periodicidadId];
      const fechas = generarFechasCitas(new Date(fechaInicio), new Date(fechaFin), periodicidad);

      const citasData = fechas.map((fecha) => ({
        actividadId: actividad.id,
        lugarId,
        fecha,
        horaInicio,
        horaFin,
        estado: 'Programada',
        creadoPorId: req.user.userId,
      }));

      await prisma.cita.createMany({ data: citasData });
    }

    res.status(201).json({ message: 'Actividad creada exitosamente', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: 'Error al crear actividad' });
  }
}

// Obtener actividad por ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) },
      include: { citas: true, archivos: true },
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

// Actualizar actividad (con validación conflictos de horario)
export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const {
      nombre,
      tipoId,
      periodicidadId,
      fechaInicio,
      fechaFin,
      lugarId,
      horaInicio,
      horaFin,
    } = req.body;

    // Validaciones básicas de campos obligatorios en update si se envían
    if (nombre !== undefined && nombre === '') 
      return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
    if (tipoId !== undefined && !tipoId) 
      return res.status(400).json({ error: 'El campo tipoId es obligatorio si se envía' });
    if (periodicidadId !== undefined && !periodicidadId) 
      return res.status(400).json({ error: 'El campo periodicidadId es obligatorio si se envía' });

    const isPeriodica = fechaInicio && fechaFin;
    if (isPeriodica) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (isNaN(inicio)) return res.status(400).json({ error: 'Fecha de inicio inválida' });
      if (isNaN(fin)) return res.status(400).json({ error: 'Fecha de fin inválida' });
      if (fin < inicio) return res.status(400).json({ error: 'La fecha de fin no puede ser menor que la fecha de inicio' });

      if (!horaInicio) return res.status(400).json({ error: 'Hora de inicio es obligatoria para actividad periódica' });
      if (!horaFin) return res.status(400).json({ error: 'Hora de fin es obligatoria para actividad periódica' });
      if (!lugarId) return res.status(400).json({ error: 'Lugar es obligatorio para actividad periódica' });
    }

    // Validar conflictos de horario antes de actualizar
    if (isPeriodica) {
      const mapPeriodicidad = { 1: 'diaria', 2: 'semanal', 3: 'mensual' };
      const periodicidad = mapPeriodicidad[periodicidadId];
      if (!periodicidad) {
        return res.status(400).json({ error: 'Periodicidad no reconocida' });
      }

      const fechas = generarFechasCitas(new Date(fechaInicio), new Date(fechaFin), periodicidad);
      try {
        await validarConflictosHorario(lugarId, fechas, horaInicio, horaFin, Number(id)); // Excluir citas propias
      } catch (conflicto) {
        return res.status(conflicto.status || 409).json({
          error: conflicto.message,
          sugerencias: conflicto.sugerencias,
        });
      }
    }

    const actividad = await prisma.actividad.update({
      where: { id: Number(id) },
      data: req.body,
    });

    if (!actividad) {
      return res.status(404).json({ error: 'No se pudo actualizar la actividad: no encontrada' });
    }

    res.json({
      message: 'Actividad actualizada exitosamente',
      actividad,
    });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'No se pudo actualizar la actividad' });
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
