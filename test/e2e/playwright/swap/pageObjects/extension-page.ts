import path from 'path';
import { type Locator, type Page, chromium } from '@playwright/test';

const wait = (n) => new Promise((resolve) => setTimeout(resolve, n));

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

export class ChromeExtensionPage {
  private page: Page;

  async initExtension() {
    const launchOptions = {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    };

    const context = await chromium.launchPersistentContext('', launchOptions);
    // let the extension load on the second page on the browser
    await wait(2000);

    const pages = context.pages();
    return pages[1]; // return the second page
  }
}
