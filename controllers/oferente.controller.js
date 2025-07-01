import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const oferentes = await prisma.oferente.findMany(); // CORREGIDO
    res.json(oferentes);
  } catch (error) {
    console.error('Error getAll oferentes:', error);
    res.status(500).json({ error: 'Error al obtener oferentes', details: error.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const oferente = await prisma.oferente.findUnique({ where: { id: Number(id) } }); // CORREGIDO
    if (!oferente) return res.status(404).json({ error: 'Oferente no encontrado' });
    res.json(oferente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener oferente', details: error.message });
  }
}

export async function create(req, res) {
  try {
    const data = req.body;
    const nuevo = await prisma.oferente.create({ data }); // CORREGIDO
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear oferente', details: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const actualizado = await prisma.oferente.update({ where: { id: Number(id) }, data }); // CORREGIDO
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar oferente', details: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.oferente.delete({ where: { id: Number(id) } }); // CORREGIDO
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar oferente', details: error.message });
  }
}