// middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token malformado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;          // puedes seguir usando si necesitas rol, etc.
    req.userId = decoded.userId; // 👈 esto es clave para `creado_por`
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
