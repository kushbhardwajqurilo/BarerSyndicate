const nodemailer = require("nodemailer");
const Transprter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.AppMail,
    pass: process.env.AppPassword,
  },
});

async function sentMail(to, subject, text, html) {
  const info = await Transprter.sendMail({
    from: "",
    to,
    subject,
    text,
    html,
  });
  return info.accepted.length !== 0 ? true : false;
}

module.exports = sentMail;
