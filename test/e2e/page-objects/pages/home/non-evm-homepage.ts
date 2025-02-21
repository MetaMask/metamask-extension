import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
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
        await this.driver.waitForSelector(
          {
            text: `${amount}`,
            tag: 'span',
          },
          { timeout: 61000 }, // added this timeout because of this bug https://consensyssoftware.atlassian.net/browse/SOL-173
        );
      } catch (e) {
        console.log('Error in check_pageIsLoaded', e);
      }
    }
    await this.driver.delayFirefox(2000);
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
   */
  async check_getBalance(balance: string): Promise<void> {
    const div = await this.driver.findElement(By.css(this.balanceDiv), 62000); // There is a bug on the chrome job that runs on the snap and it gets updated after a minute
    const spans = await div.findElements(By.css('span'));
    // Extract and concatenate the inner text of the span elements
    let innerText = '';
    for (const span of spans) {
      if (innerText) {
        innerText += ' ';
      }
      innerText += await span.getText();
    }
    assert.equal(innerText, balance);
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
