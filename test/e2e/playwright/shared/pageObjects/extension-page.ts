import path from 'path';
import { chromium } from '@playwright/test';
import { getBooleanFlag } from '../../../../../shared/lib/common-utils';

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

export class ChromeExtensionPage {
  async initExtension() {
    const launchOptions = {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`],
    };
    if (getBooleanFlag(process.env.HEADLESS)) {
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
