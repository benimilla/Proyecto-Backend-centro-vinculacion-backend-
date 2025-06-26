import { prisma } from '../config/db.js';

// Función auxiliar para generar citas según periodicidad entre fechas
async function generarCitas(actividadId, fechaInicio, fechaFin, lugarId, horaInicio, horaFin, userId) {
  let fecha = new Date(fechaInicio);
  const citas = [];

  while (fecha <= fechaFin) {
    const conflicto = await prisma.cita.findFirst({
      where: {
        lugarId,
        fecha,
        estado: 'Programada',
        OR: [
          {
            horaInicio: { lt: horaFin },
            horaFin: { gt: horaInicio },
          },
        ],
      },
    });

    if (conflicto) {
      throw new Error(`El lugar ${lugarId} está ocupado el ${fecha.toISOString().slice(0, 10)} de ${horaInicio} a ${horaFin}`);
    }

    citas.push(
      prisma.cita.create({
        data: {
          actividadId,
          fecha: new Date(fecha),
          estado: 'Programada',
          lugarId,
          horaInicio,
          horaFin,
          creadoPorId: userId,
        },
      })
    );

    fecha.setDate(fecha.getDate() + 7);
  }

  await Promise.all(citas);
}


// Crear actividad (CA-08, CA-09, CA-10, CA-11)
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

    if (horaInicio && horaFin && horaInicio >= horaFin) {
      errores.horas = 'La hora de inicio debe ser menor que la hora de fin';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const conflicto = await prisma.cita.findFirst({
      where: {
        lugarId,
        fecha: inicio,
        estado: 'Programada',
        OR: [
          {
            horaInicio: { lt: horaFin },
            horaFin: { gt: horaInicio },
          },
        ],
      },
    });

    if (conflicto) {
      return res.status(409).json({
        error: `El lugar ya está ocupado el día ${inicio.toISOString().slice(0, 10)} de ${horaInicio} a ${horaFin}`,
        sugerencias: await obtenerSugerencias(lugarId, inicio, horaInicio, horaFin),
      });
    }

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
      },
    });

    if (periodicidad === 'Periódica' && fin) {
      await generarCitas(actividad.id, inicio, fin, lugarId, horaInicio, horaFin, req.user.userId);
    } else if (periodicidad === 'Puntual') {
      await prisma.cita.create({
        data: {
          actividadId: actividad.id,
          fecha: inicio,
          estado: 'Programada',
          lugarId,
          horaInicio,
          horaFin,
          creadoPorId: req.user.userId,
        },
      });
    }

    return res.status(201).json({ message: 'Actividad creada exitosamente', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ error: 'Error al crear actividad', detalle: error.message });
  }
}


// Actualizar actividad (CA-12, CA-13, CA-14)
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

    // Validar permisos (solo creador puede modificar) (CA-13)
    if (actividad.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta actividad' });
    }

    // Bloquear modificación si actividad completada (CA-14)
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

// Cancelar actividad (CA-15, CA-16)
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
      include: { citas: true },
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    await prisma.actividad.update({
      where: { id: actividadId },
      data: { estado: 'Cancelada' },
    });

    await prisma.cita.updateMany({
      where: { actividadId },
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
        citas: { select: { id: true } },
        archivos: { select: { id: true } },
      },
    });

    return res.json(actividades);
  } catch (error) {
    console.error('Error al obtener las actividades:', error);
    return res.status(500).json({ error: 'Error al obtener las actividades' });
  }
}

// Obtener actividades de la semana actual (CA-17)
export async function getActividadesSemanaActual(req, res) {
  try {
    const hoy = new Date();

    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    primerDiaSemana.setHours(0, 0, 0, 0);

    const ultimoDiaSemana = new Date(primerDiaSemana);
    ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6);
    ultimoDiaSemana.setHours(23, 59, 59, 999);

    const actividades = await prisma.actividad.findMany({
      where: {
        estado: 'Programada',
        OR: [
          {
            fechaInicio: {
              gte: primerDiaSemana,
              lte: ultimoDiaSemana,
            },
          },
          {
            fechaFin: {
              gte: primerDiaSemana,
              lte: ultimoDiaSemana,
            },
          },
          {
            AND: [
              { fechaInicio: { lte: primerDiaSemana } },
              { fechaFin: { gte: ultimoDiaSemana } },
            ],
          },
        ],
      },
      orderBy: { fechaInicio: 'asc' },
      select: {
        id: true,
        nombre: true,
        periodicidad: true,
        fechaInicio: true,
        fechaFin: true,
        cupo: true,
        socioComunitarioId: true,
        proyectoId: true,
        estado: true,
        creadoPorId: true,
        citas: { select: { id: true, fecha: true, horaInicio: true, horaFin: true } },
      },
    });

    return res.json({
      semana: {
        inicio: primerDiaSemana,
        fin: ultimoDiaSemana,
      },
      actividades,
    });
  } catch (error) {
    console.error('Error al obtener actividades semana actual:', error);
    return res.status(500).json({ error: 'Error al obtener actividades de la semana actual' });
  }
}

// Obtener actividades del mes (CA-18)
export async function getActividadesMes(req, res) {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'Faltan parámetros year o month' });
    }

    const primerDiaMes = new Date(year, month - 1, 1);
    const ultimoDiaMes = new Date(year, month, 0, 23, 59, 59, 999);

    const actividades = await prisma.actividad.findMany({
      where: {
        estado: 'Programada',
        OR: [
          { fechaInicio: { gte: primerDiaMes, lte: ultimoDiaMes } },
          { fechaFin: { gte: primerDiaMes, lte: ultimoDiaMes } },
          {
            AND: [
              { fechaInicio: { lte: primerDiaMes } },
              { fechaFin: { gte: ultimoDiaMes } },
            ],
          },
        ],
      },
      orderBy: { fechaInicio: 'asc' },
      select: {
        id: true,
        nombre: true,
        fechaInicio: true,
        fechaFin: true,
        citas: { select: { fecha: true } },
      },
    });

    return res.json({ actividades });
  } catch (error) {
    console.error('Error al obtener actividades mes:', error);
    return res.status(500).json({ error: 'Error al obtener actividades del mes' });
  }
}

// Obtener actividad por ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) },
      include: {
        citas: { select: { id: true } },
        archivos: { select: { id: true } },
      },
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
