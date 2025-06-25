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

async function validarConflictosHorario(lugarId, fechas, horaInicio, horaFin, actividadIdExcluir = null) {
  for (const fecha of fechas) {
    const citasConflictivas = await prisma.cita.findMany({
      where: {
        lugarId,
        fecha,
        AND: [
          { horaInicio: { lte: horaFin } },
          { horaFin: { gte: horaInicio } },
        ],
        ...(actividadIdExcluir ? { actividadId: { not: actividadIdExcluir } } : {}),
      },
    });

    if (citasConflictivas.length > 0) {
      const lugar = await prisma.lugar.findUnique({ where: { id: lugarId } });
      throw {
        status: 409,
        message: `El lugar ${lugar?.nombre || lugarId} ya está ocupado el ${fecha.toLocaleDateString()} de ${horaInicio} a ${horaFin}`,
        sugerencias: [],
      };
    }
  }
}

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

export async function create(req, res) {
  try {
    // Recibo datos en snake_case y convierto a camelCase
    const {
      nombre,
      tipo_actividad_id,
      periodicidad,
      fecha_inicio,
      fecha_fin,
      lugar_id,
      hora_inicio,
      hora_fin,
      socio_comunitario_id,
      proyecto_id,
      cupo,
    } = req.body;

    const tipoId = tipo_actividad_id;
    const fechaInicio = fecha_inicio;
    const fechaFin = fecha_fin;
    const lugarId = lugar_id;
    const horaInicio = hora_inicio;
    const horaFin = hora_fin;
    const socioComunitarioId = socio_comunitario_id;
    const proyectoId = proyecto_id && proyecto_id !== '' ? proyecto_id : null;

    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipoId) errores.tipoId = 'El campo tipoId es obligatorio';
    if (!periodicidad) errores.periodicidad = 'El campo periodicidad es obligatorio';
    if (!socioComunitarioId) errores.socioComunitarioId = 'El campo socioComunitarioId es obligatorio';

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

    if (isPeriodica) {
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
        tipoActividad: { connect: { id: tipoId } },
        periodicidad,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        socioComunitario: { connect: { id: socioComunitarioId } },
        proyecto: proyectoId ? { connect: { id: proyectoId } } : undefined,
        cupo: cupo ?? undefined,
        creadoPor: { connect: { id: req.user.userId } },
      },
    });

    if (isPeriodica) {
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
    res.status(500).json({ error: 'Error al crear actividad', detalle: error.message });
  }
}

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

export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Recibo datos en snake_case y convierto a camelCase
    const {
      nombre,
      tipo_actividad_id,
      periodicidad,
      fecha_inicio,
      fecha_fin,
      lugar_id,
      hora_inicio,
      hora_fin,
      socio_comunitario_id,
      proyecto_id,
      cupo,
    } = req.body;

    const tipoId = tipo_actividad_id;
    const fechaInicio = fecha_inicio;
    const fechaFin = fecha_fin;
    const lugarId = lugar_id;
    const horaInicio = hora_inicio;
    const horaFin = hora_fin;
    const socioComunitarioId = socio_comunitario_id;
    const proyectoId = proyecto_id && proyecto_id !== '' ? proyecto_id : null;

    if (nombre !== undefined && nombre === '') {
      return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
    }
    if (tipoId !== undefined && !tipoId) {
      return res.status(400).json({ error: 'El campo tipoId es obligatorio si se envía' });
    }
    if (periodicidad !== undefined && !periodicidad) {
      return res.status(400).json({ error: 'El campo periodicidad es obligatorio si se envía' });
    }
    if (socioComunitarioId !== undefined && !socioComunitarioId) {
      return res.status(400).json({ error: 'El campo socioComunitarioId es obligatorio si se envía' });
    }

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

      try {
        await validarConflictosHorario(lugarId, generarFechasCitas(new Date(fechaInicio), new Date(fechaFin), periodicidad), horaInicio, horaFin, Number(id));
      } catch (conflicto) {
        return res.status(conflicto.status || 409).json({
          error: conflicto.message,
          sugerencias: conflicto.sugerencias,
        });
      }
    }

    // Construir objeto actualización solo con campos válidos
    const dataToUpdate = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (tipoId !== undefined) dataToUpdate.tipoActividadId = tipoId;
    if (periodicidad !== undefined) dataToUpdate.periodicidad = periodicidad;
    if (fechaInicio !== undefined) dataToUpdate.fechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    if (fechaFin !== undefined) dataToUpdate.fechaFin = fechaFin ? new Date(fechaFin) : null;
    if (socioComunitarioId !== undefined) dataToUpdate.socioComunitarioId = socioComunitarioId;
    if (proyectoId !== undefined) dataToUpdate.proyectoId = proyectoId;
    if (cupo !== undefined) dataToUpdate.cupo = cupo;

    const actividad = await prisma.actividad.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    res.json({
      message: 'Actividad actualizada exitosamente',
      actividad,
    });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'No se pudo actualizar la actividad', detalle: error.message });
  }
}

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
