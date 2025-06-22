// controllers/appointment.controller.js
const prisma = require('../config/db');

exports.create = async (req, res) => {
  const data = req.body;
  const cita = await prisma.cita.create({ data });
  res.status(201).json(cita);
};

exports.getAll = async (req, res) => {
  const citas = await prisma.cita.findMany({ include: { actividad: true, lugar: true } });
  res.json(citas);
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const cita = await prisma.cita.update({
    where: { id: Number(id) },
    data,
  });
  res.json(cita);
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  await prisma.cita.delete({ where: { id: Number(id) } });
  res.status(204).end();
};
