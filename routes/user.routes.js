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

// Solo admin o quien tenga permiso puede hacer esto
router.get('/', auth, hasPermission('ver_usuarios'), getAll);
router.get('/:id', auth, hasPermission('ver_usuarios'), getById);
router.post('/', auth, hasPermission('crear_usuario'), create);
router.put('/:id', auth, hasPermission('editar_usuario'), update);
router.delete('/:id', auth, hasPermission('eliminar_usuario'), remove);

export { router };
