// middlewares/permissions.middleware.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export function hasPermission(permiso) {
  return async function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const tienePermiso = await prisma.permisoUsuario.findFirst({
      where: {
        usuarioId: req.user.id,
        permiso,
      },
    });

    if (!tienePermiso) {
      return res.status(403).json({ error: 'No tiene permisos' });
    }

    next();
  };
}
