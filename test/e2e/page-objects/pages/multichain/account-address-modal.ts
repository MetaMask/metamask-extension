import { Driver } from '../../../webdriver/driver';

class AccountAddressModal {
  private driver: Driver;

  private readonly accountAddress = '[data-testid="account-address"]';

  private readonly backButton = '[aria-label="Close"]';

  private readonly viewOnEtherscanButton = {
    css: 'button',
    text: 'View on Etherscan',
  };

  private readonly viewOnEtherscanLink =
    '[data-testid="view-address-on-etherscan"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountAddress,
        this.viewOnEtherscanLink,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for account address modal to be loaded',
        e,
      );
      throw e;
    }
    await this.driver.delay(1000);
    console.log('Account address modal is loaded');
  }

  /**
   * Get the account address from the modal
   */
  async getAccountAddress(): Promise<string> {
    console.log('Getting the address from the modal');
    const element = await this.driver.findElement(this.accountAddress);
    return await element.getText();
  }

  /**
   * Go back
   */
  async goBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }

  /**
   * Verify the View on Etherscan button is present
   */
  async checkViewOnEtherscanButton(): Promise<void> {
    console.log('Verifying View on Etherscan button');
    await this.driver.findElement(this.viewOnEtherscanButton);
  }
}

export default AccountAddressModal;
