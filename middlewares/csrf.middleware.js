// middlewares/csrf.middleware.js
import csurf from 'csurf';

export const csrfProtection = csurf({ cookie: true });