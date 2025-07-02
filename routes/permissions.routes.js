import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { hasPermission } from '../middlewares/permissions.middleware.js';
import {
  listarPermisosUsuario,
  crearPermiso,
  eliminarPermiso,
} from '../controllers/permissions.controller.js';

const router = express.Router();

// Listar permisos de un usuario (requiere estar autenticado y permiso 'ver_permisos')
router.get('/:usuarioId', auth, hasPermission('ver_permisos'), listarPermisosUsuario);

// Crear permiso (requiere permiso 'asignar_permisos')
router.post('/', auth, hasPermission('asignar_permisos'), crearPermiso);

// Eliminar permiso (requiere permiso 'eliminar_permisos')
router.delete('/:id', auth, hasPermission('eliminar_permisos'), eliminarPermiso);

export { router };
