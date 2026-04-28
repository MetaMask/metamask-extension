/**
 * fix-extension-tabs.ts — Navigates a crashed extension tab back to home.html.
 * Run this after extension reload to get the extension back into a working state.
 */
import { chromium } from '@playwright/test';

const EXT_ID = 'hebhblbkkdabgoldnojllkipeoacjioc';

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:6668');
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error('No context'); process.exit(1); }

  const pages = ctx.pages();
  console.log('Pages:', pages.map((p) => p.url()));

  // Find an error or blank page to navigate (avoid chrome:// pages)
  const errorPage = pages.find((p) =>
    p.url() === 'chrome-error://chromewebdata/' ||
    p.url() === 'about:blank',
  );

  if (!errorPage) {
    console.log('No error page to fix, checking for existing extension page...');
    const extPage = pages.find((p) => p.url().startsWith(`chrome-extension://${EXT_ID}`));
    if (extPage) {
      console.log('Extension page already present:', extPage.url());
    } else {
      console.log('No fixable page found. All pages:', pages.map((p) => p.url()));
    }
    await browser.close();
    return;
  }

  console.log('Navigating error page to extension home...');
  // Use waitUntil: 'commit' to just get the navigation started without waiting for full load
  try {
    await errorPage.goto(`chrome-extension://${EXT_ID}/home.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    console.log('Navigated to:', errorPage.url());
  } catch (e) {
    console.error('Navigation failed:', e instanceof Error ? e.message : e);
    // Try evaluate to navigate
    try {
      await errorPage.evaluate((url) => { window.location.href = url; }, `chrome-extension://${EXT_ID}/home.html`);
      console.log('Navigation triggered via evaluate');
    } catch (e2) {
      console.error('Evaluate also failed:', e2 instanceof Error ? e2.message : e2);
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
