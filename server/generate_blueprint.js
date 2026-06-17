const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #000000;
            --text-main: #ffffff;
            --text-muted: #888888;
            --emerald: #6ee7b7; /* Emerald 300 */
            --red: #ef4444;    /* Stark Red */
            --border: #333333;
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Plus Jakarta Sans', sans-serif;
            margin: 0;
            padding: 40px;
            box-sizing: border-box;
            width: 8.5in;
            height: 11in;
        }
        h1, h2, h3, h4 {
            font-family: 'Outfit', sans-serif;
            margin-top: 0;
        }
        .header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.5;
            margin: 0;
        }
        .grid {
            display: flex;
            gap: 30px;
            margin-bottom: 30px;
        }
        .col {
            flex: 1;
            padding: 20px;
            border-radius: 8px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
        }
        .col h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: var(--text-main);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .col p {
            font-size: 13px;
            line-height: 1.6;
            color: #cccccc;
        }
        .bad { color: var(--red); font-weight: 600; }
        .good { color: var(--emerald); font-weight: 600; }
        
        ul { padding-left: 20px; margin-top: 10px; }
        li { font-size: 13px; margin-bottom: 10px; line-height: 1.5; color: #cccccc; }
        
        .matrix {
            margin-bottom: 30px;
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
        }
        .matrix-header {
            background: rgba(255,255,255,0.05);
            padding: 15px 20px;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 16px;
            border-bottom: 1px solid var(--border);
        }
        .matrix-body {
            display: flex;
        }
        .matrix-col {
            flex: 1;
            padding: 20px;
        }
        .matrix-col:first-child {
            border-right: 1px solid var(--border);
        }
        .matrix-col h4 {
            font-size: 16px;
            margin-bottom: 15px;
        }
        .matrix-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .matrix-list li {
            font-size: 13px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .matrix-list li:last-child {
            border-bottom: none;
        }
        
        .footer-cta {
            text-align: center;
            padding: 30px 20px;
            background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%);
            border: 1px solid var(--border);
            border-radius: 8px;
        }
        .footer-cta p {
            font-size: 14px;
            margin-bottom: 15px;
            color: #dddddd;
            line-height: 1.5;
        }
        .footer-cta strong {
            color: var(--emerald);
        }
        .link {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: var(--text-main);
            text-decoration: none;
            border-bottom: 2px solid var(--emerald);
            padding-bottom: 2px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Steal Our Architecture: The 2026 Autonomous Blueprint</h1>
        <p>How high-ticket service businesses are firing traditional SEO agencies and deploying <span class="good">$16/day AI systems</span> to intercept leads, qualify clients, and book calendars 24/7.</p>
    </div>

    <div class="grid">
        <div class="col" style="border-top: 3px solid var(--red);">
            <h3>The Current State: "The After-Hours Bleed"</h3>
            <p>Traditional web architecture is economically broken. You are paying an agency a $2,000/month retainer to drive high-intent traffic to a static, asynchronous "Contact Us" form.</p>
            <p>The mathematics are catastrophic: 85% of high-ticket leads arrive outside of standard operating hours. A <span class="bad">24-hour response delay</span> drops conversion probability by 400%, causing your most expensive leads to <span class="bad">bounce directly to faster competitors</span>. You are bleeding out and subsidizing your competition.</p>
        </div>

        <div class="col" style="border-top: 3px solid var(--emerald);">
            <h3>The Solution: "The Autonomous Intervention"</h3>
            <p>Ainexlify Architecture replaces static forms with cognitive infrastructure. "Layla"—our custom-trained LLM—sits at the edge of your website, intercepting traffic at the exact moment of highest intent.</p>
            <ul>
                <li><span class="good">Instant Interception (0ms Latency):</span> The system engages immediately upon lead generation, replacing asynchronous forms with synchronous, human-parity dialogue.</li>
                <li><strong>Dynamic Triage:</strong> The model runs programmatic logic to qualify budget, diagnose symptoms, and filter out low-intent noise.</li>
                <li><strong>Direct Calendar Injection:</strong> Pre-qualified leads are directly scheduled into your existing CRM routing. No human intervention required.</li>
            </ul>
        </div>
    </div>

    <div class="matrix">
        <div class="matrix-header">The Economic Asymmetry (The ROI Matrix)</div>
        <div class="matrix-body">
            <div class="matrix-col">
                <h4>The Traditional Model</h4>
                <ul class="matrix-list">
                    <li><strong>Capital Exp:</strong> $5,000 Upfront Build</li>
                    <li><strong>Operating Exp:</strong> $2,000/mo Retainer + Human Receptionist ($4,000/mo)</li>
                    <li><strong>Constraint:</strong> Expensive, highly latent, <span class="bad">offline at 5:00 PM</span>.</li>
                </ul>
            </div>
            <div class="matrix-col">
                <h4>The Autonomous Model</h4>
                <ul class="matrix-list">
                    <li><strong>Capital Exp:</strong> $1,497 System Setup</li>
                    <li><strong>Operating Exp:</strong> <span class="good">$497/mo Retainer</span></li>
                    <li><strong>Constraint:</strong> None. <span class="good">Zero latency</span>, infinitely scalable, and never sleeps.</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="footer-cta">
        <p>Your traffic is bleeding out. Do not restructure your marketing budget until you patch the conversion leak at the bottom of the funnel. Book an architecture audit with us. We will map the exact nodes where your leads are dropping and engineer the autonomous intervention.</p>
        <p><strong>Secure Your Node:</strong></p>
        <a href="https://ainexlifyagencies.com/schedule" class="link">ainexlifyagencies.com/schedule</a>
    </div>

</body>
</html>
`;

async function generatePDF() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set content and wait until network is idle so web fonts load
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Ensure assets dir exists
  const assetsDir = path.join(__dirname, 'agency-public', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  const pdfPath = path.join(assetsDir, 'The_2026_Autonomous_Blueprint.pdf');
  
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  
  console.log('✅ Generated PDF at', pdfPath);
  await browser.close();
}

generatePDF().catch(console.error);
