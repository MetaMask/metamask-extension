import HomePage from './homepage';

class NonEvmHomepage extends HomePage {
  protected readonly buySellButton = '[data-testid="coin-overview-buy"]';

  protected readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  protected readonly swapButton = '[data-testid="token-overview-button-swap"]';

  protected readonly balanceDiv =
    '[data-testid="coin-overview__primary-currency"]';

  async check_pageIsLoaded(amount: string = ''): Promise<void> {
    await super.check_pageIsLoaded();
    if (amount) {
      try {
        await this.driver.waitForSelector({
          text: `${amount}`,
          tag: 'span',
        });
      } catch (e) {
        console.log('Error in check_pageIsLoaded', e);
      }
    }
  }

  protected readonly bridgeButton = '[data-testid="coin-overview-bridge"]';

  /**
   * Clicks the send button on the non-EVM account homepage.
   */
  async clickOnSendButton(): Promise<void> {
    await this.driver.waitForControllersLoaded();
    await this.driver.clickElement(this.sendButton);
  }

  /**
   * Checks if the expected balance is displayed on homepage.
   *
   * @param balance
   * @param token
   */
  async check_getBalance(
    balance: string,
    token: string = 'SOL',
  ): Promise<void> {
    await this.driver.waitForSelector({
      text: balance,
      tag: 'span',
    });
    await this.driver.waitForSelector({
      text: token,
      tag: 'span',
    });
  }

  /**
   * Checks if the receive button is enabled on a non-evm account homepage.
   */
  async check_isReceiveButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.waitForSelector(this.receiveButton, { timeout: 5000 });
    } catch (e) {
      console.log('Receive button not enabled', e);
      return false;
    }
    console.log('Receive button is enabled');
    return true;
  }

  /**
   * Checks if the buy/sell button is enabled on a non-evm account homepage.
   */
  async check_ifBuySellButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.waitForSelector(this.buySellButton, { timeout: 5000 });
      const buySellButton = await this.driver.findClickableElement(
        this.buySellButton,
      );
      return await buySellButton.isEnabled();
    } catch (e) {
      console.log('Buy/Sell button not enabled', e);
      return false;
    }
  }
}

export default NonEvmHomepage;
