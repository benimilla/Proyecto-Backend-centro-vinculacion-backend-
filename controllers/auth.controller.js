import crypto from 'crypto'; // ✅ IMPORTACIÓN FALTANTE
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { signToken } from '../config/jwt.js';
import { sendMail } from '../utils/mailer.js';

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

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Correo no encontrado' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.usuario.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExp: expires,
    }
  });

  const link = `https://tu-frontend/reset-password?token=${token}&email=${email}`;
  await sendMail({
    to: email,
    subject: 'Recuperación de contraseña',
    html: `<p>Haz clic <a href="${link}">aquí</a> para recuperar tu contraseña.</p>`,
  });

  res.json({ message: 'Instrucciones enviadas al correo.' });
}

export async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body;

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user || user.resetToken !== token || new Date() > user.resetTokenExp) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.usuario.update({
    where: { email },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExp: null
    }
  });

  res.json({ message: 'Contraseña actualizada correctamente.' });
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