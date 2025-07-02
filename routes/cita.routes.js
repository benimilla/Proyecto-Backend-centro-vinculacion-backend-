import express from 'express';
import * as citaController from '../controllers/cita.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

export const router = express.Router();

router.use(auth);

router.get('/', citaController.getAllCitas);
router.get('/:id', citaController.getByIdCita);
router.post('/', citaController.createCita);
router.put('/:id', citaController.updateCita);
router.patch('/:id/cancelar', citaController.cancelCita);
router.delete('/:id', citaController.removeCita);

console.log('cita.routes.js cargado');
