// controllers/appointment.controller.js
import { prisma } from '../config/db.js'; // ✅ export nombrado

export async function create(req, res) {
  try {
    const data = req.body;
    const cita = await prisma.cita.create({ data });
    res.status(201).json(cita);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la cita', detalle: error.message });
  }
}

export async function getAll(req, res) {
  try {
    const citas = await prisma.cita.findMany({
      include: { actividad: true, lugar: true }
    });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las citas', detalle: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const cita = await prisma.cita.update({
      where: { id: Number(id) },
      data
    });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cita', detalle: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.cita.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la cita', detalle: error.message });
  }
}
