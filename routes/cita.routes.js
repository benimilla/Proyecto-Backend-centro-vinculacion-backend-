import express from 'express';
import * as citaController from '../controllers/cita.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

export const router = express.Router();

// Obtener todas las citas
router.get('/', auth, citaController.obtenerCitas);

// Obtener cita por ID
router.get('/:id', auth, citaController.obtenerCitaPorId);

// Crear nueva cita
router.post('/', auth, citaController.crearCita);

// Actualizar cita por ID
router.put('/:id', auth, citaController.actualizarCita);

// Cancelar cita (proporcionando motivo)
router.put('/:id/cancelar', auth, citaController.cancelarCita);

// Eliminar cita por ID
router.delete('/:id', auth, citaController.eliminarCita);

console.log('cita.routes.js cargado');
