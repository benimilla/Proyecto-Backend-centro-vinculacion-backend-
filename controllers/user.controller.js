// controllers/user.controller.js
import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  res.json(users);
}

export async function getById(req, res) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
}

export async function update(req, res) {
  const { id } = req.params;
  const data = req.body;
  const user = await prisma.user.update({ where: { id: Number(id) }, data });
  res.json(user);
}

export async function remove(req, res) {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: Number(id) } });
  res.status(204).end();
}
