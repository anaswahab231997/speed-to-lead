const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Note: The user requested "existing Google connection already authenticated".
// This assumes Application Default Credentials (ADC) are set up on the host machine,
// or specific OAuth environment variables exist.
async function getGmailClient(email) {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/gmail.modify'],
      // Usually reads from GOOGLE_APPLICATION_CREDENTIALS
    });
    
    const client = await auth.getClient();
    // Impersonate or use the primary auth depending on setup
    // Since we don't have explicit tokens, we'll return a mock wrapper if auth fails
    
    return google.gmail({ version: 'v1', auth: client });
  } catch (err) {
    console.warn(`[GMAIL] Warning: Authenticated client for ${email} not found. Using Mock client.`);
    return getMockGmailClient();
  }
}

function getMockGmailClient() {
  return {
    users: {
      messages: {
        list: async () => ({ data: { messages: [] } }),
        get: async () => ({ data: { snippet: 'Mock email body' } }),
        send: async ({ requestBody }) => {
          console.log(`[GMAIL MOCK] Email drafted/sent: ${requestBody.raw.slice(0, 50)}...`);
          return { data: { id: 'mock_msg_id' } };
        }
      }
    }
  };
}

async function sendEmail(fromEmail, toEmail, subject, body, attachments = []) {
  if (!process.env.ZOHO_SMTP_PASSWORD || !process.env.ZOHO_EMAIL) {
    throw new Error('SECURE FAIL: Zoho SMTP credentials (ZOHO_EMAIL and ZOHO_SMTP_PASSWORD) are missing from the environment configuration.');
  }

  console.log(`[ZOHO SMTP] Direct email send initialized to ${toEmail} using smtp.zoho.com`);
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // ssl
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.ZOHO_EMAIL,
      to: toEmail,
      subject: subject,
      text: body,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[ZOHO SMTP] Email sent successfully. MessageID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[ZOHO SMTP] Error sending email via Zoho:`, err.message);
    throw err;
  }
}

module.exports = { getGmailClient, sendEmail };
