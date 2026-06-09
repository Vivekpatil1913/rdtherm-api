const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

/**
 * Send an email. If SMTP isn't configured (dev), the message is logged to the
 * console instead of failing — so password-reset flows are still testable.
 */
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.log(`\n[MAIL — dev, no SMTP configured]\nTo: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return { dev: true };
  }
  return t.sendMail({ from: env.smtp.from, to, subject, html, text });
}

module.exports = { sendMail };
