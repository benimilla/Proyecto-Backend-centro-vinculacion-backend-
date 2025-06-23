import { prisma } from '../config/db.js';

export async function create(req, res) {
  try {
    const data = req.body;
    const lugar = await prisma.lugar.create({ data });
    res.status(201).json(lugar);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear lugar', details: error.message });
  }
}

export async function getAll(req, res) {
  try {
    const lugares = await prisma.lugar.findMany();
    res.json(lugares);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lugares', details: error.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const lugar = await prisma.lugar.findUnique({ where: { id: Number(id) } });
    if (!lugar) return res.status(404).json({ error: 'Lugar no encontrado' });
    res.json(lugar);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lugar', details: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const lugar = await prisma.lugar.update({
      where: { id: Number(id) },
      data,
    });
    res.json(lugar);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar lugar', details: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.lugar.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar lugar', details: error.message });
  }
}
