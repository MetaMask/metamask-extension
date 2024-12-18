import { Driver } from '../../../webdriver/driver';
import { strict as assert } from 'assert';

class AddTokensModal {
  protected driver: Driver;

  private addTokenButton = { text: 'Add token', tag: 'button' };

  private tokenListItem = '.confirm-add-suggested-token__token-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks the count of suggested tokens.
   *
   * @param expectedTokenCount - The expected count of suggested tokens.
   */
  async check_SuggestedTokensCount(expectedTokenCount: number) {
    const multipleSuggestedTokens = await this.driver.findElements(
      this.tokenListItem,
    );

    // Confirm the expected number of tokens are present as suggested token list
    assert.equal(multipleSuggestedTokens.length, expectedTokenCount);
  }

  async confirmAddTokens() {
    await this.driver.clickElement(this.addTokenButton);
  }
}

export default AddTokensModal;
