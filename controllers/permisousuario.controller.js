import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Listar todos los permisos asignados a un usuario específico
 * GET /api/permissions/:usuarioId
 */
export const listarPermisosUsuario = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const permisos = await prisma.permisoUsuario.findMany({
      where: { usuarioId: Number(usuarioId) },
      include: {
        asignadoPor: {
          select: { id: true, nombre: true, email: true }
        }
      },
      orderBy: { fechaAsignacion: 'desc' }
    });

    res.json(permisos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener permisos del usuario' });
  }
};

/**
 * Listar todos los permisos disponibles en el sistema (definidos estáticamente)
 * GET /api/permissions
 */
export const listarTodosLosPermisos = async (req, res) => {
  try {
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
      // Puedes agregar más permisos aquí
    ];

    res.json(permisos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar permisos del sistema' });
  }
};

/**
 * Crear un nuevo permiso para un usuario
 * POST /api/permissions
 * Body: { usuarioId, permiso, asignadoPorId }
 */
export const crearPermiso = async (req, res) => {
  const { usuarioId, permiso, asignadoPorId } = req.body;

  if (!usuarioId || !permiso) {
    return res.status(400).json({ error: 'usuarioId y permiso son requeridos' });
  }

  try {
    // Verificar que el permiso no exista para este usuario (unique constraint)
    const permisoExistente = await prisma.permisoUsuario.findUnique({
      where: {
        usuarioId_permiso: {
          usuarioId: Number(usuarioId),
          permiso,
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
    console.error(error);
    res.status(500).json({ error: 'Error al crear permiso' });
  }
};

/**
 * Eliminar un permiso de un usuario por ID
 * DELETE /api/permissions/:id
 */
export const eliminarPermiso = async (req, res) => {
  const { id } = req.params;

  try {
    // Confirmar que el permiso existe antes de eliminar
    const permiso = await prisma.permisoUsuario.findUnique({
      where: { id: Number(id) },
    });

    if (!permiso) {
      return res.status(404).json({ error: 'Permiso no encontrado' });
    }

    await prisma.permisoUsuario.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Permiso eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar permiso' });
  }
};
