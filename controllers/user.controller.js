// controllers/user.controller.js
import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true }
  });
  res.json(usuarios);
}

export async function getById(req, res) {
  const { id } = req.params;
  const usuario = await prisma.usuario.findUnique({ where: { id: Number(id) } });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
}

export async function create(req, res) {
  try {
    const { nombre, email, password, rol = 'USER' } = req.body;

    // bcrypt hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol,
      }
    });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
}

export async function update(req, res) {
  const { id } = req.params;
  const data = req.body;
  const usuario = await prisma.usuario.update({ where: { id: Number(id) }, data });
  res.json(usuario);
}

export async function remove(req, res) {
  const { id } = req.params;
  await prisma.usuario.delete({ where: { id: Number(id) } });
  res.status(204).end();
}
