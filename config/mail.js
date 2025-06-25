// config/mail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify()
  .then(() => console.log('Conexión con el servicio de correo verificada.'))
  .catch((err) => console.error(' Error en la conexión de correo:', err));

module.exports = transporter;