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

    if (!nombre || !tipoId || !periodicidadId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, tipoId o periodicidadId' });
    }

    // Validar fechas si es periódica
    const isPeriodica = fechaInicio && fechaFin;
    if (isPeriodica) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      if (isNaN(inicio) || isNaN(fin)) {
        return res.status(400).json({ error: 'Fechas inválidas' });
      }

      if (fin < inicio) {
        return res.status(400).json({ error: 'La fecha de fin no puede ser menor que la fecha de inicio' });
      }

      if (!horaInicio || !horaFin || !lugarId) {
        return res.status(400).json({ error: 'Hora de inicio, hora de fin y lugar son obligatorios para actividades periódicas' });
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

    // Si es periódica, generar citas automáticamente
    if (isPeriodica) {
      const mapPeriodicidad = {
        1: 'diaria',
        2: 'semanal',
        3: 'mensual',
      };

      const periodicidad = mapPeriodicidad[periodicidadId];
      if (!periodicidad) {
        return res.status(400).json({ error: 'Periodicidad no reconocida' });
      }

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
      include: { citas: true, archivos: true }
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

// Actualizar actividad
export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { nombre, tipoId, periodicidadId } = req.body;

    // Si quieres campos obligatorios en update:
    if (nombre === '') return res.status(400).json({ error: 'El campo nombre no puede estar vacío' });
    if (tipoId !== undefined && !tipoId) return res.status(400).json({ error: 'El campo tipoId es obligatorio si se envía' });
    if (periodicidadId !== undefined && !periodicidadId) return res.status(400).json({ error: 'El campo periodicidadId es obligatorio si se envía' });

    const actividad = await prisma.actividad.update({
      where: { id: Number(id) },
      data: req.body
    });

    res.json(actividad);
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
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
