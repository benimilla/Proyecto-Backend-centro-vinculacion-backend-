// utils/mailer.js
const nodemailer = require('nodemailer');
const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: Number(MAIL_PORT),
  secure: MAIL_PORT == 465, // true para puerto 465
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

async function sendMail({ to, subject, text, html }) {
  const mailOptions = {
    from: MAIL_USER,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };
