// controllers/maintenance.controller.js
const prisma = require('../config/db');

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const maintenance = await prisma.maintenance.create({ data });
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el mantenimiento', details: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const maintenances = await prisma.maintenance.findMany();
    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mantenimientos', details: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: Number(id) },
    });
    if (!maintenance) return res.status(404).json({ error: 'Mantenimiento no encontrado' });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mantenimiento', details: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const maintenance = await prisma.maintenance.update({
      where: { id: Number(id) },
      data,
    });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar mantenimiento', details: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.maintenance.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar mantenimiento', details: error.message });
  }
};
