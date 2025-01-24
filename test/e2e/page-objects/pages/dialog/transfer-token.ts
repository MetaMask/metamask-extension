import { Driver } from '../../../webdriver/driver';

class TransferTokenModal {
  protected driver: Driver;

  private addTokenButton = { text: 'Add token', tag: 'button' };

  private tokenListItem = '.confirm-add-suggested-token__token-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
  }

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
  async check_suggestedTokensCount(expectedTokenCount: number): Promise<void> {
    console.log(`Check ${expectedTokenCount} suggested tokens are displayed`);
    await this.driver.wait(async () => {
      const multipleSuggestedTokens = await this.driver.findElements(
        this.tokenListItem,
      );
      return multipleSuggestedTokens.length === expectedTokenCount;
    }, 10000);
  }

  async confirmAddTokens() {
    await this.driver.clickElementAndWaitForWindowToClose(this.addTokenButton);
  }
}

export default TransferTokenModal;
