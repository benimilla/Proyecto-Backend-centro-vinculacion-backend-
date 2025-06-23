import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { signToken } from '../config/jwt.js';
import { sendMail } from '../utils/mailer.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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
        permisos: {} // evitar error por campo requerido
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

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    // Aquí devuelves el mensaje solicitado y código 404
    return res.status(404).json({ error: 'El correo no está registrado' });
  }

  // Si el usuario existe, sigue con la lógica de generación de token, envío de email, etc.
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.usuario.update({
    where: { email },
    data: {
      resetToken: token,
      resetTokenExp: expires,
    }
  });

  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`;
  await sendMail({
    to: email,
    subject: 'Recuperación de contraseña',
    html: `<p>Haz clic <a href="${link}">aquí</a> para recuperar tu contraseña.</p>`,
  });

  res.json({ message: 'Instrucciones enviadas al correo.' });
}

export async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.resetToken !== token || new Date() > usuario.resetTokenExp) {
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

  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar contraseña', detalle: error.message });
  }
}
