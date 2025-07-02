import express from 'express';
import * as permisoController from '../controllers/permisossuario.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Listar todos los permisos del sistema (permisos disponibles)
router.get('/', requireAuth, permisoController.listarTodosLosPermisos);

// Listar permisos asignados a un usuario específico
router.get('/:usuarioId', requireAuth, permisoController.listarPermisosUsuario);

// Crear un permiso para un usuario
router.post('/', requireAuth, permisoController.crearPermiso);

// Eliminar un permiso por su ID
router.delete('/:id', requireAuth, permisoController.eliminarPermiso);

export { router };
