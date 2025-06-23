import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

// Registro y login
router.post('/register', register);
router.post('/login', login);

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export { router };