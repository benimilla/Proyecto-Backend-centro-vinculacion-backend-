// routes/maintenance.routes.js
import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove
} from '../controllers/maintenance.controller.js';

import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', auth, getAll);
router.get('/:id', auth, getById);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

export { router };
