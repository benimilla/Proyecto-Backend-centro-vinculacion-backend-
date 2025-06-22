// routes/appointment.routes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, appointmentController.getAll);

router.post('/', auth, appointmentController.create);

router.get('/:id', auth, (req, res) => {
  res.status(501).json({ error: "getAppointmentById no implementado" });
  // O implementa la función si la necesitas
});

router.put('/:id', auth, appointmentController.update);

router.delete('/:id', auth, appointmentController.remove);

module.exports = router;
