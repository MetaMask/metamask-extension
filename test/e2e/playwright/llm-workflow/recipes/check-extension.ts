import { chromium } from '@playwright/test';
import { resolveExtensionId } from '@metamask/client-mcp-core';

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:6668');
  const ctx = browser.contexts()[0];
  if (!ctx) { console.log('No context'); process.exit(1); }

  const pages = ctx.pages();
  console.log('Pages:', pages.map((p) => p.url()));

  const extId = await resolveExtensionId({
    context: ctx,
    log: { info: (m: string) => console.log(m), warn: (m: string) => console.warn(m) },
  });
  console.log('Extension ID:', extId);

  if (extId) {
    let extPage = pages.find((p) => p.url().startsWith(`chrome-extension://${extId}`));
    if (!extPage) {
      extPage = await ctx.newPage();
      await extPage.goto(`chrome-extension://${extId}/home.html`);
      await extPage.waitForLoadState('domcontentloaded');
    }

    console.log('Extension URL:', extPage.url());

    // Check if perps tab is visible
    const perpsTabEl = await extPage.$('[data-testid="account-overview__perps-tab"]');
    console.log('Perps tab visible:', perpsTabEl !== null);

    // Check all visible tabs
    const allTabs = await extPage.$$eval('[data-testid^="account-overview__"]', (els) =>
      els.map((el) => el.getAttribute('data-testid')),
    );
    console.log('Account overview tabs:', allTabs);

    // Get feature flags from localStorage
    const flags = await extPage.evaluate(() => {
      const result: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.toLowerCase().includes('perp') || key.toLowerCase().includes('feature') || key.toLowerCase().includes('flag'))) {
          result[key] = localStorage.getItem(key);
        }
      }
      return result;
    });
    console.log('Relevant localStorage flags:', JSON.stringify(flags, null, 2));

    // Check metamaskrc / env vars baked into the build
    const buildInfo = await extPage.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      return {
        METAMASK_BUILD_TYPE: win['METAMASK_BUILD_TYPE'] ?? 'not set',
        MM_PERPS_ENABLED: win['MM_PERPS_ENABLED'] ?? 'not set',
        PERPS_ENABLED: win['PERPS_ENABLED'] ?? 'not set',
      };
    });
    console.log('Build globals:', JSON.stringify(buildInfo, null, 2));

    // Take a screenshot
    await extPage.screenshot({ path: 'test-artifacts/screenshots/check-perps.png' });
    console.log('Screenshot saved to test-artifacts/screenshots/check-perps.png');
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
