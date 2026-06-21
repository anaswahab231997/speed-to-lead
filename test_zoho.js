require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
const nodemailer = require('nodemailer');

async function testZoho() {
  console.log("Testing Zoho SMTP Connection...");
  
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.zoho.com';

  if (!user || !pass) {
    console.error("ERROR: SMTP_USER or SMTP_PASS is missing in your local server/.env file.");
    return;
  }

  console.log(`Using Host: ${host}`);
  console.log(`Using User: ${user}`);
  
  const transporter = nodemailer.createTransport({
    host: host,
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SUCCESS: Zoho SMTP authenticated successfully!");
    console.log("Your credentials are correct. If Vercel still fails, ensure these exact variables are in Vercel's Environment Settings.");
  } catch (error) {
    console.error("❌ FAILED to authenticate with Zoho:");
    console.error(error.message);
    
    console.log("\n--- ZOHO TROUBLESHOOTING ---");
    console.log("1. App Password: If you have 2FA enabled, you MUST use an App Password, not your login password.");
    console.log("2. SMTP Access: Go to Zoho Mail Settings -> Mail Accounts -> IMAP Access and ensure it is checked/enabled.");
    console.log("3. Regional Host: If your Zoho account is in the EU or IN, your host might be smtp.zoho.eu or smtp.zoho.in.");
  }
}

testZoho();
