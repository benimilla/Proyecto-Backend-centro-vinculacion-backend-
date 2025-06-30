import express from 'express';
import { hasPermission } from '../middlewares/permissions.middleware.js';
import {
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  // importa los demás controladores que uses
} from '../controllers/user.controller.js';

const router = express.Router();

router.post('/usuarios', hasPermission('crear_usuario'), crearUsuario);
router.delete('/usuarios/:id', hasPermission('eliminar_usuario'), eliminarUsuario);
router.get('/usuarios', hasPermission('ver_usuarios'), listarUsuarios);

// exporta el router para usar en app.js u otro archivo
export { router };
