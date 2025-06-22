// middlewares/csrf.middleware.js
const csurf = require('csurf');

const csrfProtection = csurf({ cookie: true });

module.exports = csrfProtection;
