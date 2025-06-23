import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const proyectos = await prisma.proyecto.findMany();
    res.json(proyectos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyectos', details: error.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const proyecto = await prisma.proyecto.findUnique({ where: { id: Number(id) } });
    if (!proyecto) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(proyecto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proyecto', details: error.message });
  }
}

export async function create(req, res) {
  try {
    const data = req.body;
    const nuevo = await prisma.proyecto.create({ data });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proyecto', details: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const actualizado = await prisma.proyecto.update({ where: { id: Number(id) }, data });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar proyecto', details: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.proyecto.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar proyecto', details: error.message });
  }
}
