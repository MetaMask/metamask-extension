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

  private readonly createAccountTitle =
    '[data-testid="create-snap-account-content-title"]';

  private readonly accountNameInput = '#account-name';

  private readonly submitAccountNameButton =
    '[data-testid="submit-add-account-with-name"]';

  private readonly cancelAccountNameButton =
    '[data-testid="cancel-add-account-with-name"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkConfirmationDialogIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.createAccountTitle,
        this.cancelButton,
      ]);
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

  /**
   * Fills in the account name and submits the form.
   *
   * @param accountName - The name for the new snap account. Defaults to "SSK Account".
   */
  async fillAccountNameAndSubmit(
    accountName: string = 'SSK Account',
  ): Promise<void> {
    console.log(`Filling account name: ${accountName}`);
    await this.driver.waitForSelector(this.accountNameInput);
    await this.driver.fill(this.accountNameInput, accountName);
    await this.driver.clickElement(this.submitAccountNameButton);
  }

  async cancelAccountNameDialog(): Promise<void> {
    console.log('Canceling account name dialog');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.cancelAccountNameButton,
    );
  }

  async checkAccountCreatedMessageDisplayed(): Promise<void> {
    console.log('Checking account created message is displayed');
    await this.driver.waitForSelector(this.accountCreatedMessage);
  }

  /**
   * Clicks the confirm button on the account created screen and waits for the dialog to close.
   */
  async confirmAccountCreatedAndClose(): Promise<void> {
    console.log('Confirming account created');
    await this.driver.waitForSelector(this.accountCreatedMessage);
    await this.driver.clickElementAndWaitForWindowToClose(this.confirmButton);
  }
}

export default SnapAccountConfirmationDialog;
