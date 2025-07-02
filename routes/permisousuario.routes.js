import express from 'express';
import * as permisoController from '../controllers/permisousuario.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Listar todos los permisos del sistema (permisos disponibles)
router.get('/', auth, permisoController.listarTodosLosPermisos);

// Listar permisos asignados a un usuario específico
router.get('/:usuarioId', auth, permisoController.listarPermisosUsuario);

// Crear un permiso para un usuario
router.post('/', auth, permisoController.crearPermiso);

// Eliminar un permiso por su ID
router.delete('/:id', auth, permisoController.eliminarPermiso);

export { router };
