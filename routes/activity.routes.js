// routes/activity.routes.js
const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', auth, activityController.getAllActivities);

router.post('/', auth, activityController.createActivity);

router.get('/:id', auth, activityController.getActivityById);

router.put('/:id', auth, activityController.updateActivity);

router.delete('/:id', auth, activityController.deleteActivity);

module.exports = router;
