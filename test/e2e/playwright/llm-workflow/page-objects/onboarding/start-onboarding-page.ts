import type { Page } from '@playwright/test';

export class StartOnboardingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private readonly getStartedButton = '[data-testid="get-started"]';

  private readonly termsOfUseCheckbox = '[data-testid="terms-of-use-checkbox"]';

  private readonly termsOfUseScrollButton =
    '[data-testid="terms-of-use-scroll-button"]';

  private readonly termsOfUseAgreeButton =
    '[data-testid="terms-of-use-agree-button"]';

  private readonly createWalletButton =
    '[data-testid="onboarding-create-wallet"]';

  private readonly importWalletButton =
    '[data-testid="onboarding-import-wallet"]';

  private readonly importWithSrpButton =
    '[data-testid="onboarding-import-with-srp-button"]';

  async isLoaded(): Promise<boolean> {
    try {
      await this.page
        .locator(this.getStartedButton)
        .waitFor({ timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickGetStarted(): Promise<void> {
    const getStartedLocator = this.page.locator(this.getStartedButton);
    const createWalletLocator = this.page.locator(this.createWalletButton);

    try {
      await Promise.race([
        getStartedLocator.waitFor({ state: 'visible', timeout: 10000 }),
        createWalletLocator.waitFor({ state: 'visible', timeout: 10000 }),
      ]);
    } catch {
      throw new Error('Could not find get-started or create-wallet button');
    }

    const getStartedVisible = await getStartedLocator
      .isVisible()
      .catch(() => false);

    if (getStartedVisible) {
      await getStartedLocator.click();
    } else {
      console.log('Skipping get-started, already at wallet selection');
    }
  }

  async agreeToTermsOfUse(): Promise<void> {
    await this.page.locator(this.termsOfUseScrollButton).waitFor();
    await this.page.locator(this.termsOfUseScrollButton).click();
    await this.page
      .locator(this.termsOfUseScrollButton)
      .waitFor({ state: 'hidden', timeout: 5000 });
    await this.page.locator(this.termsOfUseCheckbox).click();
    await this.page.locator(this.termsOfUseAgreeButton).click();
  }

  async clickImportWallet(): Promise<void> {
    await this.page.locator(this.importWalletButton).click();
  }

  async clickImportWithSrp(): Promise<void> {
    await this.page.locator(this.importWithSrpButton).click();
  }

  async clickCreateWallet(): Promise<void> {
    await this.page.locator(this.createWalletButton).click();
  }
}
