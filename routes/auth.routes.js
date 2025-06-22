import express from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = express.Router();

// Aquí definimos los endpoints concretos que luego usamos en app.js
router.post('/register', register);
router.post('/login', login);

export { router };