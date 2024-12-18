import { Driver } from '../../../webdriver/driver';

class AccountDetailsModal {
  private driver: Driver;

  private readonly accountAddressText = '.qr-code__address-segments';

  private readonly accountQrCodeAddress = '.qr-code__address-segments';

  private readonly accountQrCodeImage = '.qr-code__wrapper';

  private readonly closeAccountModalButton = 'header button[aria-label="Close"]';

  private readonly copyAddressButton =
    '[data-testid="address-copy-button-text"]';

  private readonly editableLabelButton =
    '[data-testid="editable-label-button"]';

  private readonly editableLabelInput = '[data-testid="editable-input"] input';

  private readonly saveAccountLabelButton =
    '[data-testid="save-account-label-input"]';

  private readonly showPrivateKeyButton = {
    css: 'button',
    text: 'Show private key',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.editableLabelButton,
        this.copyAddressButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for account details modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Account details modal is loaded');
  }

  async closeAccountDetailsModal(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.closeAccountModalButton,
    );
  }

  /**
   * Change the label of the account in the account details modal.
   *
   * @param newLabel - The new label to set for the account.
   */
  async changeAccountLabel(newLabel: string): Promise<void> {
    console.log(
      `Account details modal opened, changing account label to: ${newLabel}`,
    );
    await this.driver.clickElement(this.editableLabelButton);
    await this.driver.fill(this.editableLabelInput, newLabel);
    await this.driver.clickElement(this.saveAccountLabelButton);
    await this.closeAccountDetailsModal();
  }

  async getAccountAddress(): Promise<string> {
    console.log(`Get account address in account details modal`);
    await this.driver.waitForSelector(this.accountAddressText);
    const accountAddress = await (
      await this.driver.findElement(this.accountAddressText)
    ).getText();
    await this.closeAccountDetailsModal();
    return accountAddress;
  }

  /**
   * Check that the correct address is displayed in the account details modal.
   *
   * @param expectedAddress - The expected address to check.
   */
  async check_addressInAccountDetailsModal(
    expectedAddress: string,
  ): Promise<void> {
    console.log(
      `Check that address ${expectedAddress} is displayed in account details modal`,
    );
    await this.driver.waitForSelector(this.accountQrCodeImage);
    await this.driver.waitForSelector({
      css: this.accountQrCodeAddress,
      text: expectedAddress,
    });
  }

  async check_showPrivateKeyButtonIsNotDisplayed(): Promise<void> {
    console.log('Check that show private key button is not displayed');
    await this.driver.assertElementNotPresent(this.showPrivateKeyButton);
  }
}

export default AccountDetailsModal;
