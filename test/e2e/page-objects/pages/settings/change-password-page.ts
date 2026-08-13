import { Driver } from '../../../webdriver/driver';

/**
 * Change-password flow under Security and password.
 *
 * Screen: `#/settings/security-and-password/password`, reached from
 * `PrivacySettings.openChangePassword` (after
 * `SettingsPage.goToSecurityAndPasswordSettings` /
 * `flows/settings.flow.ts` `navigateToSecurityAndPassword`).
 * Owns: current-password verify, new/confirm password inputs, terms, save,
 * and the cross-device lock warning confirm.
 * Boundaries: password change only. Passkey register/turn-off and SRP reveal
 * stay on `PrivacySettings`; login after change belongs to `LoginPage`.
 * Related: `PrivacySettings`, `SettingsPage`, `flows/settings.flow.ts`.
 *
 * @see ui/components/app/change-password/change-password.tsx
 * @see ui/pages/settings/security-and-password-tab/password-sub-page.tsx
 */
export default class ChangePasswordPage {
  private readonly confirmNewPasswordInput =
    '[data-testid="change-password-confirm-input"]';

  private readonly confirmWarningButton =
    '[data-testid="change-password-warning-confirm"]';

  private readonly currentPasswordInput =
    '[data-testid="verify-current-password-input"]';

  private readonly driver: Driver;

  private readonly newPasswordInput = '[data-testid="change-password-input"]';

  private readonly passwordChangedWarning = {
    text: 'Changing your password here will lock MetaMask on other devices you’re using. You’ll need to log in again with your new password.',
    css: 'p',
  };

  private readonly passwordTerms = '[data-testid="change-password-terms"]';

  private readonly saveButton = '[data-testid="change-password-button"]';

  private readonly verifyCurrentPasswordButton =
    '[data-testid="verify-current-password-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async changePassword(newPassword: string): Promise<void> {
    console.log('Change password');
    await this.driver.fill(this.newPasswordInput, newPassword);
    await this.driver.fill(this.confirmNewPasswordInput, newPassword);
    await this.driver.clickElement(this.passwordTerms);
    await this.driver.clickElement(this.saveButton);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check change password page is loaded');
    await this.driver.waitForSelector(this.currentPasswordInput);
  }

  async checkPasswordChangedWarning(): Promise<void> {
    console.log('Check password changed warning');
    await this.driver.waitForSelector(this.passwordChangedWarning);
  }

  async confirmChangePasswordWarning(): Promise<void> {
    console.log('Confirm change password warning');
    await this.driver.clickElementAndWaitToDisappear(this.confirmWarningButton);
  }

  async confirmCurrentPassword(password: string): Promise<void> {
    console.log('Confirm current password');
    await this.driver.fill(this.currentPasswordInput, password);
    await this.driver.clickElement(this.verifyCurrentPasswordButton);
  }

  async waitForPasskeyVerificationToComplete(): Promise<void> {
    console.log(
      'Waiting for passkey verification to complete and new password form to appear',
    );
    await this.driver.waitForSelector(this.newPasswordInput);
  }
}
