import { prisma } from '../config/db.js';

// Función para generar citas según periodicidad entre fechas
async function generarCitas(actividadId, fechaInicio, fechaFin, periodicidad, lugarId) {
  let fecha = new Date(fechaInicio);
  const citas = [];

  while (fecha <= fechaFin) {
    // Antes de crear la cita, validar conflicto de horario y lugar
    const conflicto = await prisma.cita.findFirst({
      where: {
        lugarId,
        fecha,
        estado: 'Programada',
        OR: [
          {
            horaInicio: { lt: '18:00' }, // Aquí debes recibir o parametrizar horaInicio y horaFin reales
            horaFin: { gt: '09:00' },    // Ejemplo: horario 9:00 a 18:00, adapta según tus datos
          },
        ],
      },
    });

    if (conflicto) {
      throw new Error(`Conflicto de horario en lugar ${lugarId} para fecha ${fecha.toISOString().slice(0,10)}`);
    }

    citas.push(
      prisma.cita.create({
        data: {
          actividadId,
          fecha,
          estado: 'Programada',
          lugarId,
          horaInicio: '09:00', // ajustar según necesidad
          horaFin: '18:00',    // ajustar según necesidad
        }
      })
    );

    switch (periodicidad) {
      case 'diaria':
        fecha.setDate(fecha.getDate() + 1);
        break;
      case 'semanal':
        fecha.setDate(fecha.getDate() + 7);
        break;
      case 'mensual':
        fecha.setMonth(fecha.getMonth() + 1);
        break;
      default:
        // Para actividad puntual solo una cita
        fecha = new Date(fechaFin.getTime() + 1);
    }
  }
  await Promise.all(citas);
}

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
      lugarId, // agregar lugar para validación de horario
    } = req.body;

    // Validar campos obligatorios
    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipoActividadId) errores.tipoActividadId = 'El campo tipoActividadId es obligatorio';
    if (!periodicidad) errores.periodicidad = 'El campo periodicidad es obligatorio';
    if (!fechaInicio) errores.fechaInicio = 'El campo fechaInicio es obligatorio';
    if (!socioComunitarioId) errores.socioComunitarioId = 'El campo socioComunitarioId es obligatorio';
    if (!lugarId) errores.lugarId = 'El campo lugarId es obligatorio';

    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : null;

    if (isNaN(inicio)) errores.fechaInicio = 'Fecha de inicio inválida';
    if (fechaFin && isNaN(fin)) errores.fechaFin = 'Fecha de fin inválida';
    if (fin && fin < inicio) errores.fechaFin = 'La fecha de fin no puede ser menor que la de inicio';

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Validar conflicto para actividad puntual (si periodicidad 'única')
    if (periodicidad === 'única') {
      // Aquí validar si ya existe cita en el lugar para esa fecha y horario
      const conflicto = await prisma.cita.findFirst({
        where: {
          lugarId,
          fecha: inicio,
          estado: 'Programada',
          OR: [
            {
              horaInicio: { lt: '18:00' }, // Debes recibir y usar horas reales de entrada
              horaFin: { gt: '09:00' },
            },
          ],
        },
      });
      if (conflicto) {
        return res.status(409).json({ error: `El lugar ya está ocupado el día ${inicio.toISOString().slice(0,10)}` });
      }
    }

    // Crear actividad
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

    // Crear citas según periodicidad
    if (periodicidad !== 'única' && fin) {
      await generarCitas(actividad.id, inicio, fin, periodicidad, lugarId);
    } else if (periodicidad === 'única') {
      // Crear cita única para actividad puntual
      await prisma.cita.create({
        data: {
          actividadId: actividad.id,
          fecha: inicio,
          estado: 'Programada',
          lugarId,
          horaInicio: '09:00', // Ajustar según datos reales
          horaFin: '18:00',
        },
      });
    }

    res.status(201).json({ message: 'Actividad creada exitosamente', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: 'Error al crear actividad', detalle: error.message });
  }
}

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

    // Validar permisos (solo creador puede modificar)
    if (actividad.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta actividad' });
    }

    // Bloquear modificación si actividad está completada
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

    res.json({ message: 'Actividad actualizada exitosamente', actividad: actividadActualizada });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'No se pudo actualizar la actividad', detalle: error.message });
  }
}

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

    res.json({ message: 'Actividad cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar actividad:', error);
    res.status(500).json({ error: 'Error al cancelar actividad', detalle: error.message });
  }
}

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

    res.json(actividades);
  } catch (error) {
    console.error('Error al obtener las actividades:', error);
    res.status(500).json({ error: 'Error al obtener las actividades' });
  }
}

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

// Endpoint para vista mensual con indicadores visuales (CA-18)
export async function getActividadesMes(req, res) {
  try {
    const { year, month } = req.query; // ejemplo: year=2025, month=6 (junio)
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

    res.json({ actividades });
  } catch (error) {
    console.error('Error al obtener actividades mes:', error);
    res.status(500).json({ error: 'Error al obtener actividades del mes' });
  }
}

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

    res.json(actividad);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
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
