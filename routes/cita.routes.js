import express from 'express';
import * as citaController from '../controllers/cita.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

export const router = express.Router();

// Obtener todas las citas
router.get('/', auth, citaController.getAll);

// Obtener cita por ID
router.get('/:id', auth, citaController.getById);

// Crear nueva cita puntual
router.post('/', auth, citaController.create);

// Actualizar cita por ID
router.put('/:id', auth, citaController.update);

// Cancelar cita (motivo obligatorio)
router.put('/:id/cancelar', auth, citaController.cancel);

// Eliminar cita por ID
router.delete('/:id', auth, citaController.remove);

console.log('cita.routes.js cargado');
