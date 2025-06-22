// routes/maintenance.routes.js
const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const auth = require('../middlewares/auth.middleware');  // si quieres proteger las rutas

router.get('/', auth, maintenanceController.getAll);
router.get('/:id', auth, maintenanceController.getById);
router.post('/', auth, maintenanceController.create);
router.put('/:id', auth, maintenanceController.update);
router.delete('/:id', auth, maintenanceController.remove);

module.exports = router;
