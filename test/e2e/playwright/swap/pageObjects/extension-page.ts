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
    await context.newPage();
    await context.waitForEvent('page');
    const pages = context.pages();
    return pages[pages.length - 1]; // return last tab
  }
}
