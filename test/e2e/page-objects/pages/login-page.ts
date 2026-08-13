import { Driver } from '../../webdriver/driver';
import { WALLET_PASSWORD } from '../../constants';

/**
 * Unlock / login screen for an existing vault (password or passkey).
 *
 * Screen: `#/unlock` (and onboarding unlock variants that reuse this UI).
 * Owns: password/passkey unlock, forgot-password / reset-wallet entry,
 * incorrect-password messaging, and connections-removed modal handling.
 * Boundaries: unlock surface only. Password reset via SRP belongs to
 * `ResetPasswordPage`; post-unlock home belongs to `HomePage`.
 * Related: `ResetPasswordPage`, `HomePage`.
 *
 * @see ui/pages/unlock-page/unlock-page.component.tsx
 */
class LoginPage {
  private readonly connectionsRemovedModal: object = {
    testId: 'connections-removed-modal',
  };

  private readonly connectionsRemovedModalButton: object = {
    testId: 'connections-removed-modal-button',
  };

  private driver: Driver;

  private readonly forgotPasswordButton: object = {
    testId: 'unlock-forgot-password-button',
  };

  private readonly incorrectPasswordMessage: object = {
    testId: 'unlock-page-help-text',
    text: 'Password is incorrect. Please try again.',
  };

  private readonly passkeyUnlockButton: object = {
    testId: 'unlock-passkey-button',
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

  private readonly unlockWithPasskeyButton: object = {
    testId: 'unlock-with-passkey',
  };

  private readonly usePasswordButton: object = {
    testId: 'unlock-use-password-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkConnectionsRemovedModalIsDisplayed(): Promise<void> {
    console.log('Checking if connections removed modal is displayed');
    await this.driver.waitForSelector(this.connectionsRemovedModal);
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

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.forgotPasswordButton,
        this.passwordInput,
        this.unlockButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for login page to be loaded', e);
      throw e;
    }
    console.log('Login page is loaded');
  }

  async checkPasskeyUnlockPageIsLoaded(): Promise<void> {
    console.log('Checking if passkey unlock page is loaded');
    await this.driver.waitForSelector(this.passkeyUnlockButton);
    await this.driver.waitForSelector(this.usePasswordButton);
  }

  async clickPasskeyUnlock(): Promise<void> {
    console.log('Clicking passkey unlock button');
    await this.driver.clickElement(this.passkeyUnlockButton);
  }

  async clickUnlockWithPasskey(): Promise<void> {
    console.log('Clicking unlock with passkey button');
    await this.driver.waitForSelector(this.unlockWithPasskeyButton);
    await this.driver.clickElement(this.unlockWithPasskeyButton);
  }

  async clickUsePassword(): Promise<void> {
    console.log('Clicking use password button to switch to password form');
    await this.driver.waitForSelector(this.usePasswordButton);
    await this.driver.clickElement(this.usePasswordButton);
  }

  async gotoResetPasswordPage(): Promise<void> {
    console.log('Navigating to reset password page');
    await this.driver.clickElement(this.forgotPasswordButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.resetPasswordModalButton,
    );
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

  async resetWallet(): Promise<void> {
    console.log(
      'Resetting wallet due to unrecoverable error in social login unlock',
    );
    await this.driver.clickElementAndWaitToDisappear(this.resetWalletButton);
  }

  async resetWalletFromConnectionsRemovedModal(): Promise<void> {
    console.log('Resetting wallet from connections removed modal');
    await this.driver.clickElement(this.connectionsRemovedModalButton);
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
}

export default LoginPage;
