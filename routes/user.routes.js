import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove
} from '../controllers/user.controller.js';

import { auth } from '../middlewares/auth.middleware.js';
import { hasPermission } from '../middlewares/permissions.middleware.js';

const router = express.Router();

// Crear usuario (requiere permiso 'crear_usuario')
router.post('/', auth, hasPermission('crear_usuario'), create);

// Obtener todos los usuarios (requiere permiso 'ver_usuarios')
router.get('/', auth, hasPermission('ver_usuarios'), getAll);

// Obtener usuario por ID (requiere estar autenticado, no permiso específico)
router.get('/:id', auth, getById);

// Actualizar usuario (requiere permiso 'editar_usuario')
router.put('/:id', auth, hasPermission('editar_usuario'), update);

// Eliminar usuario (requiere permiso 'eliminar_usuario')
router.delete('/:id', auth, hasPermission('eliminar_usuario'), remove);

export { router };
