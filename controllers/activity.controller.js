import { prisma } from '../config/db.js';

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
    } = req.body;

    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipoActividadId) errores.tipoActividadId = 'El campo tipoActividadId es obligatorio';
    if (!periodicidad) errores.periodicidad = 'El campo periodicidad es obligatorio';
    if (!fechaInicio) errores.fechaInicio = 'El campo fechaInicio es obligatorio';
    if (!socioComunitarioId) errores.socioComunitarioId = 'El campo socioComunitarioId es obligatorio';

    const inicio = new Date(fechaInicio);
    let finActividad = null;
    if (fechaFin) {
      finActividad = new Date(fechaFin);
      if (isNaN(finActividad)) errores.fechaFin = 'Fecha de fin inválida';
      if (finActividad < inicio) errores.fechaFin = 'La fecha de fin no puede ser menor que la de inicio';
    }
    if (isNaN(inicio)) errores.fechaInicio = 'Fecha de inicio inválida';

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const actividad = await prisma.actividad.create({
      data: {
        nombre,
        tipoActividadId,
        periodicidad,
        fechaInicio: inicio,
        fechaFin: finActividad,
        socioComunitarioId,
        proyectoId: proyectoId || null,
        cupo: cupo ?? undefined,
        creadoPorId: req.user.id,
        estado: 'Programada',
      },
    });

    return res.status(201).json({ message: 'Actividad creada exitosamente', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ error: 'Error al crear actividad', detalle: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const actividad = await prisma.actividad.findUnique({ where: { id: Number(id) } });
    if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });

    if (!req.user || actividad.creadoPorId !== req.user.id) {
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
      estado
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
      const fin = fechaFin ? new Date(fechaFin) : null;
      if (fechaFin && isNaN(fin)) return res.status(400).json({ error: 'Fecha de fin inválida' });
      dataToUpdate.fechaFin = fin;
    } else if ('fechaFin' in req.body && req.body.fechaFin === null) {
      dataToUpdate.fechaFin = null;
    }

    if (socioComunitarioId !== undefined) dataToUpdate.socioComunitarioId = socioComunitarioId;
    if (proyectoId !== undefined) dataToUpdate.proyectoId = proyectoId || null;
    if (cupo !== undefined) dataToUpdate.cupo = cupo;
    if (estado !== undefined) dataToUpdate.estado = estado;

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

export async function cancel(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Debe proporcionar un motivo para la cancelación' });
    }

    if (!req.user || !req.user.id) {
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

    if (actividad.creadoPorId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para cancelar esta actividad' });
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

    return res.json({ message: 'Actividad y citas asociadas canceladas exitosamente' });
  } catch (error) {
    console.error('Error al cancelar actividad:', error);
    return res.status(500).json({ error: 'Error al cancelar actividad', detalle: error.message });
  }
}

export async function getAll(req, res) {
  try {
    const actividades = await prisma.actividad.findMany({
      orderBy: { fechaInicio: 'desc' },
      include: {
        tipoActividad: true,
        socioComunitario: true,
        proyecto: true,
        creadoPor: true,
      },
    });

    return res.json(actividades);
  } catch (error) {
    console.error('Error al obtener las actividades:', error);
    return res.status(500).json({ error: 'Error al obtener las actividades' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) },
      include: {
        tipoActividad: true,
        socioComunitario: true,
        proyecto: true,
        creadoPor: true,
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

export async function remove(req, res) {
  try {
    const { id } = req.params;

    const actividad = await prisma.actividad.findUnique({ where: { id: Number(id) } });
    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (!req.user || actividad.creadoPorId !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para eliminar esta actividad' });
    }

    await prisma.cita.deleteMany({
      where: { actividadId: Number(id) },
    });

    await prisma.actividad.delete({ where: { id: Number(id) } });

    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'No se puede eliminar la actividad porque tiene citas asociadas' });
    }
    return res.status(500).json({ error: 'Error al eliminar actividad', detalle: error.message });
  }
}
