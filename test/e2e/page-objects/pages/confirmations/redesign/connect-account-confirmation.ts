import { shortenAddress } from '../../../../../../ui/helpers/utils/util';
import { Driver } from '../../../../webdriver/driver';

class ConnectAccountConfirmation {
  driver: Driver;

  private readonly connectAccountConfirmationButton = {
    text: 'Connect',
    tag: 'button',
  };

  private readonly connectAccountConfirmationTitle = {
    text: 'Connect this website with MetaMask',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.connectAccountConfirmationTitle,
        this.connectAccountConfirmationButton,
      ]);
    } catch (e) {
      console.log(
        `Timeout while waiting for Connect Account confirmation page to be loaded`,
        e,
      );
      throw e;
    }
    console.log(`Connect Account confirmation page is loaded`);
  }

  async confirmConnect(): Promise<void> {
    console.log('Confirm connection on Connect Account confirmation page');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.connectAccountConfirmationButton,
    );
  }

  async check_isAccountDisplayed(account: string): Promise<void> {
    let accountShort = shortenAddress(account);
    if (accountShort.startsWith('0X')) {
      accountShort = accountShort.replace('0X', '0x');
    }

    await this.driver.waitForSelector({
      text: accountShort,
      tag: 'p',
    });
  }
}

export default ConnectAccountConfirmation;
