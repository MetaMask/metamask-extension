import { Driver } from '../../webdriver/driver';

class ResetPasswordPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }


  async resetPassword(seedPhrase: string, newPassword: string): Promise<void> {
    console.log('Resetting password');
    await this.driver.pasteIntoField(
      '[data-testid="import-srp__srp-word-0"]',
      seedPhrase,
    );
    await this.driver.fill('#password', newPassword);
    await this.driver.fill('#confirm-password', newPassword);
    await this.driver.press('#confirm-password', this.driver.Key.ENTER);
  }

}

export default ResetPasswordPage;
