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

export async function create(req, res) {
  try {
    const { name, email, password, role = 'USER' } = req.body;

    // Aquí podrías agregar validación, hashing de contraseña, etc.
    // Por ejemplo, usar bcrypt para hashear la contraseña:
    // import bcrypt from 'bcrypt';
    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // Mejor guardar hashedPassword si haces hashing
        role,
      }
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
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
