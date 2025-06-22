// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    validate,
  ],
  authController.login
);

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    validate,
  ],
  authController.register
);

module.exports = router;
