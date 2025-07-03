import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

export async function getAll(req, res) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        permisos: {
          select: {
            permiso: true,
          },
        },
      },
    });

    // Opcional: transformar a lista de strings
    const transformados = usuarios.map((u) => ({
      ...u,
      permisos: u.permisos.map((p) => p.permiso),
    }));

    res.json(transformados);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: {
        permisos: {
          select: { permiso: true },
        },
      },
    });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const resultado = {
      ...usuario,
      permisos: usuario.permisos.map((p) => p.permiso),
    };

    res.json(resultado);
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

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) {
      return res.status(400).json({ error: 'El email ya estÃ¡ registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
      },
    });

    const permisosIniciales = ['ver_actividades', 'crear_actividad', 'crear_cita'];

    await Promise.all(
      permisosIniciales.map((permiso) =>
        prisma.permisoUsuario.create({
          data: {
            usuarioId: usuario.id,
            permiso,
            asignadoPorId: null,
          },
        })
      )
    );

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

    const { permisos, ...restoData } = data;

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: restoData,
    });

    if (Array.isArray(permisos)) {
      await prisma.permisoUsuario.deleteMany({
        where: { usuarioId: usuarioActualizado.id },
      });

      const nuevos = permisos.map((permiso) => ({
        permiso,
        usuarioId: usuarioActualizado.id,
        asignadoPorId: null,
      }));

      await prisma.permisoUsuario.createMany({ data: nuevos });
    }

    res.json({ mensaje: 'Usuario actualizado correctamente' });
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