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

  private readonly connectLedgerButton = '[data-testid="connect-ledger-btn"]';

  private readonly connectTrezorButton = '[data-testid="connect-trezor-btn"]';

  private readonly continueButton = { text: 'Continue', tag: 'button' };

  private readonly closeButton = '[data-testid="hardware-connect-close-btn"]';

  constructor(driver: Driver) {
    this.driver = driver;
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

  async openConnectLatticePage(): Promise<void> {
    console.log(`Open connect lattice page`);
    await this.driver.clickElement(this.connectLatticeButton);
    await this.driver.clickElement(this.continueButton);
  }

  async clickConnectLedgerButton(): Promise<void> {
    console.log(`Click connect Ledger button`);
    await this.driver.clickElement(this.connectLedgerButton);
  }

  async clickContinueButton(): Promise<void> {
    console.log(`Click continue button`);
    await this.driver.clickElement(this.continueButton);
  }

  async clickCloseButton(): Promise<void> {
    console.log(`Click close button`);
    await this.driver.clickElement(this.closeButton);
  }

  async openConnectTrezorPage(): Promise<void> {
    console.log(`Open connect trezor page`);
    await this.driver.clickElement(this.connectTrezorButton);
    await this.driver.clickElement(this.continueButton);
  }

  async checkFirefoxNotSupportedIsDisplayed(): Promise<void> {
    console.log('Check "Firefox Not Supported" message is displayed');
    await this.driver.waitForSelector({
      text: 'Firefox Not Supported',
    });

    // Continue button should be disabled
    const continueButton = await this.driver.findElement({
      text: 'Continue',
      tag: 'button',
    });
    const isDisabled = (await continueButton.getAttribute('disabled')) !== null;
    if (!isDisabled) {
      throw new Error('Continue button should be disabled in Firefox');
    }
  }
}

export default ConnectHardwareWalletPage;
