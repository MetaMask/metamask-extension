import { type Locator, type Page } from '@playwright/test';

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

  constructor(page: Page) {
    this.page = page;
    this.getStartedBtn = page.locator('button:has-text("Get started")');
    this.createWalletBtn = page.getByTestId('onboarding-create-wallet');
    this.importWalletBtn = page.locator(
      'button:has-text("Import an existing wallet")',
    );
    this.confirmSecretBtn = page.locator(
      'button:has-text("Confirm Secret Recovery Phrase")',
    );
    this.metametricsBtn = page.getByTestId('metametrics-no-thanks');
    this.agreeBtn = page.locator('button:has-text("I agree")');
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
  }

  async importWallet() {
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

  async createWallet() {
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
}
