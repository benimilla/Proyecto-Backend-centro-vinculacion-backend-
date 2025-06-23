import { prisma } from '../config/db.js';

export async function create(req, res) {
  try {
    const data = req.body;

    // Asegurarte de que `req.userId` venga del middleware
    if (!req.userId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const activity = await prisma.actividad.create({
      data: {
        ...data,
        creado_por: req.userId  // 👈 importante: registrar el creador
      }
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ error: 'Error al crear actividad' });
  }
}

export async function getAll(req, res) {
  try {
    const activities = await prisma.actividad.findMany({
      include: { citas: true, archivos: true },
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
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
