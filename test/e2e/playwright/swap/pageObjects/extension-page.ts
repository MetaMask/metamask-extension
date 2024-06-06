import path from 'path';
import * as fs from 'fs';
import { type Page, chromium } from '@playwright/test';

const wait = (n: number) => new Promise((resolve) => setTimeout(resolve, n));

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

export class ChromeExtensionPage {
  private page!: Page;

  async initExtension() {
    const launchOptions = {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    };

    const context = await chromium.launchPersistentContext('', launchOptions);
    // let the extension load on the second tab of the browser
    await wait(2000);
    console.log(context);

    const filePath = 'dist/chrome/home.html';

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      console.log('File exists.');
    } else {
      console.log('File does not exist.');
    }
    const pages = context.pages();
    return pages[1]; // return the page object of the second tab
  }
}
