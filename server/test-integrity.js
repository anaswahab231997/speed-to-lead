/**
 * Speed-to-Lead Security & Endpoint Integrity Test Runner
 * Run: node test-integrity.js
 */
process.env.VERCEL = '1'; // Prevent index.js from auto-starting orchestrator & console.clear()
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('./index');

const TEST_PORT = 3188;
let server;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    return true;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
    return false;
  }
}

async function main() {
  await new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
  console.log(`\n======================================================`);
  console.log(` 🛡️  SPEED-TO-LEAD ENDPOINT INTEGRITY TEST SUITE`);
  console.log(` Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    const ok = await runTest(name, fn);
    if (ok) passed++;
  };

  // ─── SUITE 1: SENSITIVE ROUTES MUST REJECT UNAUTHENTICATED REQUESTS (401) ───
  console.log('--- Suite 1: Sensitive SaaS Route Protection (Expect 401) ---');
  
  const sensitiveEndpoints = [
    { method: 'GET', path: '/api/leads' },
    { method: 'GET', path: '/api/leads/+1999999999' },
    { method: 'POST', path: '/api/leads/+1999999999/qualify', body: {} },
    { method: 'POST', path: '/api/leads/+1999999999/dismiss', body: {} },
    { method: 'GET', path: '/api/inventory' },
    { method: 'GET', path: '/api/stats' },
    { method: 'GET', path: '/api/agents/status' },
    { method: 'POST', path: '/api/hermes/pulse', body: {} },
    { method: 'GET', path: '/api/auth/me' },
    { method: 'POST', path: '/api/dealers/credentials', body: { dealership_name: 'Audit' } },
    { method: 'POST', path: '/api/stripe/create-checkout-session', body: { priceId: 'p_1' } },
    { method: 'POST', path: '/stress-test', body: { count: 1 } },
    { method: 'POST', path: '/api/onboard/dealer', body: { dealerName: 'Test' } }
  ];

  for (const ep of sensitiveEndpoints) {
    await test(`${ep.method} ${ep.path} rejects unauthenticated request with 401`, async () => {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      if (res.status !== 401) {
        throw new Error(`Expected HTTP 401 but received HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success !== false) {
        throw new Error(`Expected success: false, got: ${JSON.stringify(data)}`);
      }
    });
  }

  // ─── SUITE 2: INVALID TOKEN MUST RETURN 400 ─────────────────────────────────
  console.log('\n--- Suite 2: Invalid Token Handling (Expect 400) ---');

  await test('GET /api/leads with bogus Bearer token returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      headers: { 'Authorization': 'Bearer bogus-invalid-jwt-token' }
    });
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 but received HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.error !== 'Invalid token.') {
      throw new Error(`Expected error: 'Invalid token.', got: ${JSON.stringify(data)}`);
    }
  });

  // ─── SUITE 3: VALID TOKEN MUST SUCCEED (200) ────────────────────────────────
  console.log('\n--- Suite 3: Valid Authenticated Token (Expect 200) ---');

  const validToken = jwt.sign({ id: 'dlr_admin', email: 'admin@showroom.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  await test('GET /api/leads with valid Bearer token returns 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 but received HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.success !== true || !Array.isArray(data.data)) {
      throw new Error(`Expected success: true with data array, got: ${JSON.stringify(data)}`);
    }
  });

  await test('GET /api/auth/me with valid Bearer token returns 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 but received HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.success !== true || data.dealer?.email !== 'admin@showroom.com') {
      throw new Error(`Expected dealer info with email admin@showroom.com, got: ${JSON.stringify(data)}`);
    }
  });

  // ─── SUITE 4: PUBLIC PORTFOLIO & LEGAL ENDPOINTS (ZERO DISRUPTION) ──────────
  console.log('\n--- Suite 4: Public Portfolio & Marketing Endpoints (Expect 200) ---');

  await test('GET / returns 200 HTML with brand identity', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Nexlify')) throw new Error('Response missing expected brand text');
  });

  await test('GET /meet-layla returns 200 HTML', async () => {
    const res = await fetch(`${BASE_URL}/meet-layla`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Layla')) throw new Error('Response missing expected Layla text');
  });

  await test('GET /terms returns 200 HTML', async () => {
    const res = await fetch(`${BASE_URL}/terms`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('GET /privacy returns 200 HTML', async () => {
    const res = await fetch(`${BASE_URL}/privacy`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('GET /dpa returns 200 HTML', async () => {
    const res = await fetch(`${BASE_URL}/dpa`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('GET /health returns 200 JSON with status ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Expected status: ok, got ${data.status}`);
  });

  // ─── SUITE 5: DECOMMISSIONED & MOVED SENSITIVE ASSETS (EXPECT 404) ───────────
  console.log('\n--- Suite 5: Decommissioned Legacy Routes & Relocated Files (Expect 404) ---');

  const legacyPaths = [
    '/ignite',
    '/schedule',
    '/dealer-pulse',
    '/dealer-pulse/index.html',
    '/reports/report_rmamotors.com_1778439867631.pdf',
    '/archive/legacy_agency/ignite.html',
    '/.vercel/project.json'
  ];

  for (const path of legacyPaths) {
    await test(`GET ${path} returns clean HTTP 404 (no leak)`, async () => {
      const res = await fetch(`${BASE_URL}${path}`);
      if (res.status !== 404) {
        throw new Error(`Expected HTTP 404 but received HTTP ${res.status}`);
      }
    });
  }

  console.log(`\n======================================================`);
  console.log(` SUMMARY: ${passed}/${total} Tests Passed`);
  console.log(`======================================================\n`);

  server.close(() => {
    process.exit(passed === total ? 0 : 1);
  });
}

main().catch((err) => {
  console.error('Test execution error:', err);
  if (server) server.close();
  process.exit(1);
});
