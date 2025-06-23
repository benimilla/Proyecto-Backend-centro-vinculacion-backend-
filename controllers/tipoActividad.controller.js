// controllers/tipoActividad.controller.js
import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const tipos = await prisma.tipoActividad.findMany();
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener Tipos de Actividad', details: error.message });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const tipo = await prisma.tipoActividad.findUnique({ where: { id: Number(id) } });
    if (!tipo) return res.status(404).json({ error: 'Tipo de actividad no encontrado' });
    res.json(tipo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener Tipo de Actividad', details: error.message });
  }
}

export async function create(req, res) {
  try {
    const data = req.body;
    const nuevo = await prisma.tipoActividad.create({ data });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear Tipo de Actividad', details: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const actualizado = await prisma.tipoActividad.update({
      where: { id: Number(id) },
      data,
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar Tipo de Actividad', details: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.tipoActividad.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar Tipo de Actividad', details: error.message });
  }
}
