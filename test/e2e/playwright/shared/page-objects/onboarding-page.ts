import { type Locator, type Page, expect } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;

  readonly agreePasswordTermsCheck: Locator;

  readonly checkBox: Locator;

  readonly completionDone: Locator;

  readonly confirmPasswordLabel: Locator;

  readonly continueButton: Locator;

  readonly createPasswordButton: Locator;

  readonly createPasswordLabel: Locator;

  readonly importWalletButton: Locator;

  readonly importWithSrpButton: Locator;

  readonly metametricsContinue: Locator;

  readonly qrContinue: Locator;

  readonly textarea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agreePasswordTermsCheck = page.getByTestId('create-password-terms');
    this.checkBox = page.getByRole('checkbox');
    this.completionDone = page.locator(
      '[data-testid="onboarding-complete-done"], [data-testid="onboarding-completion-done"], button:has-text("Done")',
    );
    this.confirmPasswordLabel = page.getByLabel(/Confirm password/iu);
    this.continueButton = page.locator(
      '[data-testid="srp-import__continue"], button:has-text("Continue")',
    );
    this.createPasswordButton = page.locator(
      'button:has-text("Create password")',
    );
    this.createPasswordLabel = page.getByLabel(/Create new password/iu);
    this.importWalletButton = page.locator(
      '[data-testid="onboarding-import-wallet"], button:has-text("I have an existing wallet")',
    );
    this.importWithSrpButton = page.locator(
      '[data-testid="onboarding-import-srp"], button:has-text("Import using Secret Recovery Phrase")',
    );
    this.metametricsContinue = page.locator(
      '[data-testid="metametrics-i-agree"], button:has-text("I agree")',
    );
    this.qrContinue = page.locator(
      '[data-testid="onboarding-download-app-continue"], [data-testid="onboarding-qr-continue"], button:has-text("Continue")',
    );
    this.textarea = page.locator(
      '[data-testid="srp-import__srp-note"], form textarea, textarea[rows]',
    );
  }

  async assertWalletVisible(): Promise<void> {
    await expect(this.page.getByTestId('account-menu-icon')).toBeVisible();
  }

  async clickCompletion(): Promise<void> {
    await this.completionDone.first().scrollIntoViewIfNeeded();
    await this.completionDone.first().click({ timeout: 2000 });
  }

  async clickContinue(): Promise<void> {
    await this.qrContinue.first().scrollIntoViewIfNeeded();
    await this.qrContinue.first().click({ timeout: 2000 });
  }

  async clickMetric(): Promise<void> {
    await this.checkBox.first().uncheck({ force: true });
    await this.metametricsContinue.first().scrollIntoViewIfNeeded();
    await this.metametricsContinue.first().click();
  }

  async createPassword(password: string): Promise<void> {
    await this.createPasswordLabel.fill(password);
    await this.confirmPasswordLabel.fill(password);
    await this.agreePasswordTermsCheck.click();
    await this.createPasswordButton.click();
  }

  async importExistingWallet(): Promise<void> {
    await this.importWalletButton
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });
    await this.importWalletButton.first().click();
    await this.importWithSrpButton.first().click({ timeout: 10000 });
  }

  async pasteSrp(phrase: string): Promise<void> {
    await this.textarea.first().waitFor({ state: 'visible', timeout: 15000 });
    const ta = this.textarea.first();
    await ta.click();
    await this.page.keyboard.press('Meta+a');
    await this.page.keyboard.press('Delete');
    await this.page.keyboard.type(phrase, { delay: 20 });
    await this.continueButton
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.continueButton.first()).toBeEnabled({ timeout: 15000 });
    await this.continueButton.first().click();
  }

  async startTracing(title: string) {
    const ctx = this.page.context();
    await ctx.tracing.startChunk({ title });
  }

  async stopTracing() {
    const ctx = this.page.context();
    await ctx.tracing.stopChunk();
  }
}
