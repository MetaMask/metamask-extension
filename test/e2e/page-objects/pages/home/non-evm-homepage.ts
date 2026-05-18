import HomePage from './homepage';

class NonEvmHomepage extends HomePage {
  protected readonly buySellButton = '[data-testid="coin-overview-buy"]';

  protected readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  protected readonly swapButton = '[data-testid="coin-overview-swap"]';

  protected readonly balanceDiv =
    '[data-testid="coin-overview__primary-currency"]';

  protected readonly bridgeButton = '[data-testid="coin-overview-bridge"]';

  /**
   * Extends {@link HomePage.checkPageIsLoaded}; optionally waits for aggregated balance text.
   *
   * @param options - Optional post-load checks.
   * @param options.amount - When set, waits until this string appears in a balance `span`.
   */
  async checkPageIsLoaded(options: { amount?: string } = {}): Promise<void> {
    const { amount } = options;
    await super.checkPageIsLoaded();
    if (amount) {
      await this.driver.waitForSelector({ text: `${amount}`, tag: 'span' });
    }
  }

  /**
   * Clicks the bridge button on the non-EVM account homepage.
   */
  async clickOnBridgeButton(): Promise<void> {
    await this.driver.waitForSelector(this.bridgeButton);
    await this.driver.clickElement(this.bridgeButton);
  }

  /**
   * Clicks the swap button on the non-EVM account homepage.
   */
  async clickOnSwapButton(): Promise<void> {
    await this.driver.waitForSelector(this.swapButton);
    await this.driver.clickElement(this.swapButton);
  }

  /**
   * Clicks the send button on the non-EVM account homepage.
   */
  async clickOnSendButton(): Promise<void> {
    await this.driver.waitForSelector(this.sendButton);
    await this.driver.clickElement(this.sendButton);
  }

  /**
   * Checks if the expected balance is displayed on homepage.
   *
   * @param balance
   * @param token
   */
  async checkGetBalance(balance: string, token: string = 'SOL'): Promise<void> {
    await this.driver.waitForSelector({
      text: balance,
      tag: 'span',
    });

    if (token) {
      await this.driver.waitForSelector({
        text: token,
        tag: 'span',
      });
    }
  }

  /**
   * Checks if the receive button is enabled on a non-evm account homepage.
   */
  async checkIsReceiveButtonEnabled(): Promise<boolean> {
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
  async checkIfBuySellButtonIsClickable(): Promise<boolean> {
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
