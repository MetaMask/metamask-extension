import { type Locator, type Page } from '@playwright/test';

export class MMISignUpPage {
  readonly page: Page;

  readonly extensionId: string;

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

  constructor(page: Page, extensionId: string) {
    this.page = page;
    this.extensionId = extensionId;
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
    this.importBtn = page.locator('button:has-text("Import my wallet")');
    this.doneBtn = page.locator('button:has-text("Done")');
    this.gotItBtn = page.locator('button:has-text("Got it!")');
    this.nextBtn = page.locator('button:has-text("Next")');
  }

  async goto() {
    await this.page.goto(`chrome-extension://${this.extensionId}/home.html`);
  }

  async start() {
    await this.agreeTandCCheck.click();
    await this.importWalletBtn.click();
  }

  async authentication() {
    const seeds = process.env.MMI_E2E_SEED_PHRASE?.trim().split(/\s+/u);
    for (const [index, element] of (seeds as string[]).entries()) {
      await this.page
        .locator(`data-testid=import-srp__srp-word-${index}`)
        .fill(element);
    }
    await this.confirmSecretBtn.click();
    // assert 'Create password' H2
    await this.passwordTxt.fill(process.env.MMI_E2E_MMI_PASSWORD as string);
    await this.passwordConfirmTxt.fill(
      process.env.MMI_E2E_MMI_PASSWORD as string,
    );
    await this.agreePasswordTermsCheck.click();
    await this.page.getByRole('button', { name: /continue/iu }).click();
  }

  async info() {
    await this.page.getByRole('button', { name: /continue/iu }).click();
    await this.page
      .getByRole('button', {
        name: /continue metamask institutional onboarding/iu,
      })
      .click();
    // After this click its redirect to the dashboard but we don't need to signin
  }

  async close() {
    await this.page.close();
  }

  async termsAndConditions() {
    await this.agreeCheck.click();
    // await this.importBtn.click()
    await this.doneBtn.click();
  }
}
