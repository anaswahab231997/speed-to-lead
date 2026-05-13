# 🚀 AI Nexlify Agencies — Speed To Lead™ Platform

Speed To Lead™ is an enterprise-grade autonomous customer acquisition and closing engine built for high-ticket automotive dealerships. The engine engages web leads within 4 seconds flat, qualifications through conversational intelligence, inventory matching, and reserves showroom appointments cleanly.

---

## 🛰️ System & Product Hierarchy
*   **The Company:** **AI Nexlify Agencies** (Your B2B AI consultancy).
*   **The Product:** **Speed To Lead™** (The live autonomous pipeline and Layla's conversational closer brain).
*   **The App:** **Nexlify OS** (The premium dealer-facing management and analytics dashboard).

---

## ⚙️ Required Production Environment Variables
To transition this platform onto any live cloud server hosting provider (Render, Railway, Heroku, AWS, etc.), you must copy and configure the following credentials into your host’s **Environment Variable Dashboard**:

### 🧠 1. Anthropic AI Brain Core
*   `CLAUDE_API_KEY`: The production API key for your Claude intelligence models. Must support `'claude-sonnet-4-6'`.

### 📞 2. Twilio Communications Gateway
*   `TWILIO_ACCOUNT_SID`: Your main Twilio Account SID.
*   `TWILIO_AUTH_TOKEN`: Your private Twilio Auth Token.

### 📊 3. Airtable CRM Persistence
*   `AIRTABLE_API_KEY`: The personal access token (PAT) representing your Airtable integration.
*   `AIRTABLE_BASE_ID`: The unique ID of the Airtable workspace base.
*   `AIRTABLE_TABLE_NAME`: Name of the tables (e.g. `Leads`, `Inventory`).

### 🌐 4. Host Configurations
*   `PORT`: Bind dynamically. Leaving this undefined defaults local test server to `3001` or lets the host inject its dynamic server port automatically.

---

## 📦 Cloud Bootstrap & Launch Trigger
The root `package.json` contains a clean script framework that routes boot configurations into the server directory automatically:

```bash
# 1. Install all dependencies inside the server container
npm run install-all

# 2. Boot the live production server
npm start
```

---

## 🔒 Security Guarantee
All confidential system variables are strictly ignored and prevented from entering public Git streams via active `.gitignore` guards. 

***Created by Chief Systems Architect at AI Nexlify Agencies. All Rights Secured.***
