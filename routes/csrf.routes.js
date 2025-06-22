import express from 'express';
import { csrfProtection } from '../middlewares/csrf.middleware.js';

const router = express.Router();

router.get('/token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

export { router };