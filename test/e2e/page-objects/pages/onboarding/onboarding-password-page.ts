import { Driver } from '../../../webdriver/driver';
import { WALLET_PASSWORD } from '../../../helpers';

class OnboardingPasswordPage {
  private driver: Driver;

  private readonly createPasswordMessage = {
    text: "Create password",
    tag: 'h2',
  };

  private readonly newPasswordInput = '[data-testid="create-password-new"]';
  private readonly confirmPasswordInput = '[data-testid="create-password-confirm"]';
  private readonly passwordTerms = '[data-testid="create-password-terms"]';
  private readonly importWalletButton = '[data-testid="create-password-import"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.createPasswordMessage,
        this.newPasswordInput,
        this.confirmPasswordInput,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for create password page to be loaded', e);
      throw e;
    }
    console.log('Onboarding password page is loaded');
  }

  /**
   * Fill the password fields with the provided password
   * @param password - The password to fill. Defaults to WALLET_PASSWORD.
   */
  async fillPassword(password: string = WALLET_PASSWORD): Promise<void> {
    await this.driver.fill(this.newPasswordInput, password);
    await this.driver.fill(this.confirmPasswordInput, password);
    await this.driver.clickElement(this.passwordTerms);
    await this.driver.clickElementAndWaitToDisappear(this.importWalletButton);
  }
}

export default OnboardingPasswordPage;
