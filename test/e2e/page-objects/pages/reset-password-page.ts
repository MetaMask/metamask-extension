import { Driver } from '../../webdriver/driver';

class ResetPasswordPage {
  private driver: Driver;

  private seedPhraseInput: string;

  private passwordInput: string;

  private confirmPasswordInput: string;

  private restoreButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.seedPhraseInput = '[data-testid="import-srp__srp-word-0"]';
    this.passwordInput = '[data-testid="create-vault-password"]';
    this.confirmPasswordInput = '[data-testid="create-vault-confirm-password"]';
    this.restoreButton = '[data-testid="create-new-vault-submit-button"]';
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.passwordInput,
        this.confirmPasswordInput,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for reset password page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Reset password page is loaded');
  }

  /**
   * Resets the password using the provided seed phrase and new password.
   *
   * @param seedPhrase - The seed phrase to verify account ownership
   * @param newPassword - The new password to set for the account
   */
  async resetPassword(seedPhrase: string, newPassword: string): Promise<void> {
    console.log(`Resetting password with new password: ${newPassword}`);
    await this.driver.pasteIntoField(this.seedPhraseInput, seedPhrase);
    await this.driver.fill(this.passwordInput, newPassword);
    await this.driver.fill(this.confirmPasswordInput, newPassword);
    await this.driver.clickElement(this.restoreButton);
  }

  /**
   * Waits until the seed phrase input is no longer visible on the page.
   * This is useful for verifying that the reset password process has completed
   * and the user has been redirected away from the reset password page.
   */
  async waitForSeedPhraseInputToNotBeVisible(): Promise<void> {
    console.log('Waiting for seed phrase input to not be visible');
    await this.driver.waitForSelector(this.seedPhraseInput, {
      state: 'detached',
      timeout: 30000,
    });
  }
}

export default ResetPasswordPage;
