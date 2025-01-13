import HomePage from './homepage';

class NonEvmHomepage extends HomePage {
  protected readonly buySellButton = '[data-testid="coin-overview-buy"]';

  protected readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  protected readonly swapButton = '[data-testid="token-overview-button-swap"]';

  /**
   * Checks if the expected balance is displayed on homepage.
   *
   * @param balance
   */
  async check_getBalance(balance: string): Promise<void> {
    console.log(`Getting Non-evm account balance`);
    await this.driver.waitForSelector(
      {
        css: 'div',
        text: balance,
      },
      { timeout: 5000 },
    );
  }

  /**
   * Checks if the receive button is enabled on a non-evm account homepage.
   */
  async check_isReceiveButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.receiveButton, 1000);
    } catch (e) {
      console.log('Receive button not enabled', e);
      return false;
    }
    console.log('Receive button is enabled');
    return true;
  }

  /**
   * Checks if the swap button is enabled on a non-evm account homepage.
   */
  async check_ifSwapButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.swapButton, 1000);
    } catch (e) {
      console.log('Swap button not enabled', e);
      return false;
    }
    console.log('Swap button is enabled');
    return true;
  }

  /**
   * Checks if the buy/sell button is enabled on a non-evm account homepage.
   */
  async check_ifBuySellButtonIsClickable(): Promise<void> {
    await this.driver.findClickableElement(this.buySellButton, 1000);
  }

  /**
   * Checks if the send button is enabled on a non-evm account homepage.
   */
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

  /**
   * Checks if the bridge button is enabled on a non-evm account homepage.
   */
  async check_ifBridgeButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.bridgeButton, 1000);
    } catch (e) {
      console.log('Bridge button not enabled', e);
      return false;
    }
    console.log('Bridge button is enabled');
    return true;
  }

  async clickOnSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }
}

export default NonEvmHomepage;
