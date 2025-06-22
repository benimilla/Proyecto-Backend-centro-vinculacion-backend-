// routes/activity.routes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, activityController.getAll);
router.post('/', auth, activityController.create);
router.get('/:id', auth, activityController.getById);
router.put('/:id', auth, activityController.update);
router.delete('/:id', auth, activityController.remove);

module.exports = router;
