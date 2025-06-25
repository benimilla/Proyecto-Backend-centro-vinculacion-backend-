// routes/appointment.routes.js
import express from 'express';
import { getAll, create, update, remove } from '../controllers/appointment.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', auth, getAll);
router.post('/', auth, create);
router.get('/:id', auth, (req, res) => res.status(501).json({ error: 'No implementado' }));
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

export { router }; // 👈 también exportación nombrada
