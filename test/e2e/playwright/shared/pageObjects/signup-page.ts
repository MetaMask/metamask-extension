import { type Locator, type Page, expect } from '@playwright/test';

const SEED_PHRASE =
  'ancient cloth onion decline gloom air scare addict action exhaust neck auto';
const ACCOUNT_PASSWORD = '123123123';

export class SignUpPage {
  readonly page: Page;

  readonly getStartedBtn: Locator;

  readonly importWalletBtn: Locator;

  readonly createWalletBtn: Locator;

  readonly metametricsBtn: Locator;

  readonly confirmSecretBtn: Locator;

  readonly agreeBtn: Locator;

  readonly noThanksBtn: Locator;

  readonly passwordTxt: Locator;

  readonly passwordConfirmTxt: Locator;

  readonly createPasswordBtn: Locator;

  readonly agreeCheck: Locator;

  readonly agreeTandCCheck: Locator;

  readonly agreePasswordTermsCheck: Locator;

  readonly importBtn: Locator;

  readonly doneBtn: Locator;

  readonly gotItBtn: Locator;

  readonly enableBtn: Locator;

  readonly secureWalletBtn: Locator;

  readonly skipBackupBtn: Locator;

  readonly skipSrpBackupBtn: Locator;

  readonly popOverBtn: Locator;

  readonly termsCheckbox: Locator;

  readonly termsLabel: Locator;

  readonly dialog: Locator;

  readonly scrollControl: Locator;

  readonly agreeButton: Locator;

  readonly importWithSrpButton: Locator;

  readonly importWalletButton: Locator;

  readonly textarea: Locator;

  readonly continueButton: Locator;

  readonly checkBox: Locator;

  readonly completionDone: Locator;

  readonly qrContinue: Locator;

  readonly metametricsContinue: Locator;

  readonly createPasswordButton: Locator;

  readonly createPasswordLabel: Locator;

  readonly confirmPasswordLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.getStartedBtn = page.getByTestId('onboarding-get-started-button');
    this.createWalletBtn = page.getByTestId('onboarding-create-wallet');
    this.importWalletBtn = page.locator(
      'button:has-text("Import an existing wallet")',
    );
    this.confirmSecretBtn = page.locator(
      'button:has-text("Confirm Secret Recovery Phrase")',
    );
    this.importWithSrpButton = page.locator(
      'button:has-text("Import using Secret Recovery Phrase")',
    );
    this.importWalletButton = page.locator(
      'button:has-text("I have an existing wallet")',
    );
    this.textarea = page.locator(
      '[data-testid="srp-import__srp-note"], form textarea, textarea[rows]',
    );
    this.continueButton = page.locator(
      '[data-testid="srp-import__continue"], button:has-text("Continue")',
    );
    this.termsCheckbox = page.locator(
      '[data-testid="onboarding-terms-checkbox"], #terms-of-use__checkbox, input[type="checkbox"]',
    );
    this.termsLabel = page.locator(
      'label[for="terms-of-use__checkbox"], [data-testid="onboarding-terms-checkbox"] + label',
    );
    this.scrollControl = page.locator(
      '[data-testid="terms-of-use-scroll-button"], [data-testid="terms-of-use-scroll"]',
    );
    this.agreeButton = page.locator(
      '[data-testid="terms-of-use-agree-button"], button:has-text("Agree"), button:has-text("I agree")',
    );
    this.createPasswordButton = page.locator(
      'button:has-text("Create password")',
    );
    this.createPasswordLabel = page.getByLabel(/Create new password/iu);
    this.confirmPasswordLabel = page.getByLabel(/Confirm password/iu);
    this.metametricsBtn = page.getByTestId('metametrics-no-thanks');
    this.createPasswordBtn = page.getByTestId('create-password-wallet');
    this.noThanksBtn = page.locator('button:has-text("No thanks")');
    this.passwordTxt = page.getByTestId('create-password-new');
    this.passwordConfirmTxt = page.getByTestId('create-password-confirm');
    this.agreeCheck = page.getByTestId('create-new-vault__terms-checkbox');
    this.agreeTandCCheck = page.getByTestId('onboarding-terms-checkbox');
    this.agreePasswordTermsCheck = page.getByTestId('create-password-terms');
    this.secureWalletBtn = page.getByTestId('secure-wallet-later');
    this.skipBackupBtn = page.getByTestId('skip-srp-backup-checkbox');
    this.skipSrpBackupBtn = page.getByTestId('skip-srp-backup');
    this.importBtn = page.getByTestId('create-password-import');
    this.doneBtn = page.getByTestId('pin-extension-done');
    this.gotItBtn = page.getByTestId('onboarding-complete-done');
    this.agreeBtn = page.locator('button:has-text("I agree")');
    this.enableBtn = page.locator('button:has-text("Enable")');
    this.popOverBtn = page.getByTestId('popover-close');
    this.checkBox = page.getByRole('checkbox');
    this.completionDone = page.locator(
      '[data-testid="onboarding-complete-done"], [data-testid="onboarding-completion-done"], button:has-text("Done")',
    );
    this.qrContinue = page.locator(
      '[data-testid="onboarding-download-app-continue"], [data-testid="onboarding-qr-continue"], button:has-text("Continue")',
    );
    this.metametricsContinue = page.locator(
      '[data-testid="metametrics-i-agree"], button:has-text("I agree")',
    );
  }

  async createPassword(password: string): Promise<void> {
    await this.createPasswordLabel.fill(password);
    await this.confirmPasswordLabel.fill(password);
    await this.agreePasswordTermsCheck.click();
    await this.createPasswordButton.click();
  }

  async clickGetStarted(): Promise<void> {
    await this.getStartedBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.getStartedBtn.click({ timeout: 3000 });
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

  async importWallet(): Promise<void> {
    await this.agreeTandCCheck.click();
    await this.importWalletBtn.click();
    await this.agreeBtn.click();

    const seeds = SEED_PHRASE?.trim().split(/\s+/u);
    for (const [index, element] of (seeds as string[]).entries()) {
      await this.page
        .locator(`data-testid=import-srp__srp-word-${index}`)
        .fill(element);
    }
    await this.confirmSecretBtn.click();
    await this.passwordTxt.fill(ACCOUNT_PASSWORD as string);
    await this.passwordConfirmTxt.fill(ACCOUNT_PASSWORD as string);
    await this.agreePasswordTermsCheck.click();
    await this.importBtn.click();
    await this.gotItBtn.click();
    await this.doneBtn.click();
  }

  async createWallet(): Promise<void> {
    await this.agreeTandCCheck.click();
    await this.createWalletBtn.click();
    await this.metametricsBtn.click();
    await this.passwordTxt.fill(ACCOUNT_PASSWORD as string);
    await this.passwordConfirmTxt.fill(ACCOUNT_PASSWORD as string);
    await this.agreePasswordTermsCheck.click();
    await this.createPasswordBtn.click();
    await this.secureWalletBtn.click();
    await this.skipBackupBtn.click();
    await this.skipSrpBackupBtn.click();
    await this.gotItBtn.click();
    await this.doneBtn.click();
    await this.popOverBtn.click();
  }

  async clickContinue(): Promise<void> {
    await this.qrContinue.first().scrollIntoViewIfNeeded();
    await this.qrContinue.first().click({ timeout: 2000 });
  }

  async clickCompletion(): Promise<void> {
    await this.completionDone.first().scrollIntoViewIfNeeded();
    await this.completionDone.first().click({ timeout: 2000 });
  }

  async clickMetric(): Promise<void> {
    await this.checkBox.first().uncheck({ force: true });
    await this.metametricsContinue.first().scrollIntoViewIfNeeded();
    await this.metametricsContinue.first().click();
  }

  async assertWalletVisible(): Promise<void> {
    await expect(this.page.getByTestId('account-menu-icon')).toBeVisible();
  }
}
