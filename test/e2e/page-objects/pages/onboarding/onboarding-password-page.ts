import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';
import { WALLET_PASSWORD } from '../../../helpers';

class OnboardingPasswordPage {
  private driver: Driver;

  private readonly confirmPasswordInput =
    '[data-testid="create-password-confirm"]';

  private readonly createPasswordMessage = {
    text: 'Create password',
    tag: 'h2',
  };

  private readonly createWalletButton =
    '[data-testid="create-password-wallet"]';

  private readonly importWalletButton =
    '[data-testid="create-password-import"]';

  private readonly incorrectPasswordWarningMessage = {
    text: "Passwords don't match",
    tag: 'h6',
  };

  private readonly newPasswordInput = '[data-testid="create-password-new"]';

  private readonly passwordTerms = '[data-testid="create-password-terms"]';

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
      console.log(
        'Timeout while waiting for create password page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding password page is loaded');
  }

  /**
   * Create a password for new imported wallet
   *
   * @param password - The password to create. Defaults to WALLET_PASSWORD.
   */
  async createImportedWalletPassword(
    password: string = WALLET_PASSWORD,
  ): Promise<void> {
    console.log('Create password for new imported wallet');
    await this.fillWalletPassword(password, password);
    await this.driver.clickElementAndWaitToDisappear(this.importWalletButton);
  }

  /**
   * Create a password for new created wallet
   *
   * @param password - The new password to create. Defaults to WALLET_PASSWORD.
   */
  async createWalletPassword(
    password: string = WALLET_PASSWORD,
  ): Promise<void> {
    console.log('Create password for new created wallet');
    await this.fillWalletPassword(password, password);
    await this.driver.clickElementAndWaitToDisappear(this.createWalletButton);
  }

  /**
   * Fill the wallet password fields
   *
   * @param newPassword - The new password to fill.
   * @param confirmPassword - The confirm password to fill.
   */
  async fillWalletPassword(
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    console.log('Fill the wallet password fields');
    await this.driver.fill(this.newPasswordInput, newPassword);
    await this.driver.fill(this.confirmPasswordInput, confirmPassword);
    await this.driver.clickElement(this.passwordTerms);
  }

  async check_confirmPasswordButtonIsDisabled(): Promise<void> {
    console.log('Check the confirm password button is disabled');
    const confirmPasswordButton = await this.driver.findElement(
      this.createWalletButton,
    );
    assert.equal(await confirmPasswordButton.isEnabled(), false);
  }

  async check_incorrectPasswordWarningMessageIsDisplayed(): Promise<void> {
    console.log('Check the incorrect password warning message is displayed');
    await this.driver.waitForSelector(this.incorrectPasswordWarningMessage);
  }
}

export default OnboardingPasswordPage;
