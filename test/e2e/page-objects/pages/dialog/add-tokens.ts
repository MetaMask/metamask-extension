import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class AddTokensModal {
  protected driver: Driver;

  private addTokenButton = { text: 'Add token', tag: 'button' };

  private tokenListItem = '.confirm-add-suggested-token__token-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.tokenListItem,
        this.addTokenButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Add tokens dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add tokens dialog was loaded');
  }

  /**
   * Waits for the specified number of suggested tokens to appear.
   *
   * @param expectedTokenCount - The expected count of suggested tokens to wait for.
   * @param timeout - Optional timeout in milliseconds (default: 10000).
   */
  async waitForSuggestedTokensCount(
    expectedTokenCount: number,
    timeout: number = 10000,
  ): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const tokens = await this.driver.findElements(this.tokenListItem);
        return tokens.length === expectedTokenCount;
      },
      { timeout, interval: 100 },
    );
  }

  /**
   * Checks the count of suggested tokens.
   *
   * @param expectedTokenCount - The expected count of suggested tokens.
   */
  async checkSuggestedTokensCount(expectedTokenCount: number) {
    const multipleSuggestedTokens = await this.driver.findElements(
      this.tokenListItem,
    );

    // Confirm the expected number of tokens are present as suggested token list
    assert.equal(multipleSuggestedTokens.length, expectedTokenCount);
  }

  async confirmAddTokens() {
    await this.driver.clickElementAndWaitForWindowToClose(this.addTokenButton);
  }
}

export default AddTokensModal;
