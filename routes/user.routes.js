// routes/user.routes.js
import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove
} from '../controllers/user.controller.js';

import { auth } from '../middlewares/auth.middleware.js';
import { permissions } from '../middlewares/permissions.middleware.js';

const router = express.Router();

// Crear usuario (solo admin)
router.post('/', auth, permissions('admin'), create);

router.get('/', auth, permissions('admin'), getAll);
router.get('/:id', auth, getById);
router.put('/:id', auth, update);
router.delete('/:id', auth, permissions('admin'), remove);

export { router };
