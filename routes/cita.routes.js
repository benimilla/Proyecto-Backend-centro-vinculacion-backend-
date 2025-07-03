import { Router } from 'express';
import {
  getAllCitas,
  createCita,
  updateCita,
  removeCita,
  cancelCita,
} from '../controllers/cita.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener todas las citas
router.get('/', getAllCitas);

// Crear una nueva cita
router.post('/', createCita);

// Actualizar una cita
router.put('/:id', updateCita);

// Eliminar una cita
router.delete('/:id', removeCita);

// Cancelar una cita (marcar como "cancelada")
router.patch('/:id/cancelar', cancelCita);

export { router }; 
