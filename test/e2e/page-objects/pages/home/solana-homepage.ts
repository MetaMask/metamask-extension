import HomePage from './homepage';

class SolanaHomepage extends HomePage {
  protected readonly solanaBalance =
    '[data-testid="coin-overview__primary-currency"]';

  private readonly buySellButton = '[data-testid="coin-overview-buy"]';

  private readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  private readonly swapButton = {
    text: 'Swap',
    tag: 'button',
  };

  /**
   * Checks if the expected solana balance is displayed on homepage.
   *
   * @param expectedBalance - The expected bitcoin balance to be displayed. Defaults to '0'.
   */
  async getSolanaBalance(): Promise<string> {
    console.log(`Getting Solana balance`);
    const balanceValue = await this.driver.waitForSelector(this.solanaBalance, {
      timeout: 120000,
    });
    await this.driver.delay(10000);
    const singleBalanceText = await balanceValue.getText();
    const trimmedBalance = singleBalanceText.replaceAll(/\s+/g, ' ').trim();
    return trimmedBalance;
  }

  /**
   * Checks if the receive button is enabled on bitcoin account homepage.
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

  async clickOnSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }
}

export default SolanaHomepage;
