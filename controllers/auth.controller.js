import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db.js';
import { signToken } from '../config/jwt.js';
import { sendMail } from '../utils/mailer.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function register(req, res) {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Hashear contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Crear el usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashed
      }
    });

    // Permisos por defecto
    const permisosIniciales = ['ver_actividades', 'crear_actividad', 'crear_cita'];

    // Asignar permisos por defecto
    await Promise.all(
      permisosIniciales.map(permiso =>
        prisma.permisoUsuario.create({
          data: {
            usuarioId: usuario.id,
            permiso
          }
        })
      )
    );

    const token = signToken({ userId: usuario.id });
    res.status(201).json({ usuario, token });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
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

    const token = signToken({ userId: usuario.id });
    res.json({ usuario, token });

  } catch (error) {
    res.status(500).json({ error: 'Error en login', detalle: error.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ error: 'El correo no está registrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    await prisma.usuario.update({
      where: { email },
      data: {
        tokenRecuperacion: token,
        tokenExpiracion: expires
      }
    });

    const link = `${FRONTEND_URL}/reset-password?token=${token}&email=${email}`;
    await sendMail({
      to: email,
      subject: 'Recuperación de contraseña',
      html: `<p>Haz clic <a href="${link}">aquí</a> para recuperar tu contraseña.</p>`,
    });

    res.json({ message: 'Instrucciones enviadas al correo.' });

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ error: 'Error al procesar recuperación de contraseña', detalle: error.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.tokenRecuperacion !== token || new Date() > usuario.tokenExpiracion) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { email },
      data: {
        password: hashed,
        tokenRecuperacion: null,
        tokenExpiracion: null
      }
    });

    res.json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ error: 'Error al actualizar contraseña', detalle: error.message });
  }
}
