import { Driver } from '../../../webdriver/driver';

/**
 * Add suggested token(s) confirmation dialog (`wallet_watchAsset` / suggested tokens).
 *
 * Screen: notification/dialog window opened when a dapp suggests one or more
 * tokens to add to the wallet.
 * Owns: suggested token list items, token-count wait, and the "Add token"
 * confirm control that closes the window.
 * Boundaries: stops at this suggested-token confirmation. Asset list / token
 * details after add belong to home/asset page objects. Redesigned token
 * confirmation helpers may also live under `pages/confirmations/`.
 * Related: `pages/confirmations/add-token-confirmations.ts`, token watch-asset
 * specs.
 *
 * @see ui/pages/confirm-add-suggested-token/confirm-add-suggested-token.js
 */
class AddTokensModal {
  private addTokenButton = { text: 'Add token', tag: 'button' };

  protected driver: Driver;

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

  async confirmAddTokens() {
    await this.driver.clickElementAndWaitForWindowToClose(this.addTokenButton);
  }

  /**
   * Waits for the specified number of suggested tokens to appear.
   *
   * @param expectedTokenCount - The expected count of suggested tokens to wait for.
   */
  async waitUntilXTokens(expectedTokenCount: number): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const tokens = await this.driver.findElements(this.tokenListItem);
        return tokens.length === expectedTokenCount;
      },
      { timeout: 10000, interval: 100 },
    );
  }
}

export default AddTokensModal;
