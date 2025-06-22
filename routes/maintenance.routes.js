// routes/maintenance.routes.js
const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const auth = require('../middlewares/auth.middleware');
const permissions = require('../middlewares/permissions.middleware');

router.get('/', auth, maintenanceController.getAllMaintenances);

router.post('/', auth, permissions('admin'), maintenanceController.createMaintenance);

router.get('/:id', auth, maintenanceController.getMaintenanceById);

router.put('/:id', auth, permissions('admin'), maintenanceController.updateMaintenance);

router.delete('/:id', auth, permissions('admin'), maintenanceController.deleteMaintenance);

module.exports = router;
