// cita.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear una nueva cita
export const crearCita = async (req, res) => {
  try {
    const {
      actividadId,
      lugarId,
      fecha,
      horaInicio,
      horaFin,
      creadoPorId,
    } = req.body;

    const nuevaCita = await prisma.cita.create({
      data: {
        actividadId,
        lugarId,
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
        creadoPorId,
      },
    });

    res.status(201).json(nuevaCita);
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({ mensaje: 'Error creando cita' });
  }
};

// Obtener todas las citas
export const obtenerCitas = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        actividad: true,
        lugar: true,
        creadoPor: true,
      },
    });
    res.json(citas);
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({ mensaje: 'Error obteniendo citas' });
  }
};

// Obtener una cita por ID
export const obtenerCitaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: Number(id) },
      include: {
        actividad: true,
        lugar: true,
        creadoPor: true,
      },
    });

    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' });
    }

    res.json(cita);
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({ mensaje: 'Error obteniendo cita' });
  }
};

// Actualizar cita
export const actualizarCita = async (req, res) => {
  const { id } = req.params;
  const {
    actividadId,
    lugarId,
    fecha,
    horaInicio,
    horaFin,
    estado,
    motivoCancelacion,
  } = req.body;

  try {
    const citaActualizada = await prisma.cita.update({
      where: { id: Number(id) },
      data: {
        actividadId,
        lugarId,
        fecha: fecha ? new Date(fecha) : undefined,
        horaInicio,
        horaFin,
        estado,
        motivoCancelacion,
      },
    });

    res.json(citaActualizada);
  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({ mensaje: 'Error actualizando cita' });
  }
};

// Cancelar cita (cambiar estado y añadir motivo)
export const cancelarCita = async (req, res) => {
  const { id } = req.params;
  const { motivoCancelacion } = req.body;

  if (!motivoCancelacion) {
    return res.status(400).json({ mensaje: 'Debe proporcionar un motivo para la cancelación' });
  }

  try {
    const citaCancelada = await prisma.cita.update({
      where: { id: Number(id) },
      data: {
        estado: 'Cancelada',
        motivoCancelacion,
      },
    });

    res.json({ mensaje: 'Cita cancelada exitosamente', cita: citaCancelada });
  } catch (error) {
    console.error('Error cancelando cita:', error);
    res.status(500).json({ mensaje: 'Error cancelando cita' });
  }
};

// Eliminar cita (opcional)
export const eliminarCita = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.cita.delete({
      where: { id: Number(id) },
    });

    res.json({ mensaje: 'Cita eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cita:', error);
    res.status(500).json({ mensaje: 'Error eliminando cita' });
  }
};
