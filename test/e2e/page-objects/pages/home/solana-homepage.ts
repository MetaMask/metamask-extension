import HomePage from './homepage';

class SolanaHomepage extends HomePage {
  protected readonly solanaBalance =
    '.coin-overview__primary-balance';

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

  /**
   * Checks if the expected solana balance is displayed on homepage.
   *
   * @param expectedBalance - The expected bitcoin balance to be displayed. Defaults to '0'.
   */
  async getSolanaBalance(
    expectedBalance: number = 0,
  ): Promise<string> {
    console.log(
      `Check if expected Solana balance is displayed: ${expectedBalance} SOL`,
    );
    const balanceValue = await this.driver.waitForSelector(this.solanaBalance, { timeout: 120000 })
    const singleBalanceText = await balanceValue.getText();
    const trimmedBalance = singleBalanceText.replaceAll(/\s+/g, ' ').trim()
    return singleBalanceText.replaceAll(/\s+/g, ' ').trim()
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

  /**
   * Checks if the swap button is enabled on bitcoin account homepage.
   */
  async check_isSwapButtonEnabled(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.swapButton, 1000);
    } catch (e) {
      console.log('Swap button not enabled', e);
      return false;
    }
    console.log('Swap button is enabled');
    return true;
  }
}

export default SolanaHomepage;
