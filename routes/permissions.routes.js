// routes/permissionsRoutes.js
import express from 'express';
import {
  listarPermisosUsuario,
  crearPermiso,
  eliminarPermiso,
  listarTodosLosPermisos
} from '../controllers/permissions.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { hasPermission } from '../middlewares/permissions.middleware.js';

const router = express.Router();

router.get('/', requireAuth, hasPermission('asignar_permisos'), listarTodosLosPermisos);
router.get('/:usuarioId', requireAuth, hasPermission('asignar_permisos'), listarPermisosUsuario);
router.post('/', requireAuth, hasPermission('asignar_permisos'), crearPermiso);
router.delete('/:id', requireAuth, hasPermission('asignar_permisos'), eliminarPermiso);

export { router };
