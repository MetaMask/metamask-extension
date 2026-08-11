import { Driver } from '../../../webdriver/driver';

/**
 * Represents the page for connecting hardware wallets.
 * This page allows users to initiate connections with various hardware wallet types.
 * Clicking a wallet option directly initiates the connection flow.
 */
class ConnectHardwareWalletPage {
  private readonly closeButton = '[data-testid="hardware-connect-close-btn"]';

  private readonly connectHardwareWalletPageTitle = {
    text: 'Connect a hardware wallet',
    tag: 'h4',
  };

  private readonly connectLatticeButton =
    '[data-testid="connect-hardware-wallet-lattice"]';

  private readonly connectLedgerButton =
    '[data-testid="connect-hardware-wallet-ledger"]';

  private readonly connectQrButton =
    '[data-testid="connect-hardware-wallet-other-qr"]';

  private readonly connectTrezorButton =
    '[data-testid="connect-hardware-wallet-trezor"]';

  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkFirefoxNotSupportedIsDisplayed(): Promise<void> {
    console.log('Check "Firefox Not Supported" message is displayed');
    await this.driver.waitForSelector({
      text: 'Firefox Not Supported',
    });
  }

  async checkPageIsLoaded(): Promise<void> {
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

  async clickCloseButton(): Promise<void> {
    console.log(`Click close button`);
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }

  async clickConnectLedgerButton(): Promise<void> {
    console.log(`Click connect Ledger button`);
    await this.driver.clickElement(this.connectLedgerButton);
  }

  async openConnectLatticePage(): Promise<void> {
    console.log(`Open connect lattice page`);
    await this.driver.clickElement(this.connectLatticeButton);
  }

  async openConnectQrPage(): Promise<void> {
    await this.driver.clickElement(this.connectQrButton);
  }

  async openConnectTrezorPage(): Promise<void> {
    console.log(`Open connect trezor page`);
    await this.driver.clickElement(this.connectTrezorButton);
  }
}

export default ConnectHardwareWalletPage;
