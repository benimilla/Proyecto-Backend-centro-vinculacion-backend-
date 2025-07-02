import express from 'express';
import * as controller from '../controllers/lugar.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', requireAuth, controller.getAll);
router.post('/', requireAuth, controller.create);
router.get('/:id', requireAuth, controller.getById);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

export { router };
