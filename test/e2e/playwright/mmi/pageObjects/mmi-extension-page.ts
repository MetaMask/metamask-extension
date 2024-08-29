import { type Locator, type Page } from '@playwright/test';

export class ChromeExtensionPage {
  readonly page: Page;

  readonly devModeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.devModeToggle = page.locator('#devMode');
  }

  async goto() {
    await this.page.goto('chrome://extensions');
  }

  async setDevMode() {
    await this.devModeToggle.click();
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

  async initExtension(): Promise<string | null> {
    await this.goto();
    await this.setDevMode();
    const extensionId = await this.getExtensionId();
    await this.close();

    return extensionId;
  }

  async close() {
    await this.page.close();
  }
}
