// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const permissions = require('../middlewares/permissions.middleware');

// Obtener todos los usuarios (requiere autenticación y rol admin)
router.get('/', auth, permissions('admin'), userController.getAll);

// Obtener usuario por id (requiere autenticación)
router.get('/:id', auth, userController.getById);

// Actualizar usuario por id (requiere autenticación)
router.put('/:id', auth, userController.update);

// Eliminar usuario por id (requiere autenticación y rol admin)
router.delete('/:id', auth, permissions('admin'), userController.remove);

module.exports = router;
