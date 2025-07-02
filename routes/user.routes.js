import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { hasPermission } from '../middlewares/permissions.middleware.js';

const router = express.Router();

// Solo admin o quien tenga permiso puede hacer esto
router.get('/', requireAuth, hasPermission('ver_usuarios'), getAll);
router.get('/:id', requireAuth, hasPermission('ver_usuarios'), getById);
router.post('/', requireAuth, hasPermission('crear_usuario'), create);
router.put('/:id', requireAuth, hasPermission('editar_usuario'), update);
router.delete('/:id', requireAuth, hasPermission('eliminar_usuario'), remove);

export { router };
