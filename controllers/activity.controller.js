import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const actividades = await prisma.actividad.findMany({
      skip,
      take: pageSize,
      orderBy: { fechaInicio: 'desc' },
    });

    res.json(actividades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las actividades' });
  }
}

export async function create(req, res) {
  try {
    const {
      nombre,
      tipo_actividad_id,
      periodicidad,
      fecha_inicio,
      fecha_fin,
      socio_comunitario_id,
      proyecto_id,
      cupo,
    } = req.body;

    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipo_actividad_id) errores.tipoActividadId = 'El campo tipoActividadId es obligatorio';
    if (!periodicidad) errores.periodicidad = 'El campo periodicidad es obligatorio';
    if (!fecha_inicio) errores.fechaInicio = 'El campo fechaInicio es obligatorio';
    if (!socio_comunitario_id) errores.socioComunitarioId = 'El campo socioComunitarioId es obligatorio';

    const inicio = new Date(fecha_inicio);
    const fin = fecha_fin ? new Date(fecha_fin) : null;
    if (isNaN(inicio)) errores.fechaInicio = 'Fecha de inicio inválida';
    if (fecha_fin && isNaN(fin)) errores.fechaFin = 'Fecha de fin inválida';
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
        tipoActividadId: tipo_actividad_id,
        periodicidad,
        fechaInicio: inicio,
        fechaFin: fin,
        socioComunitarioId: socio_comunitario_id,
        proyectoId: proyecto_id || null,
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

    const {
      nombre,
      tipo_actividad_id,
      periodicidad,
      fecha_inicio,
      fecha_fin,
      socio_comunitario_id,
      proyecto_id,
      cupo,
    } = req.body;

    const dataToUpdate = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (tipo_actividad_id !== undefined) dataToUpdate.tipoActividadId = tipo_actividad_id;
    if (periodicidad !== undefined) dataToUpdate.periodicidad = periodicidad;
    if (fecha_inicio !== undefined) {
      const inicio = new Date(fecha_inicio);
      if (isNaN(inicio)) return res.status(400).json({ error: 'Fecha de inicio inválida' });
      dataToUpdate.fechaInicio = inicio;
    }
    if (fecha_fin !== undefined) {
      const fin = new Date(fecha_fin);
      if (isNaN(fin)) return res.status(400).json({ error: 'Fecha de fin inválida' });
      dataToUpdate.fechaFin = fin;
    }
    if (socio_comunitario_id !== undefined) dataToUpdate.socioComunitarioId = socio_comunitario_id;
    if (proyecto_id !== undefined) dataToUpdate.proyectoId = proyecto_id || null;
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
