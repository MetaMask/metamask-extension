import { Driver } from '../../webdriver/driver';

/**
 * Forgot-password / restore-vault flow: SRP then new password.
 *
 * Screen: `#/restore-vault`, reached from unlock via forgot password.
 * Owns: SRP entry/confirm, new password + confirm, terms checkbox, and restore
 * submit through password-input detachment after success.
 * Boundaries: restore-vault form only. Unlock entry belongs to `LoginPage`;
 * post-restore home belongs to `HomePage`.
 * Related: `LoginPage` (forgot-password entry).
 *
 * @see ui/pages/keychains/restore-vault.tsx
 */
class ResetPasswordPage {
  private confirmPasswordInput: string;

  private createPasswordTermsCheckbox: string;

  private driver: Driver;

  private passwordInput: string;

  private restoreButton: string;

  private seedPhraseInput: string;

  private srpWordInputContinueButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.seedPhraseInput = '[data-testid="srp-input-import__srp-note"]';
    this.passwordInput = '[data-testid="create-password-new-input"]';
    this.confirmPasswordInput = '[data-testid="create-password-confirm-input"]';
    this.restoreButton = '[data-testid="create-password-submit"]';
    this.srpWordInputContinueButton = '[data-testid="import-srp-confirm"]';
    this.createPasswordTermsCheckbox = '[data-testid="create-password-terms"]';
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.seedPhraseInput,
        this.srpWordInputContinueButton,
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
    await this.driver.clickElement(this.srpWordInputContinueButton);
    await this.driver.waitForMultipleSelectors([
      this.passwordInput,
      this.confirmPasswordInput,
      this.createPasswordTermsCheckbox,
      this.restoreButton,
    ]);
    await this.driver.fill(this.passwordInput, newPassword);
    await this.driver.fill(this.confirmPasswordInput, newPassword);
    await this.driver.clickElement(this.createPasswordTermsCheckbox);
    await this.driver.clickElement(this.restoreButton);
  }

  /**
   * Waits until the password input is no longer visible on the page.
   * This is useful for verifying that the reset password process has completed
   * and the user has been redirected away from the reset password page.
   */
  async waitForPasswordInputToNotBeVisible(): Promise<void> {
    console.log('Waiting for seed phrase input to not be visible');
    await this.driver.waitForSelector(this.passwordInput, {
      state: 'detached',
      timeout: 30000,
    });
  }
}

export default ResetPasswordPage;
