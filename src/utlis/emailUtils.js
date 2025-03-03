const nodemailer = require("nodemailer");

const sendResetPasswordEmail = async (email, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-email-password",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Password Reset Request",
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };
