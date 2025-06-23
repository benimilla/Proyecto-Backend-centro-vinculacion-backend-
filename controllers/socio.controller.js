import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const socios = await prisma.socioComunitario.findMany();
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener socios', details: error.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const socio = await prisma.socioComunitario.findUnique({ where: { id: Number(id) } });
    if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });
    res.json(socio);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener socio', details: error.message });
  }
}

export async function create(req, res) {
  try {
    const data = req.body;
    const nuevo = await prisma.socioComunitario.create({ data });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear socio', details: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const actualizado = await prisma.socioComunitario.update({ where: { id: Number(id) }, data });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar socio', details: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.socioComunitario.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar socio', details: error.message });
  }
}
