
import { Driver } from '../../../webdriver/driver';

class accountAddressModal {
  private driver: Driver;

  private readonly accountAddress =
    '[data-testid="account-address"]';

  private readonly viewOnEtherscanLink =
    '[data-testid="view-address-on-etherscan"]';

  private readonly backButton =
    '[aria-label="Close"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountAddress,
        this.viewOnEtherscanLink
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for account address modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Address list modal is loaded');
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
    await this.driver.clickElement(
      this.backButton,
    );
  }
}

export default accountAddressModal;
