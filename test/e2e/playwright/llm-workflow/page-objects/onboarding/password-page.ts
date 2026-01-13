import type { Page } from '@playwright/test';

export class PasswordPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private readonly newPasswordInput =
    '[data-testid="create-password-new-input"]';

  private readonly confirmPasswordInput =
    '[data-testid="create-password-confirm-input"]';

  private readonly termsCheckbox = '[data-testid="create-password-terms"]';

  private readonly submitButton = '[data-testid="create-password-submit"]';

  async isLoaded(): Promise<boolean> {
    try {
      await this.page
        .locator(this.newPasswordInput)
        .waitFor({ timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async createPassword(password: string): Promise<void> {
    await this.page.locator(this.newPasswordInput).fill(password);
    await this.page.locator(this.confirmPasswordInput).fill(password);
    await this.page.locator(this.termsCheckbox).click();
    await this.page.locator(this.submitButton).click();
    await this.page
      .locator(this.submitButton)
      .waitFor({ state: 'hidden', timeout: 10000 });
  }
}
