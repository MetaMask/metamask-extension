import path from 'path';
import { chromium, BrowserContext, Page } from '@playwright/test';

const extensionPath = path.join(__dirname, '../../../../dist/chrome');

export async function launchExtensionContext(): Promise<BrowserContext> {
  const launchOptions = {
    headless: process.env.HEADLESS === 'true',
    channel: 'chrome' as const,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  };

  return chromium.launchPersistentContext('', launchOptions);
}

export async function getExtensionPage(context: BrowserContext): Promise<Page> {
  await context.waitForEvent('page', { timeout: 30000 });

  let extensionPage = context
    .pages()
    .find((page) => page.url().startsWith('chrome-extension://') || page.url().startsWith('moz-extension://'));

  const start = Date.now();
  while (!extensionPage && Date.now() - start < 10000) {
    await new Promise((r) => setTimeout(r, 200));
    extensionPage = context
      .pages()
      .find((page) => page.url().startsWith('chrome-extension://') || page.url().startsWith('moz-extension://'));
  }

  if (!extensionPage) {
    const pages = context.pages();
    extensionPage = pages[pages.length - 1];
  }

  // Close extra tabs
  for (const page of context.pages()) {
    if (page !== extensionPage) {
      try {
        const url = page.url();
        if (
          url === 'about:blank' ||
          url.startsWith('chrome://') ||
          url.startsWith('edge://') ||
          (url.startsWith('moz-extension://') === false && url.startsWith('chrome-extension://') === false)
        ) {
          await page.close({ runBeforeUnload: true });
        }
      } catch {}
    }
  }

  await extensionPage.bringToFront();
  return extensionPage;
}

