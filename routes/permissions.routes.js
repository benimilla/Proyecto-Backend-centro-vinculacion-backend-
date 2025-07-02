// routes/permissionsRoutes.js
import express from 'express';
import {
  listarPermisosUsuario,
  crearPermiso,
  eliminarPermiso,
  listarTodosLosPermisos
} from '../controllers/permissions.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { hasPermission } from '../middlewares/permissions.middleware.js';

const router = express.Router();

router.get('/', auth, hasPermission('asignar_permisos'), listarTodosLosPermisos);
router.get('/:usuarioId', auth, hasPermission('asignar_permisos'), listarPermisosUsuario);
router.post('/', auth, hasPermission('asignar_permisos'), crearPermiso);
router.delete('/:id', auth, hasPermission('asignar_permisos'), eliminarPermiso);

export { router };
