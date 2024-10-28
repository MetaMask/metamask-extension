import { type Locator, type Page } from '@playwright/test';

const SEED_PHRASE =
  'ancient cloth onion decline gloom air scare addict action exhaust neck auto';
const ACCOUNT_PASSWORD = '123123123';

export class SignUpPage {
  readonly page: Page;

  readonly getStartedBtn: Locator;

  readonly importWalletBtn: Locator;

  readonly confirmSecretBtn: Locator;

  readonly agreeBtn: Locator;

  readonly noThanksBtn: Locator;

  readonly passwordTxt: Locator;

  readonly passwordConfirmTxt: Locator;

  readonly agreeCheck: Locator;

  readonly agreeTandCCheck: Locator;

  readonly agreePasswordTermsCheck: Locator;

  readonly importBtn: Locator;

  readonly doneBtn: Locator;

  readonly gotItBtn: Locator;

  readonly nextBtn: Locator;

  readonly enableButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.getStartedBtn = page.locator('button:has-text("Get started")');
    this.importWalletBtn = page.locator(
      'button:has-text("Import an existing wallet")',
    );
    this.confirmSecretBtn = page.locator(
      'button:has-text("Confirm Secret Recovery Phrase")',
    );
    this.agreeBtn = page.locator('button:has-text("I agree")');
    this.noThanksBtn = page.locator('button:has-text("No thanks")');
    this.passwordTxt = page.getByTestId('create-password-new');
    this.passwordConfirmTxt = page.getByTestId('create-password-confirm');
    this.agreeCheck = page.getByTestId('create-new-vault__terms-checkbox');
    this.agreeTandCCheck = page.getByTestId('onboarding-terms-checkbox');
    this.agreePasswordTermsCheck = page.getByTestId('create-password-terms');
    this.importBtn = page.getByTestId('create-password-import');
    this.doneBtn = page.getByTestId('pin-extension-done');
    this.gotItBtn = page.getByTestId('onboarding-complete-done');
    this.nextBtn = page.getByTestId('pin-extension-next');
    this.agreeBtn = page.locator('button:has-text("I agree")');
    this.enableButton = page.locator('button:has-text("Enable")');
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
    await this.nextBtn.click();
    await this.doneBtn.click();
  }
}
