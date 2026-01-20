import path from 'path';
import type { Page } from '@playwright/test';

export type ExtensionReadinessDeps = {
  page: Page;
  screenshotDir: string;
  log: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
};

export async function waitForExtensionUiReady(
  deps: ExtensionReadinessDeps,
  timeout = 30000,
): Promise<void> {
  const { page, screenshotDir, log } = deps;
  const selectors = [
    '[data-testid="unlock-password"]',
    '[data-testid="onboarding-create-wallet"]',
    '[data-testid="onboarding-import-wallet"]',
    '[data-testid="account-menu-icon"]',
    '[data-testid="get-started"]',
    '[data-testid="onboarding-terms-checkbox"]',
    '[data-testid="onboarding-privacy-policy"]',
  ];

  try {
    await Promise.race(
      selectors.map((selector) => page.waitForSelector(selector, { timeout })),
    );
    log.info('Extension UI is ready');
  } catch {
    const currentUrl = page.url();
    const screenshotPath = path.join(
      screenshotDir,
      `ui-ready-failure-${Date.now()}.png`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log.error(`Debug screenshot saved: ${screenshotPath}`);

    throw new Error(
      `Extension UI did not reach expected state within ${timeout}ms. ` +
        `Current URL: ${currentUrl}. ` +
        'Expected one of: unlock page, onboarding page, or home page. ' +
        `Debug screenshot saved to: ${screenshotPath}`,
    );
  }
}
