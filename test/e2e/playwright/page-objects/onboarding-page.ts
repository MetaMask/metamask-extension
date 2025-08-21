import { type Locator, type Page, expect } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;

  readonly agreeButton: Locator;

  readonly agreePasswordTermsCheck: Locator;

  readonly checkBox: Locator;

  readonly completionDone: Locator;

  readonly confirmPasswordLabel: Locator;

  readonly continueButton: Locator;

  readonly createPasswordButton: Locator;

  readonly createPasswordLabel: Locator;

  readonly dialog: Locator;

  readonly getStartedBtn: Locator;

  readonly importWalletButton: Locator;

  readonly importWithSrpButton: Locator;

  readonly metametricsContinue: Locator;

  readonly qrContinue: Locator;

  readonly scrollControl: Locator;

  readonly termsCheckbox: Locator;

  readonly termsLabel: Locator;

  readonly textarea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agreeButton = page.locator(
      '[data-testid="terms-of-use-agree-button"], button:has-text("Agree"), button:has-text("I agree")',
    );
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
    this.dialog = page.getByRole('dialog');
    this.getStartedBtn = page.getByTestId('onboarding-get-started-button');
    this.importWalletButton = page.locator(
      'button:has-text("I have an existing wallet")',
    );
    this.importWithSrpButton = page.locator(
      'button:has-text("Import using Secret Recovery Phrase")',
    );
    this.metametricsContinue = page.locator(
      '[data-testid="metametrics-i-agree"], button:has-text("I agree")',
    );
    this.qrContinue = page.locator(
      '[data-testid="onboarding-download-app-continue"], [data-testid="onboarding-qr-continue"], button:has-text("Continue")',
    );
    this.scrollControl = page.locator(
      '[data-testid="terms-of-use-scroll-button"], [data-testid="terms-of-use-scroll"]',
    );
    this.termsCheckbox = page.locator(
      '[data-testid="onboarding-terms-checkbox"], #terms-of-use__checkbox, input[type="checkbox"]',
    );
    this.termsLabel = page.locator(
      'label[for="terms-of-use__checkbox"], [data-testid="onboarding-terms-checkbox"] + label',
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

  async clickGetStarted(): Promise<void> {
    await this.getStartedBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.getStartedBtn.click({ timeout: 3000 });
  }

  async clickMetric(): Promise<void> {
    await this.checkBox.first().uncheck({ force: true });
    await this.metametricsContinue.first().scrollIntoViewIfNeeded();
    await this.metametricsContinue.first().click();
  }

  async clickScrollAndAgreeTermsOfUse(): Promise<void> {
    await this.dialog.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.scrollControl.first().click();
    await this.checkBox.first().check({ force: true });
    const agree = this.agreeButton.first();
    await agree.waitFor({ state: 'visible', timeout: 15000 });
    await expect(agree).toBeEnabled({ timeout: 15000 });
    await agree.click();
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
