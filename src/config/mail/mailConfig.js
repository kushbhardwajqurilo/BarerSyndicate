const nodemailer = require("nodemailer");
const Transprter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.AppMail,
    pass: process.env.AppPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function SentMail(to, subject, text, html) {
  try {
    const info = await Transprter.sendMail({
      from: `"Barber Syndicate" <${process.env.AppMail}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Mail Sent Config:", info.messageId);
    return true;
  } catch (error) {
    console.log("'Mail Config Error:", error);
    return false;
  }
}

module.exports = SentMail;
