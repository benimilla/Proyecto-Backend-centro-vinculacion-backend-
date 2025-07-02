import express from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas...
router.get('/', auth, activityController.getAll);
router.post('/', auth, activityController.create);
router.get('/:id', auth, activityController.getById);
router.put('/:id', auth, activityController.update);
router.delete('/:id', auth, activityController.remove);
router.post('/:id/cancelar', auth, activityController.cancel);

console.log('activity.routes.js cargado');

export { router };
