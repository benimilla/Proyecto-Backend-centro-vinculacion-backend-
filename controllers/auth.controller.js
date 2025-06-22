// controllers/auth.controller.js
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { signToken } from '../config/jwt.js';

export async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
  data: { 
    nombre,
    email,
    password: hashed,
    rol: 'USER',
    permisos: {}  // <-- valor vacío para evitar error
  }
});
    const token = signToken({ userId: usuario.id, role: usuario.rol });

    res.status(201).json({ usuario, token });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario', detalle: error.message });
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken({ userId: usuario.id, role: usuario.rol });
    res.json({ usuario, token });
  } catch (error) {
    res.status(500).json({ error: 'Error en login', detalle: error.message });
  }
}
