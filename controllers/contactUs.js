const nodemailer = require("nodemailer");
const mailSender = require("../utils/mailSender");
const contactUsReceiveMailTemplate = require("../mail/templates/ContactUsReceiveMailTemplate");
const contactUsSendMailTemplate = require("../mail/templates/ContactUsSendMailTemplate");

exports.receiveContactMail = async (req, res) => {
  const { name, email, phoneno, message } = req.body;

  try {
    // Use the mailSender utility to send the contact form details to the receiving email
    await mailSender(
      "help@elevatemyskill.online",
      `New Contact Form Submission`,
      contactUsReceiveMailTemplate({ name, email, phoneno, message })
    );

    // Successfully sent email
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    // Failed to send email
    return res.status(500).json({ message: "Failed to send email" });
  }
};

exports.sendContactMailResponse = async (req, res) => {
  const { name, email } = req.body;

  try {
    await mailSender(
      email,
      "Thank you for contacting Elevate My Skill",
      contactUsSendMailTemplate({ name })
    );

    // Successfully sent response email
    return res
      .status(200)
      .json({ message: "Response email sent successfully" });
  } catch (error) {
    console.error("Error sending response email:", error.message);
    // Failed to send response email
    return res.status(500).json({ message: "Failed to send response email" });
  }
};
