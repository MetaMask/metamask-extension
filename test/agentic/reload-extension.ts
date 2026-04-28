/**
 * reload-extension.ts — Reloads the MetaMask extension via CDP.
 * Usage: npx tsx reload-extension.ts [--cdp-port 6668]
 */
import { chromium } from '@playwright/test';
import { resolveExtensionId } from '@metamask/client-mcp-core';

async function main() {
  const portArg = process.argv.indexOf('--cdp-port');
  const port = portArg >= 0 ? parseInt(process.argv[portArg + 1], 10) : 6668;

  const browser = await chromium.connectOverCDP(`http://localhost:${port}`);
  const ctx = browser.contexts()[0];
  if (!ctx) {
    console.error('No browser context found');
    process.exit(1);
  }

  const log = {
    info: (m: string) => console.log(m),
    warn: (m: string) => console.warn(m),
  };

  const extId = await resolveExtensionId({ context: ctx, log });
  if (!extId) {
    console.error('Could not resolve extension ID');
    process.exit(1);
  }
  console.log('Extension ID:', extId);

  // Find background service worker page
  const swPages = ctx.serviceWorkers();
  console.log('Service workers:', swPages.map((sw) => sw.url()));

  // Try to reload via background service worker
  const swPage = swPages.find((sw) => sw.url().includes(extId));
  if (swPage) {
    await swPage.evaluate(() => chrome.runtime.reload());
    console.log('Reload triggered via service worker');
  } else {
    // Fallback: navigate to the extension page and reload from there
    const extPages = ctx.pages().filter((p) => p.url().startsWith(`chrome-extension://${extId}`));
    console.log('Extension pages:', extPages.map((p) => p.url()));
    if (extPages.length > 0) {
      await extPages[0].evaluate(() => chrome.runtime.reload());
      console.log('Reload triggered via extension page');
    } else {
      console.error('No extension page or service worker found to reload from');
      process.exit(1);
    }
  }

  await browser.close();
  console.log('Done. Extension reloading...');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
