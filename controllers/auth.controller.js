// controllers/auth.controller.js
const prisma = require('../config/db');
const { signToken } = require('../config/jwt');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hashed, role: 'USER' } });
  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({ user, token });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = signToken({ userId: user.id, role: user.role });
  res.json({ user, token });
};
