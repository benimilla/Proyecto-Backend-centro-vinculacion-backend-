import express from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas...
router.get('/', requireAuth, activityController.getAll);
router.post('/', requireAuth, activityController.create);
router.get('/:id', requireAuth, activityController.getById);
router.put('/:id', requireAuth, activityController.update);
router.delete('/:id', requireAuth, activityController.remove);
router.post('/:id/cancelar', requireAuth, activityController.cancel);

console.log('activity.routes.js cargado');

export { router };
