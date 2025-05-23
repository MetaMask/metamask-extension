import { regularDelayMs } from '../../../helpers';
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

  protected readonly bridgeButton = '[data-testid="coin-overview-bridge"]';

  /**
   * Clicks the send button on the non-EVM account homepage.
   */
  async clickOnSendButton(): Promise<void> {
    await this.driver.delay(regularDelayMs); // workaround to avoid flakiness
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
    await this.driver.wait(async () => {
      try {
        await this.driver.waitForSelector(
          {
            text: balance,
            tag: 'span',
          },
          { timeout: 1000 },
        );
        return true;
      } catch (e) {
        console.log('Error in check_getBalance', e);
        await this.driver.refresh();
        return false;
      }
    }, 30000);
    await this.driver.waitForSelector(
      {
        text: token,
        tag: 'span',
      },
      { timeout: 60000 },
    );
    await this.driver.refresh();
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
