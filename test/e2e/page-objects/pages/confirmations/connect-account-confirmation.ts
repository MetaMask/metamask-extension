import { Driver } from '../../../webdriver/driver';

class ConnectAccountConfirmation {
  private readonly accountListItem = (accountName: string) => ({
    testId: `multichain-account-cell-name-${accountName}`,
  });

  private readonly accountSection = {
    testId: 'account-selection-section',
  };

  private readonly cancelConnectButton = {
    testId: 'cancel-btn',
  };

  private readonly confirmConnectButton = {
    testId: 'confirm-btn',
  };

  private readonly connectAccountConfirmationTitle = {
    text: 'Connect this website with MetaMask',
    tag: 'p',
  };

  driver: Driver;

  private readonly originHeader = (origin: string) => ({
    tag: 'h3',
    text: origin,
  });

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async cancelConnect(): Promise<void> {
    console.log('Cancel connection on Connect Account confirmation page');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.cancelConnectButton,
    );
  }

  async checkForAccountsInPermissionList(accounts: string[]): Promise<void> {
    for (const account of accounts) {
      await this.driver.waitForSelector(this.accountListItem(account));
    }
  }

  async checkPageIsLoaded({
    origin = '127.0.0.1',
  }: { origin?: string } = {}): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.connectAccountConfirmationTitle,
      this.confirmConnectButton,
      this.originHeader(origin),
    ]);
    console.log(`Connect Account confirmation page is loaded`);
  }

  async confirmConnect(): Promise<void> {
    console.log('Confirm connection on Connect Account confirmation page');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmConnectButton,
    );
  }

  async isConfirmButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.confirmConnectButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Confirm button not enabled', e);
      return false;
    }
    console.log('Confirm button is enabled');
    return true;
  }

  async openEditAccountsModal(): Promise<void> {
    console.log('Open edit accounts modal');
    await this.driver.clickElement(this.accountSection);
  }
}

export default ConnectAccountConfirmation;
