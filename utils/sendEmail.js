const nodeMailer = require("nodemailer");
const {
  SMPT_SERVICE,
  SMPT_HOST,
  SMPT_PORT,
  SMPT_MAIL,
  SMPT_PASSWORD,
} = require("../constant");

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    service: process.env.SMPT_SERVICE || SMPT_SERVICE,
    host: process.env.SMPT_HOST || SMPT_HOST,
    port: process.env.SMPT_PORT || SMPT_PORT,
    secure: true,
    auth: {
      user: process.env.SMPT_MAIL || SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD || SMPT_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
