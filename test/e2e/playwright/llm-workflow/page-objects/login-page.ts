import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  private readonly forgotPasswordLink: Locator;

  private readonly passwordInput: Locator;

  private readonly unlockButton: Locator;

  private readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('[data-testid="unlock-password"]');
    this.unlockButton = page.locator('[data-testid="unlock-submit"]');
    this.welcomeMessage = page.locator('[data-testid="unlock-page-title"]');
    this.forgotPasswordLink = page.locator(
      '[data-testid="unlock-page-help-text"]',
    );
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async unlock(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.unlockButton.click();
  }

  async getWelcomeText(): Promise<string> {
    return (await this.welcomeMessage.textContent()) ?? '';
  }

  async isPasswordInputVisible(): Promise<boolean> {
    return await this.passwordInput.isVisible();
  }
}
