import csurf from 'csurf';


export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // sólo en producción
    maxAge: 60 * 60 * 1000, // 1 hora en milisegundos
  }
});