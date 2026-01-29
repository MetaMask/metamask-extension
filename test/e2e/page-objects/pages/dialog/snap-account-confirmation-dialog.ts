import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Snap Account creation and confirmation dialogs.
 * This handles the MetaMask dialogs shown when creating or importing snap accounts.
 */
class SnapAccountConfirmationDialog {
  private readonly driver: Driver;

  // Selectors (alphabetically ordered)
  private readonly accountCreatedMessage = {
    tag: 'h3',
    text: 'Account created',
  };

  private readonly cancelButton = '[data-testid="confirmation-cancel-button"]';

  private readonly confirmButton = '[data-testid="confirmation-submit-button"]';

  private readonly createAccountTitle =
    '[data-testid="create-snap-account-content-title"]';

  private readonly okButton = {
    tag: 'button',
    text: 'Ok',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Methods (alphabetically ordered)
  async checkAccountCreatedMessageDisplayed(): Promise<void> {
    console.log('Checking account created message is displayed');
    await this.driver.waitForSelector(this.accountCreatedMessage);
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

  async clickCancelButton(): Promise<void> {
    console.log('Clicking cancel button on snap account dialog');
    await this.driver.clickElementAndWaitForWindowToClose(this.cancelButton);
  }

  async clickConfirmButton(): Promise<void> {
    console.log('Clicking confirm button on snap account dialog');
    await this.driver.clickElement(this.confirmButton);
  }

  async clickConfirmButtonAndWaitForWindowToClose(): Promise<void> {
    console.log('Clicking confirm button and waiting for window to close');
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }

  async clickConfirmButtonAndWaitToDisappear(): Promise<void> {
    console.log('Clicking confirm button and waiting for it to disappear');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }

  /**
   * Clicks the OK button on the account created screen and waits for the dialog to close.
   */
  async confirmAccountCreatedAndClose(): Promise<void> {
    console.log('Confirming account created');
    await this.driver.waitForSelector(this.accountCreatedMessage);
    await this.driver.clickElementAndWaitForWindowToClose(this.okButton);
  }
}

export default SnapAccountConfirmationDialog;
