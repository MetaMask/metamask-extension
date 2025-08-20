import path from 'path';
import { chromium } from '@playwright/test';

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

export class ChromeExtensionPage {
  async initExtension() {
    const launchOptions = {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`],
    };
    if (process.env.HEADLESS === 'true') {
      launchOptions.args.push('--headless=new');
    }
    const context = await chromium.launchPersistentContext('', launchOptions);
    await context.waitForEvent('page');

    // Prefer the extension onboarding page if it opened automatically
    let page = context
      .pages()
      .find(
        (p) =>
          p.url().startsWith('chrome-extension://') &&
          p.url().includes('/home.html#onboarding/welcome'),
      );

    // Fallback: use the last tab if no extension tab found yet
    if (!page) {
      const pages = context.pages();
      page = pages[pages.length - 1];
    }

    // Close any about:blank tabs to avoid multiple windows
    for (const p of context.pages()) {
      if (p !== page && p.url() === 'about:blank') {
        try {
          await p.close();
        } catch {}
      }
    }

    await page.waitForSelector('[data-testid="onboarding-get-started-button"]');
    return page;
  }
}
