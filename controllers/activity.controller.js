import { prisma } from '../config/db.js';

export async function create(req, res) {
  const data = req.body;
  const activity = await prisma.activity.create({ data });
  res.status(201).json(activity);
}

export async function getAll(req, res) {
  const activities = await prisma.activity.findMany({
    include: { citas: true, archivos: true },
  });
  res.json(activities);
}

export async function getById(req, res) {
  const { id } = req.params;
  const activity = await prisma.activity.findUnique({
    where: { id: Number(id) },
    include: { citas: true, archivos: true },
  });
  if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });
  res.json(activity);
}

export async function update(req, res) {
  const { id } = req.params;
  const data = req.body;
  const activity = await prisma.activity.update({
    where: { id: Number(id) },
    data,
  });
  res.json(activity);
}

export async function remove(req, res) {
  const { id } = req.params;
  await prisma.activity.delete({ where: { id: Number(id) } });
  res.status(204).end();
}
