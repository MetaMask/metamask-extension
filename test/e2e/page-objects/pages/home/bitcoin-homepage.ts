import HomePage from './homepage';

class BitcoinHomepage extends HomePage {
  protected readonly balance =
    '[data-testid="coin-overview__primary-currency"]';

  private readonly bridgeButton = {
    text: 'Bridge',
    tag: 'button',
  };

  private readonly buySellButton = '[data-testid="coin-overview-buy"]';

  private readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  private readonly swapButton = {
    text: 'Swap',
    tag: 'button',
  };

  async check_pageIsLoaded(): Promise<void> {
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

  async check_ifBridgeButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.bridgeButton, 1000);
    } catch (e) {
      console.log('Bridge button not clickable', e);
      return false;
    }
    console.log('Bridge button is clickable');
    return true;
  }

  /**
   * Checks if the expected bitcoin balance is displayed on homepage.
   *
   * @param expectedBalance - The expected bitcoin balance to be displayed. Defaults to '0'.
   */
  async check_expectedBitcoinBalanceIsDisplayed(
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

  async check_ifBuySellButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.buySellButton, 1000);
    } catch (e) {
      console.log('Buy/Sell button not clickable', e);
      return false;
    }
    console.log('Buy/Sell button is clickable');
    return true;
  }

  async check_ifReceiveButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.receiveButton, 1000);
    } catch (e) {
      console.log('Receive button not clickable', e);
      return false;
    }
    console.log('Receive button is clickable');
    return true;
  }

  async check_ifSendButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.sendButton, 1000);
    } catch (e) {
      console.log('Send button not clickable', e);
      return false;
    }
    console.log('Send button is clickable');
    return true;
  }

  async check_ifSwapButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.swapButton, 1000);
    } catch (e) {
      console.log('Swap button not clickable', e);
      return false;
    }
    console.log('Swap button is clickable');
    return true;
  }
}

export default BitcoinHomepage;
