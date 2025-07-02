import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { hasPermission } from '../middlewares/permissions.middleware.js';

import {
  listarPermisosUsuario,
  crearPermiso,
  eliminarPermiso,
} from '../controllers/permissions.controller.js';

const router = express.Router();

// Listar permisos de un usuario (restringido a usuarios con permiso para ver permisos)
router.get('/:usuarioId', auth, hasPermission('ver_permisos'), listarPermisosUsuario);

// Crear un permiso para un usuario (solo admins o roles con permiso)
router.post('/', auth, hasPermission('crear_permiso'), crearPermiso);

// Eliminar un permiso (solo admins o roles con permiso)
router.delete('/:id', auth, hasPermission('eliminar_permiso'), eliminarPermiso);

export { router };
