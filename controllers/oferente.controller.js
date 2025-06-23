import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const oferentes = await prisma.oferenteActividad.findMany();
    res.json(oferentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener oferentes', details: error.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const oferente = await prisma.oferenteActividad.findUnique({ where: { id: Number(id) } });
    if (!oferente) return res.status(404).json({ error: 'Oferente no encontrado' });
    res.json(oferente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener oferente', details: error.message });
  }
}

export async function create(req, res) {
  try {
    const data = req.body;
    const nuevo = await prisma.oferenteActividad.create({ data });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear oferente', details: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const actualizado = await prisma.oferenteActividad.update({ where: { id: Number(id) }, data });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar oferente', details: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.oferenteActividad.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar oferente', details: error.message });
  }
}
