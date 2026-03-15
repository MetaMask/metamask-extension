import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../constants';

class LoginPage {
  private driver: Driver;

  private readonly connectionsRemovedModal: object = {
    testId: 'connections-removed-modal',
  };

  private readonly connectionsRemovedModalButton: object = {
    testId: 'connections-removed-modal-button',
  };

  private readonly forgotPasswordButton: object = {
    testId: 'unlock-forgot-password-button',
  };

  private readonly incorrectPasswordMessage: object = {
    testId: 'unlock-page-help-text',
    text: 'Password is incorrect. Please try again.',
  };

  private readonly passwordInput: object = { testId: 'unlock-password' };

  private readonly resetPasswordModalButton: object = {
    testId: 'reset-password-modal-button',
  };

  private readonly resetPasswordModalButtonLink: object = {
    testId: 'reset-password-modal-button-link',
  };

  private readonly resetWalletButton: object = {
    testId: 'login-error-modal-button',
  };

  private readonly unlockButton: object = { testId: 'unlock-submit' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Wait for app to be ready before interacting with login page.
   * This helps prevent race conditions during initial app loading.
   */
  private async waitForAppReady(): Promise<void> {
    console.log('Waiting for app to be ready before login page interactions');
    // Wait for DOM to be ready
    await this.driver.executeScript(`
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve(), { once: true });
        }
      });
    `);
    // Add a small delay to ensure React has finished rendering
    await this.driver.delay(500);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      // First wait for app to be ready
      await this.waitForAppReady();

      // Then check elements sequentially with increased timeout
      await this.driver.waitForSelector(this.forgotPasswordButton, {
        timeout: 15000,
      });
      await this.driver.waitForSelector(this.passwordInput, { timeout: 15000 });
      await this.driver.waitForSelector(this.unlockButton, { timeout: 15000 });
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

  /**
   * Resets the wallet via the "Forgot password?" flow on the unlock page.
   * Clicks "Forgot password?" -> "I don't know my Recovery Phrase" -> "Reset wallet".
   */
  async resetWalletFromForgotPassword(): Promise<void> {
    console.log(
      'Resetting wallet from forgot password flow on the unlock page',
    );
    await this.driver.clickElement(this.forgotPasswordButton);
    await this.driver.clickElement(this.resetPasswordModalButtonLink);
    await this.driver.clickElementAndWaitToDisappear(
      this.resetPasswordModalButton,
    );
  }

  async checkConnectionsRemovedModalIsDisplayed(): Promise<void> {
    console.log('Checking if connections removed modal is displayed');
    await this.driver.waitForSelector(this.connectionsRemovedModal);
  }

  async resetWalletFromConnectionsRemovedModal(): Promise<void> {
    console.log('Resetting wallet from connections removed modal');
    await this.driver.clickElement(this.connectionsRemovedModalButton);
  }
}

export default LoginPage;
