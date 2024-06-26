import { type Locator, type Page } from '@playwright/test';

export class SaturnCustodianPage {
  readonly page: Page;

  readonly devModeToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.devModeToggle = page.locator(
      'text=Developer mode This setting is managed by your administrator. >> #bar',
    );
  }

  async goto() {
    // await this.page.goto('https://saturn-custody.codefi.network/')
  }

  async setDevMode() {
    await this.devModeToggle.click();
  }

  async getExtensionId(extensionName: string) {
    return await this.page.$eval(
      `div#card >> :scope:has-text("${extensionName}") >> #extension-id`,
      (el) => el.textContent?.substring(4),
    );
  }

  async close() {
    await this.page.close();
  }
}
