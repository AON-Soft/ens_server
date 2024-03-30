const nodeMailer = require("nodemailer");
const {
  // SMPT_SERVICE,
  SMPT_HOST,
  SMPT_PORT,
  SMPT_MAIL,
  SMPT_PASSWORD,
} = require("../constant");

const sendEmail = async (options) => {
  const transporter = nodeMailer.createTransport({
    // service: process.env.SMPT_SERVICE || SMPT_SERVICE, // Will need if use google/yahoo etc
    host: process.env.SMPT_HOST || SMPT_HOST,
    port: process.env.SMPT_PORT || SMPT_PORT,
    secure: true,
    auth: {
      user: process.env.SMPT_MAIL || SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD || SMPT_PASSWORD,
    },
  });

   // HTML email template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333;
        }
        p {
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${options.subject}</h1>
        <p>Hello, ${options.name}</p>
        ${options.message}
        <p><strong>${options.otp}</strong></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>Ensellers Team</p>
      </div>
    </body>
    </html>
  `;

 const mailOptions = {
    from: `Ensellers.com <${process.env.SMPT_MAIL || SMPT_MAIL}>`,
    to: options.email,
    subject: options.subject,
    html: htmlTemplate,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
