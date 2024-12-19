const contactUsSendMailTemplate = ({ name }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
              font-family: Arial, sans-serif;
              color: #333333;
              background-color: #f8f8f8;
              padding: 0;
              margin: 0;
          }
          .email-container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          h2 {
              color: #5C4033;
              font-size: 24px;
              margin-bottom: 10px;
          }
          p {
              font-size: 16px;
              line-height: 1.5;
          }
          .highlight {
              font-weight: bold;
              color: #A0522D;
          }
          .footer {
              font-size: 14px;
              color: #777777;
              text-align: center;
              margin-top: 20px;
          }
      </style>
  </head>
  <body>
      <div class="email-container">
        <h2>Hello ${name},</h2>
        <p>Thank you for reaching out to us. We have received your message and will get back to you shortly.</p>
        <p>Best regards,<br>Elevate My Skill Support Team</p>
      </div>
  </body>
  </html>
  `;

module.exports = contactUsSendMailTemplate;
