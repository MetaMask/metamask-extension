import { regularDelayMs } from '../../../helpers';
import HomePage from './homepage';

class NonEvmHomepage extends HomePage {
  protected readonly buySellButton = '[data-testid="coin-overview-buy"]';

  protected readonly receiveButton = '[data-testid="coin-overview-receive"]';

  protected readonly sendButton = '[data-testid="coin-overview-send"]';

  protected readonly swapButton = '[data-testid="token-overview-button-swap"]';

  protected readonly balanceDiv =
    '[data-testid="coin-overview__primary-currency"]';

  protected readonly bridgeButton = '[data-testid="coin-overview-bridge"]';

  async checkPageIsLoaded(amount: string = ''): Promise<void> {
    await super.checkPageIsLoaded();
    await this.driver.delay(regularDelayMs); // workaround to avoid flakiness
    if (amount) {
      await this.driver.wait(async () => {
        await this.driver.waitForSelector({
          text: `${amount}`,
          tag: 'span',
        });
        return true;
      }, 60000);
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
  async checkGetBalance(
    balance: string,
    token: string = 'SOL',
  ): Promise<void> {
    await this.driver.waitForSelector(
      {
        text: balance,
        tag: 'span',
      },
      { timeout: 30000 },
    );

    await this.driver.waitForSelector(
      {
        text: token,
        tag: 'span',
      },
      { timeout: 30000 },
    );
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
