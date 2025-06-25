import express from 'express';
import * as citaController from '../controllers/cita.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', auth, citaController.getAll);
router.post('/', auth, citaController.create);
router.get('/:id', auth, citaController.getById);
router.put('/:id', auth, citaController.update);
router.delete('/:id', auth, citaController.remove);

console.log('cita.routes.js cargado');
export { router };
