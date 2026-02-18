import path from 'path';
import { chromium, firefox } from '@playwright/test';
import { setupFirefoxPolicies } from '../firefox-policies';

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

/**
 * Chrome extension page helper (launchPersistentContext with load-extension).
 */
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
    await context.newPage();
    await context.waitForEvent('page');
    const pages = context.pages();
    const page = pages[pages.length - 1]; // return last tab
    await page.waitForSelector('text=/I agree to MetaMask/');
    return page;
  }
}

/**
 * Firefox extension page helper using enterprise policies.
 * Uses PLAYWRIGHT_FIREFOX_POLICIES_JSON so the extension is force-installed.
 * @see https://github.com/microsoft/playwright/issues/7297#issuecomment-3333317209
 */
export class FirefoxExtensionPage {
  async initExtension() {
    setupFirefoxPolicies();

    const browser = await firefox.launch({
      headless: process.env.HEADLESS === 'true',
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('about:debugging#/runtime/this-firefox');
    await page.waitForSelector('text=MetaMask', { timeout: 15000 });

    const uuidLink = await page.locator('a[href^="moz-extension://"]').first();
    const href = await uuidLink.getAttribute('href');
    const match = href?.match(/^moz-extension:\/\/([a-f0-9-]+)/);
    if (!match) {
      throw new Error('Could not get MetaMask extension UUID from about:debugging');
    }
    const extensionUuid = match[1];

    const extensionOrigin = `moz-extension://${extensionUuid}`;
    await page.goto(`${extensionOrigin}/notification.html`);
    await page.waitForSelector('text=/I agree to MetaMask/', { timeout: 15000 });
    return page;
  }
}
