const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const urls = [
  { url: 'https://gosur-development-secure.netlify.app/', name: 'gosur-full.webp' },
  { url: 'https://stratum-foundation.vercel.app/', name: 'stratum-full.webp' },
  { url: 'https://lucky-concrete-ghost-build.vercel.app/', name: 'lucky-full.webp' },
  { url: 'https://maxwood-kitchen.vercel.app/', name: 'maxwood-full.webp' }
];

const outputDir = path.join(__dirname, 'agency-public', 'assets', 'portfolio');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const { url, name } of urls) {
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      // wait a bit extra for fonts/images to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const outPath = path.join(outputDir, name);
      console.log(`Capturing ${outPath}...`);
      await page.screenshot({ path: outPath, fullPage: true, type: 'webp', quality: 80 });
      console.log(`Saved ${name}`);
    } catch (err) {
      console.error(`Failed to capture ${url}:`, err);
    }
  }

  await browser.close();
  console.log('Capture complete.');
})();
