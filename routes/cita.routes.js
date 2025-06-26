import express from 'express';
import * as citaController from '../controllers/cita.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

export const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener todas las citas
router.get('/', citaController.getAllCitas);

// Obtener cita por ID
router.get('/:id', citaController.getByIdCita);

// Crear una nueva cita (puntual o periódica)
router.post('/', citaController.createCita);

// Actualizar una cita
router.put('/:id', citaController.updateCita);

// Cancelar cita (requiere motivo)
router.patch('/:id/cancelar', citaController.cancelCita);

// Eliminar cita
router.delete('/:id', citaController.removeCita);

console.log('cita.routes.js cargado');
