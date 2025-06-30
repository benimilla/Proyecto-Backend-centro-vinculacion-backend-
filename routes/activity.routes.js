import express from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

export const router = express.Router();

// Obtener todas las actividades
router.get('/', auth, activityController.getAll);

// Crear nueva actividad
router.post('/', auth, activityController.create);

// Obtener actividad por ID
router.get('/:id', auth, activityController.getById);

// Actualizar actividad por ID
router.put('/:id', auth, activityController.update);

// Eliminar actividad por ID
router.delete('/:id', auth, activityController.remove);

// Cancelar actividad (proporcionando motivo)
router.post('/:id/cancelar', auth, activityController.cancel);

console.log('activity.routes.js cargado');
