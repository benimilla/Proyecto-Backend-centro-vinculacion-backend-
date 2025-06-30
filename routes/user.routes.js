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

// Crear usuario (solo admin)
router.post('/', auth, hasPermission('admin'), create);

router.get('/', auth, hasPermission('admin'), getAll);
router.get('/:id', auth, getById); // acceso general con auth
router.put('/:id', auth, update);  // acceso general con auth
router.delete('/:id', auth, hasPermission('admin'), remove);

export { router };
