import { prisma } from '../config/db.js';

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

export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
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

    const actividad = await prisma.actividad.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    res.json({ message: 'Actividad actualizada exitosamente', actividad });
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
