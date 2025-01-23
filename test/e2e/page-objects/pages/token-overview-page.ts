import { Driver } from '../../webdriver/driver';

class TokenOverviewPage {
  private driver: Driver;

  private readonly receiveButton = {
    text: 'Receive',
    css: '.icon-button',
  };

  private readonly sendButton = {
    text: 'Send',
    css: '.icon-button',
  };

  private readonly swapButton = {
    text: 'Swap',
    css: '.icon-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.swapButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Token overview page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Token overview page is loaded');
  }

  async clickReceive(): Promise<void> {
    await this.driver.clickElement(this.receiveButton);
  }

  async clickSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async clickSwap(): Promise<void> {
    await this.driver.clickElement(this.swapButton);
  }
}

export default TokenOverviewPage;
