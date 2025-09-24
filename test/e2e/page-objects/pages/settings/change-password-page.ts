import { Driver } from '../../../webdriver/driver';

export default class ChangePasswordPage {
  private readonly driver: Driver;

  private readonly changePasswordPageTitle = {
    text: 'Change password',
    css: 'h4',
  };

  private readonly currentPasswordInput =
    '[data-testid="verify-current-password-input"]';

  private readonly verifyCurrentPasswordButton =
    '[data-testid="verify-current-password-button"]';

  private readonly newPasswordInput = '[data-testid="change-password-input"]';

  private readonly confirmNewPasswordInput =
    '[data-testid="change-password-confirm-input"]';

  private readonly passwordTerms = '[data-testid="change-password-terms"]';

  private readonly saveButton = '[data-testid="change-password-button"]';

  private readonly passwordChangedWarning = {
    text: 'Changing your password here will lock MetaMask on other devices you’re using. You’ll need to log in again with your new password.',
    css: 'p',
  };

  private readonly confirmWarningButton =
    '[data-testid="change-password-warning-confirm"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check change password page is loaded');
    await this.driver.waitForSelector(this.changePasswordPageTitle);
  }

  async confirmCurrentPassword(password: string): Promise<void> {
    console.log('Confirm current password');
    await this.driver.fill(this.currentPasswordInput, password);
    await this.driver.clickElement(this.verifyCurrentPasswordButton);
  }

  async changePassword(newPassword: string): Promise<void> {
    console.log('Change password');
    await this.driver.fill(this.newPasswordInput, newPassword);
    await this.driver.fill(this.confirmNewPasswordInput, newPassword);
    await this.driver.clickElement(this.passwordTerms);
    await this.driver.clickElement(this.saveButton);
  }

  async checkPasswordChangedWarning(): Promise<void> {
    console.log('Check password changed warning');
    await this.driver.waitForSelector(this.passwordChangedWarning);
  }

  async confirmChangePasswordWarning(): Promise<void> {
    console.log('Confirm change password warning');
    await this.driver.clickElement(this.confirmWarningButton);
  }
}
