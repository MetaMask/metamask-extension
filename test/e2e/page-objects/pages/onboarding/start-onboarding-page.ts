import { Driver } from '../../../webdriver/driver';

class StartOnboardingPage {
  private driver: Driver;

  private readonly createWalletButton =
    '[data-testid="onboarding-create-wallet"]';

  private readonly importWalletButton =
    '[data-testid="onboarding-import-wallet"]';

  private readonly startMessage = {
    text: "Let's get started",
    tag: 'h2',
  };

  private readonly termsModal = '[data-testid="terms-of-use-modal-body"]';

  private readonly termsCheckbox = '[data-testid="onboarding-terms-checkbox"]';

  private readonly termsConfirmButton =
    '[data-testid="onboarding-terms-accept"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([this.startMessage]);
    } catch (e) {
      console.log(
        'Timeout while waiting for start onboarding page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Start onboarding page is loaded');
  }

  async checkTermsCheckbox(): Promise<void> {
    await this.driver.waitForSelector(this.termsModal);

    await this.driver.executeScript(`
      const modalBody = document.querySelector('[data-testid="terms-of-use-modal-body"]');
      if (modalBody) {
        modalBody.scrollTo({ top: modalBody.scrollHeight, behavior: 'instant' });
      }
    `);

    await this.driver.findClickableElement(this.termsCheckbox);
    await this.driver.clickElement(this.termsCheckbox);

    await this.driver.findClickableElement(this.termsConfirmButton);
    await this.driver.clickElement(this.termsConfirmButton);
  }

  async clickCreateWalletButton(): Promise<void> {
    await this.driver.findClickableElement(this.createWalletButton);
    await this.driver.clickElement(this.createWalletButton);
    await this.checkTermsCheckbox();
  }

  async clickImportWalletButton(): Promise<void> {
    await this.driver.findClickableElement(this.importWalletButton);
    await this.driver.clickElement(this.importWalletButton);
    await this.checkTermsCheckbox();
  }
}

export default StartOnboardingPage;
