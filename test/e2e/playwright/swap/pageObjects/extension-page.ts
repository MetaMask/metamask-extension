import path from 'path';
import { type Locator, type Page, chromium } from '@playwright/test';
import { wait } from '../helpers/utils';

const extensionPath = path.join(__dirname, '../../../../../dist/chrome');

export class ChromeExtensionPage {
  private page: Page;

  readonly devModeToggle: Locator;

  async goto() {
    await this.page.goto('chrome://extensions');
  }

  async setDevMode() {
    await this.page.locator('#devMode').click();
  }

  async getExtensionId(extensionName?: string): Promise<string | null> {
    if (extensionName) {
      const extensionId = await this.page.$eval(
        `div#card >> :scope:has-text("${extensionName}") >> #extension-id`,
        (el) => el.textContent?.substring(4),
      );

      return extensionId || null;
    }

    const extensionId = this.page.locator('#extension-id').first();
    const getTextId = await extensionId.innerText();
    const normalizeId = getTextId.split('ID: ')[1];

    return normalizeId || null;
  }

  async initExtension() {
    const launchOptions = {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    };
    if (process.env.HEADLESS === 'true') {
      launchOptions.args.push('--headless=new');
    }

    const context = await chromium.launchPersistentContext('', launchOptions);

    await wait(2000);

    return context.pages()[1];
  }

  async close() {
    await this.page.close();
  }
}
