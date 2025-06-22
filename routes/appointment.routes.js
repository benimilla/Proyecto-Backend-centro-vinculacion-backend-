// routes/appointment.routes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, appointmentController.getAllAppointments);

router.post('/', auth, appointmentController.createAppointment);

router.get('/:id', auth, appointmentController.getAppointmentById);

router.put('/:id', auth, appointmentController.updateAppointment);

router.delete('/:id', auth, appointmentController.deleteAppointment);

module.exports = router;
