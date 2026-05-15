require('dotenv').config();
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const workerName = 'gemini-relay';

const workerCode = `
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = "https://generativelanguage.googleapis.com" + url.pathname + url.search;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    return fetch(modifiedRequest);
  },
};
`;

async function deployWorker() {
  console.log(`🚀 [CLOUDFLARE] Initiating Sovereign Deployment of ${workerName}...`);

  try {
    // 1. Upload the worker script
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`;
    
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/javascript+module'
      },
      body: workerCode
    });

    if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);
    console.log(`✅ [CLOUDFLARE] Worker script uploaded successfully.`);

    // 2. Enable the workers.dev subdomain for this script
    const subdomainUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}/subdomain`;
    
    const subRes = await fetch(subdomainUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled: true })
    });

    if (!subRes.ok) throw new Error(`Subdomain enable failed: ${await subRes.text()}`);

    // 3. Get the workers.dev domain
    const accountSettingsUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/subdomain`;
    const settingsRes = await fetch(accountSettingsUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!settingsRes.ok) throw new Error(`Fetch subdomain failed: ${await settingsRes.text()}`);
    const settingsData = await settingsRes.json();

    const subdomain = settingsData.result.subdomain;
    const relayUrl = `https://${workerName}.${subdomain}.workers.dev`;

    console.log(`\n🎉 [DEPLOYMENT SUCCESS]`);
    console.log(`🔗 GEMINI_RELAY_URL: ${relayUrl}`);
    
    return relayUrl;

  } catch (err) {
    console.error(`❌ [DEPLOYMENT FAILED]`, err.message);
    process.exit(1);
  }
}

deployWorker();
