// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requests por IP en 15 minutos
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
});

module.exports = limiter;
