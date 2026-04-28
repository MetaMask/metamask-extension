import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:6668');
  const ctx = browser.contexts()[0];
  if (!ctx) { process.exit(1); }

  const pages = ctx.pages();
  console.log(`Pages (${pages.length}):`);
  for (const page of pages) {
    let jsUrl = 'unknown';
    try {
      jsUrl = await page.evaluate(() => window.location.href);
    } catch (e) {
      jsUrl = `evaluate failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    console.log(`  playwright url: ${page.url()}`);
    console.log(`  js url:         ${jsUrl}`);
    console.log();
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
