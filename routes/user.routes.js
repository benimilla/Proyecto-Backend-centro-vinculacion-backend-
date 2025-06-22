// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const permissions = require('../middlewares/permissions.middleware');

router.get('/', auth, permissions('admin'), userController.getAllUsers);

router.get('/:id', auth, userController.getUserById);

router.put('/:id', auth, userController.updateUser);

router.delete('/:id', auth, permissions('admin'), userController.deleteUser);

module.exports = router;
