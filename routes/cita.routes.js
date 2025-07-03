import express from 'express';
import * as citaController from '../controllers/cita.controller.js';

export const router = express.Router();

router.get('/', citaController.getAllCitas);
router.get('/:id', async (req, res) => {
  // Por si quieres agregar la función getById (no la tienes aún, te la dejo aquí para completar)
  // Si no la usas, puedes eliminar esta ruta
  try {
    const { id } = req.params;
    const cita = await prisma.cita.findUnique({ where: { id: parseInt(id) } });
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la cita' });
  }
});

router.post('/', citaController.createCita);
router.put('/:id', citaController.updateCita);
router.patch('/:id/cancelar', citaController.cancelCita);
router.delete('/:id', citaController.removeCita);

console.log('cita.routes.js cargado');
