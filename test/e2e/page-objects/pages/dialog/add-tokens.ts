import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class AddTokensModal {
  protected driver: Driver;

  private addTokenButton = { text: 'Add token', tag: 'button' };

  private tokenListItem = '.confirm-add-suggested-token__token-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
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
   * Checks the count of suggested tokens.
   *
   * @param expectedTokenCount - The expected count of suggested tokens.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_SuggestedTokensCount(expectedTokenCount: number) {
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
