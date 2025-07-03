import express from 'express';
import * as citaController from '../controllers/cita.controller.js';

export const router = express.Router();

router.get('/', citaController.getAllCitas);
router.post('/', citaController.createCita);
router.put('/:id', citaController.updateCita);
router.delete('/:id', citaController.removeCita);
router.patch('/:id/cancelar', citaController.cancelCita);

console.log('cita.routes.js cargado');
