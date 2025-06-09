import { Driver } from '../../../webdriver/driver';

/**
 * Represents the page for connecting hardware wallets.
 * This page allows users to initiate connections with various hardware wallet types.
 */
class ConnectHardwareWalletPage {
  private driver: Driver;

  private readonly connectHardwareWalletPageTitle = {
    text: 'Connect a hardware wallet',
    tag: 'h3',
  };

  private readonly connectLatticeButton = '[data-testid="connect-lattice-btn"]';

  private readonly connectTrezorButton = '[data-testid="connect-trezor-btn"]';

  private readonly continueButton = { text: 'Continue', tag: 'button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.connectHardwareWalletPageTitle,
        this.connectLatticeButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for connect hardware wallet page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Connect hardware wallet page is loaded');
  }

  async openConnectLatticePage(): Promise<void> {
    console.log(`Open connect lattice page`);
    await this.driver.clickElement(this.connectLatticeButton);
    await this.driver.clickElement(this.continueButton);
  }

  async openConnectTrezorPage(): Promise<void> {
    console.log(`Open connect trezor page`);
    await this.driver.clickElement(this.connectTrezorButton);
    await this.driver.clickElement(this.continueButton);
  }
}

export default ConnectHardwareWalletPage;
