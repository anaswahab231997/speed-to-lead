const puppeteer = require('puppeteer');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            width: 1200px;
            height: 630px;
            background: #060608;
            color: #fafafa;
            font-family: 'Plus Jakarta Sans', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 56px 64px;
            position: relative;
            overflow: hidden;
        }
        .ambient-1 {
            position: absolute;
            top: -100px;
            left: -100px;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
            filter: blur(60px);
        }
        .ambient-2 {
            position: absolute;
            bottom: -100px;
            right: -100px;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(52, 211, 153, 0.12) 0%, transparent 70%);
            filter: blur(60px);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 10;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
        }
        .brand span {
            color: #d4af37;
            font-weight: 400;
        }
        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(52, 211, 153, 0.1);
            border: 1px solid rgba(52, 211, 153, 0.3);
            padding: 6px 14px;
            border-radius: 100px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: #34d399;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #34d399;
            box-shadow: 0 0 10px #34d399;
        }
        .main-content {
            position: relative;
            z-index: 10;
        }
        .badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            color: #d4af37;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 12px;
        }
        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 56px;
            font-weight: 900;
            line-height: 1.08;
            letter-spacing: -0.03em;
            color: #ffffff;
            margin-bottom: 14px;
        }
        .title-gold {
            background: linear-gradient(135deg, #fbe28d, #d4af37, #aa820a);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            font-size: 19px;
            color: #a1a1aa;
            line-height: 1.45;
            max-width: 900px;
        }
        .footer-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            padding-top: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            position: relative;
            z-index: 10;
        }
        .footer-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 10px;
            padding: 12px 14px;
        }
        .card-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: #d4af37;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .card-val {
            font-size: 13px;
            font-weight: 600;
            color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="ambient-1"></div>
    <div class="ambient-2"></div>

    <div class="header">
        <div class="brand">
            ANAS WAHAB <span>/ APPLIED AI SYSTEMS</span>
        </div>
        <div class="status-pill">
            <span class="status-dot"></span>
            Zero Sprint Tax &bull; Production Systems
        </div>
    </div>

    <div class="main-content">
        <div class="badge">Technical Systems Dossier &bull; Architectural Reality</div>
        <h1>Anas Wahab<br><span class="title-gold">Applied AI Systems Operator & Technical CoS</span></h1>
        <p>Bridging commercial strategy, e-commerce supply chains, and autonomous systems execution. Upstream security contributor to BerriAI/litellm.</p>
    </div>

    <div class="footer-grid">
        <div class="footer-card">
            <div class="card-tag">SYSTEM 01</div>
            <div class="card-val">Dynamic Pydantic Enums (HMRC MTD)</div>
        </div>
        <div class="footer-card">
            <div class="card-tag">SYSTEM 02</div>
            <div class="card-val">Sub-25s SSE Microservice (Express 5)</div>
        </div>
        <div class="footer-card">
            <div class="card-tag">OPEN SOURCE</div>
            <div class="card-val">LiteLLM PR #42490 (OAuth Isolation)</div>
        </div>
        <div class="footer-card">
            <div class="card-tag">COMMERCIAL OPS</div>
            <div class="card-val">Shopify Ops (Cashmerean) & 22% CAC Cut</div>
        </div>
    </div>
</body>
</html>
`;

async function generateOG() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const outputPath = path.join(__dirname, 'agency-public', 'og-image.jpg');
    await page.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
    console.log('✅ Generated professional og-image.jpg at', outputPath);
    await browser.close();
}

generateOG().catch(console.error);
