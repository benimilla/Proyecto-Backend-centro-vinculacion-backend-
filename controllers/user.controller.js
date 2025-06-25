import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true }
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

export async function create(req, res) {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }

    // Opcional: validar email único manualmente
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
      }
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario', detalle: error.message });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario', detalle: error.message });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;
    await prisma.usuario.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
}
