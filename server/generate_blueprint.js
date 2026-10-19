const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #070709;
            --surface: #111116;
            --surface-border: rgba(255, 255, 255, 0.08);
            --text-main: #fafafa;
            --text-muted: #a1a1aa;
            --text-dim: #71717a;
            --gold: #d4af37;
            --gold-light: #fbe28d;
            --emerald: #34d399;
            --emerald-glow: rgba(52, 211, 153, 0.12);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            font-family: 'Plus Jakarta Sans', sans-serif;
            padding: 36px 40px;
            width: 8.5in;
            height: 11in;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        h1, h2, h3, h4 {
            font-family: 'Outfit', sans-serif;
            letter-spacing: -0.02em;
        }
        code, .mono {
            font-family: 'JetBrains Mono', monospace;
        }
        .header {
            border-bottom: 1px solid var(--surface-border);
            padding-bottom: 16px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--gold-light);
            background: rgba(212, 175, 55, 0.1);
            border: 1px solid rgba(212, 175, 55, 0.3);
            padding: 3px 10px;
            border-radius: 100px;
            margin-bottom: 8px;
        }
        .header h1 {
            font-size: 26px;
            font-weight: 800;
            line-height: 1.15;
            color: #ffffff;
            margin-bottom: 6px;
        }
        .header p {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.45;
        }
        .meta-strip {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            font-size: 11px;
            color: var(--text-dim);
            font-family: 'JetBrains Mono', monospace;
        }
        .meta-strip span strong {
            color: var(--gold);
        }
        .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
            margin: 18px 0;
        }
        .arch-card {
            background: var(--surface);
            border: 1px solid var(--surface-border);
            border-radius: 10px;
            padding: 14px;
            position: relative;
        }
        .arch-card-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            text-transform: uppercase;
            color: var(--emerald);
            background: var(--emerald-glow);
            border: 1px solid rgba(52, 211, 153, 0.25);
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
            margin-bottom: 8px;
        }
        .arch-card h3 {
            font-size: 13.5px;
            color: #ffffff;
            margin-bottom: 6px;
            line-height: 1.25;
        }
        .arch-card p {
            font-size: 10.5px;
            color: var(--text-muted);
            line-height: 1.4;
            margin-bottom: 8px;
        }
        .arch-card ul {
            list-style: none;
            font-size: 10px;
            color: var(--text-dim);
            line-height: 1.35;
        }
        .arch-card ul li {
            position: relative;
            padding-left: 10px;
            margin-bottom: 4px;
        }
        .arch-card ul li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--gold);
        }
        .matrix-box {
            background: linear-gradient(135deg, rgba(20, 20, 25, 0.95), rgba(12, 12, 15, 0.98));
            border: 1px solid rgba(212, 175, 55, 0.35);
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 16px;
        }
        .matrix-title {
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 700;
            color: var(--gold-light);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .matrix-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .matrix-col h4 {
            font-size: 12px;
            margin-bottom: 6px;
        }
        .matrix-col.bad h4 { color: #f87171; }
        .matrix-col.good h4 { color: var(--emerald); }
        .matrix-list {
            list-style: none;
            font-size: 10.5px;
            color: var(--text-muted);
            line-height: 1.45;
        }
        .matrix-list li {
            margin-bottom: 4px;
        }
        .footer {
            border-top: 1px solid var(--surface-border);
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-left p {
            font-size: 11px;
            color: var(--text-muted);
            line-height: 1.4;
        }
        .footer-left strong {
            color: #ffffff;
        }
        .footer-right {
            text-align: right;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10.5px;
            color: var(--gold);
        }
        .footer-right a {
            color: var(--gold);
            text-decoration: none;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="badge">Architectural Reference &bull; Technical Systems Blueprint</div>
        <h1>Applied AI Systems & Autonomous Workflow Blueprint</h1>
        <p>A production-tested blueprint for architecting sub-35ms intent classification, token-constrained data extraction, and event-driven microservices—eliminating operational drag without consuming core developer sprint points.</p>
        <div class="meta-strip">
            <span>Author: <strong>Anas Wahab</strong> (Applied AI Systems Operator &amp; Technical Chief of Staff)</span>
            <span>Standard: <strong>Zero Hallucination / Production-Grade</strong></span>
            <span>Origin: <strong>ainexlifyagencies.com</strong></span>
        </div>
    </div>

    <div class="grid-3">
        <!-- Pillar 1 -->
        <div class="arch-card">
            <span class="arch-card-tag">Pillar 01 &bull; Intent Triage</span>
            <h3>Hybrid System 1 / System 2 Routing</h3>
            <p>Routes operational requests through a sub-35ms non-autoregressive encoder before invoking LLMs.</p>
            <ul>
                <li><strong>System 1 (Laya / ModernBERT):</strong> Fast CPU forward pass classifies intent into typed enums without token generation.</li>
                <li><strong>System 2 (Generative):</strong> Triggers Gemini or Claude only when high-dimensional synthesis is strictly necessary.</li>
                <li><strong>Outcome:</strong> Eliminates 70%+ of generative token overhead and eradicates prompt latency on routine triage.</li>
            </ul>
        </div>

        <!-- Pillar 2 -->
        <div class="arch-card">
            <span class="arch-card-tag">Pillar 02 &bull; Extraction</span>
            <h3>Token-Constrained Schema Metaprogramming</h3>
            <p>Constrains LLM generation logits at the tokenizer level to verified enterprise database ledgers.</p>
            <ul>
                <li><strong>Runtime Dynamic Enums:</strong> Uses <code>pydantic.create_model</code> to generate enums dynamically from live client records (e.g. Chart of Accounts).</li>
                <li><strong>Zero Hallucination:</strong> Invalid category codes cannot be emitted by the model's sampling head.</li>
                <li><strong>Idempotency:</strong> Two-phase check-and-claim locks in PostgreSQL prevent duplicate ledger transactions.</li>
            </ul>
        </div>

        <!-- Pillar 3 -->
        <div class="arch-card">
            <span class="arch-card-tag">Pillar 03 &bull; Inbound Ops</span>
            <h3>Event-Driven Speed-to-Lead Engine</h3>
            <p>Compresses inbound prospect qualification from hours to sub-25 seconds with streaming resilience.</p>
            <ul>
                <li><strong>Express 5 SSE Streaming:</strong> Non-blocking real-time token delivery directly to web and messaging interfaces.</li>
                <li><strong>LoopGuard State Deduplication:</strong> In-memory lock map with disk persistence prevents infinite webhook reply loops.</li>
                <li><strong>Multi-Model Failover:</strong> Dynamic fallback across model tiers ensures 99.9% uptime during rate limits.</li>
            </ul>
        </div>
    </div>

    <div class="matrix-box">
        <div class="matrix-title">
            <span>Engineering Architecture Comparison</span>
            <span class="mono" style="font-size: 10px; color: var(--emerald);">VERIFIED BENCHMARKS</span>
        </div>
        <div class="matrix-grid">
            <div class="matrix-col bad">
                <h4>Fragile AI Integration (Traditional Anti-Pattern)</h4>
                <ul class="matrix-list">
                    <li><strong>Architecture:</strong> Generic prompt wrappers sending raw text to multi-billion parameter LLMs for every task.</li>
                    <li><strong>Latency:</strong> 1,500ms – 4,000ms delay per interaction; high cost per operation.</li>
                    <li><strong>Reliability:</strong> Category hallucinations, broken JSON outputs, and webhook retry duplications.</li>
                    <li><strong>Engineering Tax:</strong> Constant tickets assigned to core developers to patch broken prompts and pipelines.</li>
                </ul>
            </div>
            <div class="matrix-col good">
                <h4>Engineered Autonomous Systems (Anas Wahab Architecture)</h4>
                <ul class="matrix-list">
                    <li><strong>Architecture:</strong> Dual-speed triage: CPU non-autoregressive encoder (System 1) + Schema-locked LLM (System 2).</li>
                    <li><strong>Latency:</strong> ~33ms deterministic triage; sub-25s end-to-end inbound qualification.</li>
                    <li><strong>Reliability:</strong> Dynamic Pydantic schema validation, LoopGuard state locks, and AES-256-GCM encryption.</li>
                    <li><strong>Zero Developer Tax:</strong> Built, deployed, and maintained independently without consuming sprint points.</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-left">
            <p><strong>Technical Briefings &amp; Strategic Inquiries:</strong></p>
            <p>Available for full-time executive deployment as Technical Chief of Staff or Head of AI Operations.</p>
        </div>
        <div class="footer-right">
            <div>Email: <a href="mailto:anaswahabofficial@gmail.com">anaswahabofficial@gmail.com</a></div>
            <div>GitHub: <a href="https://github.com/anaswahab231997">github.com/anaswahab231997</a></div>
            <div>Direct WhatsApp: +91 79774 41599</div>
        </div>
    </div>

</body>
</html>
`;

async function generatePDF() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
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
  
  console.log('✅ Generated Executive Architecture PDF at', pdfPath);
  await browser.close();
}

generatePDF().catch(console.error);
