import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token malformado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Guardamos el objeto decodificado completo para acceso general
    req.user = decoded;

    // Y también userId directo para conveniencia
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
