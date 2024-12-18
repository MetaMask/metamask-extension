import { Driver } from '../../webdriver/driver';

class TokenOverviewPage {
  private driver: Driver;

  private readonly sendButton = '[data-testid="coin-overview-send"]';

  private readonly receiveButton = '[data-testid="coin-overview-receive"]';

  private readonly swapButton = '[data-testid="token-overview-button-swap"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.receiveButton,
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

  async clickSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async clickReceive(): Promise<void> {
    await this.driver.clickElement(this.receiveButton);
  }

  async clickSwap(): Promise<void> {
    await this.driver.clickElement(this.swapButton);
  }
}

export default TokenOverviewPage;
