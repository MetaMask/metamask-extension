import { Locator, Page, expect } from '@playwright/test';

export class SrpImportPage {
  private readonly page: Page;
  private readonly textarea: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textarea = page.locator('[data-testid="srp-import__srp-note"], form textarea, textarea[rows]');
    this.continueButton = page.locator('[data-testid="srp-import__continue"], button:has-text("Continue")');
  }

  async pasteSrp(phrase: string): Promise<void> {
    await this.textarea.first().waitFor({ state: 'visible', timeout: 15000 });
    const ta = this.textarea.first();
    await ta.click();
    await this.page.keyboard.press('Meta+a');
    await this.page.keyboard.press('Delete');
    await this.page.keyboard.type(phrase, { delay: 20 });
    await this.continueButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.continueButton.first()).toBeEnabled({ timeout: 15000 });
    await this.continueButton.first().click();
  }
}

