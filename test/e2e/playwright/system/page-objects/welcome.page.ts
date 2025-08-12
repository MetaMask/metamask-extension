import { Locator, Page, expect } from '@playwright/test';

export class WelcomePage {
  private readonly page: Page;
  private readonly getStartedButton: Locator;
  private readonly importWalletButton: Locator;
  private readonly importWithSrpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.getStartedButton = page.locator('[data-testid="onboarding-get-started-button"], [data-testid="onboarding-get-started"], button:has-text("Get started"), button:has-text("Get Started")');
    this.importWalletButton = page.locator('[data-testid="onboarding-import-wallet"], button:has-text("I have an existing wallet"), button:has-text("Import an existing wallet")');
    this.importWithSrpButton = page.locator('[data-testid="onboarding-import-with-recovery-phrase"], button:has-text("Import using Secret Recovery Phrase")');
  }

  async clickGetStarted(): Promise<void> {
    await this.getStartedButton.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.getStartedButton.first().click();
  }

  async chooseImportWallet(): Promise<void> {
    await this.importWalletButton.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.importWalletButton.first().click();
    await this.importWithSrpButton.first().click({ timeout: 10000 }).catch(() => {});
  }
}

