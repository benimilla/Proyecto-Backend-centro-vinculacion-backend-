export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nombre: true, email: true },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Aquí asignamos userId para que concuerde con lo que usas en controladores
    req.user = {
      userId: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
