import express from 'express';
import {
  listarPermisosUsuario,
  crearPermiso,
  eliminarPermiso,
  listarTodosLosPermisos
} from '../controllers/permissions.controller.js';

const router = express.Router();

// Listar todos los permisos del sistema
router.get('/', listarTodosLosPermisos);

// Listar permisos de un usuario
router.get('/:usuarioId', listarPermisosUsuario);

// Crear un nuevo permiso para un usuario
router.post('/', crearPermiso);

// Eliminar un permiso de usuario
router.delete('/:id', eliminarPermiso);

export { router };
