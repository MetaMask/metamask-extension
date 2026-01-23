import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Snap Account creation and confirmation dialogs.
 * This handles the MetaMask dialogs shown when creating or importing snap accounts.
 */
class SnapAccountConfirmationDialog {
  private readonly driver: Driver;

  private readonly accountCreatedMessage = {
    text: 'Account created',
    tag: 'h3',
  };

  private readonly cancelButton = '[data-testid="confirmation-cancel-button"]';

  private readonly confirmButton = '[data-testid="confirmation-submit-button"]';

  private readonly okButton = {
    text: 'Ok',
    tag: 'button',
  };

  private readonly createAccountTitle =
    '[data-testid="create-snap-account-content-title"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkConfirmationDialogIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.createAccountTitle);
      await this.driver.waitForSelector(this.cancelButton);
    } catch (e) {
      console.log(
        'Timeout while waiting for snap account confirmation dialog to load',
        e,
      );
      throw e;
    }
    console.log('Snap account confirmation dialog is loaded');
  }

  async clickConfirmButton(): Promise<void> {
    console.log('Clicking confirm button on snap account dialog');
    await this.driver.clickElement(this.confirmButton);
  }

  async clickCancelButton(): Promise<void> {
    console.log('Clicking cancel button on snap account dialog');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async checkAccountCreatedMessageDisplayed(): Promise<void> {
    console.log('Checking account created message is displayed');
    await this.driver.waitForSelector(this.accountCreatedMessage);
  }

  /**
   * Clicks the Ok button on the account created screen and waits for the dialog to close.
   */
  async confirmAccountCreatedAndClose(): Promise<void> {
    console.log('Confirming account created');
    await this.driver.waitForSelector(this.accountCreatedMessage);
    // Use text-based selector for the Ok button on the success screen
    await this.driver.clickElementAndWaitForWindowToClose(this.okButton);
  }
}

export default SnapAccountConfirmationDialog;
