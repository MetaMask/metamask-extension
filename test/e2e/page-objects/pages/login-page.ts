import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../helpers';

class LoginPage {
  private driver: Driver;

  private passwordInput: string;

  private unlockButton: string;

  private welcomeBackMessage: object;

  private forgotPasswordButton: string;

  private resetPasswordModalButton: string;

  private resetWalletButton: string;

  private incorrectPasswordMessage: { css: string; text: string };

  private connectionsRemovedModal: string;

  private connectionsRemovedModalConfirmButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.passwordInput = '[data-testid="unlock-password"]';
    this.unlockButton = '[data-testid="unlock-submit"]';
    this.welcomeBackMessage = {
      css: '[data-testid="unlock-page-title"]',
      text: 'Welcome back',
    };
    this.forgotPasswordButton = '[data-testid="unlock-forgot-password-button"]';

    this.resetPasswordModalButton =
      '[data-testid="reset-password-modal-button"]';

    this.incorrectPasswordMessage = {
      css: '[data-testid="unlock-page-help-text"]',
      text: 'Password is incorrect. Please try again.',
    };

    this.resetWalletButton = '[data-testid="login-error-modal-button"]';

    this.connectionsRemovedModal = '[data-testid="connections-removed-modal"]';
    this.connectionsRemovedModalConfirmButton =
      '[data-testid="connections-removed-modal-confirm-button"]';
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.welcomeBackMessage,
        this.passwordInput,
        this.unlockButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for login page to be loaded', e);
      throw e;
    }
    console.log('Login page is loaded');
  }

  /**
   * This method unlocks the wallet and lands user on the homepage.
   *
   * @param password - The password used to unlock the wallet. Defaults to WALLET_PASSWORD.
   */
  async loginToHomepage(password: string = WALLET_PASSWORD): Promise<void> {
    console.log(`On login page, Login to homepage `);
    await this.driver.fill(this.passwordInput, password);
    await this.driver.clickElement(this.unlockButton);
  }

  async checkIncorrectPasswordMessageIsDisplayed(): Promise<void> {
    console.log('Checking if incorrect password message is displayed');
    const isDisplayed = await this.driver.waitForSelector(
      this.incorrectPasswordMessage,
    );
    if (!isDisplayed) {
      throw new Error('Incorrect password message is not displayed');
    }
  }

  async gotoResetPasswordPage(): Promise<void> {
    console.log('Navigating to reset password page');
    await this.driver.clickElement(this.forgotPasswordButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.resetPasswordModalButton,
    );
  }

  async resetWallet(): Promise<void> {
    console.log(
      'Resetting wallet due to unrecoverable error in social login unlock',
    );
    await this.driver.clickElementAndWaitToDisappear(this.resetWalletButton);
  }

  async resetWalletFromConnectionsRemovedModal(): Promise<void> {
    console.log('Resetting wallet from connections removed modal');
    await this.driver.waitForSelector(this.connectionsRemovedModal);
    await this.driver.clickElement(this.connectionsRemovedModalConfirmButton);
  }
}

export default LoginPage;
