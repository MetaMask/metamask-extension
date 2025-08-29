import HomePage from './homepage';

class BitcoinHomepage extends HomePage {
  protected readonly balance =
    '[data-testid="coin-overview__primary-currency"]';

  protected readonly bridgeButton = '[data-testid="coin-overview-bridge"]';

  private readonly buySellButton = '[data-testid="coin-overview-buy"]';

  private readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  protected readonly swapButton = '[data-testid="coin-overview-swap"]';

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.buySellButton,
        this.receiveButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for bitcoin homepage to be loaded', e);
      throw e;
    }
    console.log('Bitcoin homepage is loaded');
  }

  async startSendFlow(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  /**
   * Checks if the bridge button is enabled on bitcoin account homepage.
   *
   */
  async checkIsBridgeButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.bridgeButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Bridge button not enabled', e);
      return false;
    }
    console.log('Bridge button is enabled');
    return true;
  }

  /**
   * Checks if the buy/sell button is enabled on bitcoin account homepage.
   */
  async checkIsBuySellButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.buySellButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Buy/Sell button not enabled', e);
      return false;
    }
    console.log('Buy/Sell button is enabled');
    return true;
  }

  /**
   * Checks if the expected bitcoin balance is displayed on homepage.
   *
   * @param expectedBalance - The expected bitcoin balance to be displayed. Defaults to '0'.
   */
  async checkIsExpectedBitcoinBalanceDisplayed(
    expectedBalance: number = 0,
  ): Promise<void> {
    console.log(
      `Check if expected bitcoin balance is displayed: ${expectedBalance} BTC`,
    );
    await this.driver.waitForSelector({
      css: this.balance,
      text: `${expectedBalance}BTC`,
    });
  }

  /**
   * Checks if the receive button is enabled on bitcoin account homepage.
   */
  async checkIsReceiveButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.receiveButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Receive button not enabled', e);
      return false;
    }
    console.log('Receive button is enabled');
    return true;
  }

  /**
   * Checks if the swap button is enabled on bitcoin account homepage.
   */
  async checkIsSwapButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.swapButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Swap button not enabled', e);
      return false;
    }
    console.log('Swap button is enabled');
    return true;
  }
}

export default BitcoinHomepage;
