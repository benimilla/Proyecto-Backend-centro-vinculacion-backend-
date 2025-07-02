import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Listar todos los permisos de un usuario
 * GET /api/permissions/:usuarioId
 */
export const listarPermisosUsuario = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const permisos = await prisma.permisoUsuario.findMany({
      where: { usuarioId: Number(usuarioId) },
      include: { asignadoPor: { select: { id: true, nombre: true, email: true } } },
    });
    res.json(permisos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener permisos del usuario' });
  }
};

export const listarTodosLosPermisos = async (req, res) => {
  try {
    // Lista completa de permisos definidos en el sistema
    const permisos = [
      'crear_usuario',
      'editar_usuario',
      'eliminar_usuario',
      'ver_usuarios',
      'asignar_permisos',
      'crear_actividad',
      'editar_actividad',
      'eliminar_actividad',
      'ver_actividades',
      'cargar_archivo',
      'eliminar_archivo',
      'crear_cita',
      'cancelar_cita',
      // Agrega aquí más permisos si tu sistema crece
    ];

    res.json(permisos);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar permisos del sistema' });
  }
};



/**
 * Crear un permiso para un usuario
 * POST /api/permissions
 * body: { usuarioId, permiso, asignadoPorId }
 */
export const crearPermiso = async (req, res) => {
  const { usuarioId, permiso, asignadoPorId } = req.body;

  try {
    // Validar que no exista permiso duplicado por la restricciÃ³n @@unique en Prisma
    const permisoExistente = await prisma.permisoUsuario.findUnique({
      where: {
        usuarioId_permiso: {
          usuarioId: Number(usuarioId),
          permiso: permiso,
        },
      },
    });

    if (permisoExistente) {
      return res.status(400).json({ error: 'El usuario ya tiene asignado este permiso' });
    }

    const nuevoPermiso = await prisma.permisoUsuario.create({
      data: {
        usuarioId: Number(usuarioId),
        permiso,
        asignadoPorId: asignadoPorId ? Number(asignadoPorId) : null,
      },
    });

    res.status(201).json(nuevoPermiso);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear permiso' });
  }
};

/**
 * Eliminar un permiso de usuario
 * DELETE /api/permissions/:id
 */
export const eliminarPermiso = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.permisoUsuario.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Permiso eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar permiso' });
  }
};