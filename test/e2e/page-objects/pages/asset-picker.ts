import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';

export class AssetPicker {
  private driver: Driver;

  // Selectors
  private readonly assetPickerButton = '[data-testid="asset-picker-button"]';

  private readonly searchInput =
    '[data-testid="asset-picker-modal-search-input"]';

  private readonly tokenListButton =
    '[data-testid="multichain-token-list-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Opens the asset picker modal
   *
   * @param context - 'source' for first picker, 'dest' for second picker in flows like send
   */
  async openAssetPicker(context: 'source' | 'dest' = 'dest'): Promise<void> {
    console.log(`Opening asset picker with context: ${context}`);
    const buttons = await this.driver.findElements(this.assetPickerButton);
    const indexOfButtonToClick = context === 'dest' ? 1 : 0;
    await buttons[indexOfButtonToClick].click();
  }

  /**
   * Searches for an asset and verifies the expected count of results
   *
   * @param searchInput - The text to search for
   * @param expectedCount - The expected number of search results
   */
  async searchAssetAndVerifyCount(
    searchInput: string,
    expectedCount: number,
  ): Promise<void> {
    console.log(`Fill search input with ${searchInput}`);
    await this.driver.pasteIntoField(this.searchInput, searchInput);

    await this.driver.elementCountBecomesN(this.tokenListButton, expectedCount);
  }

  /**
   * Checks if a token is disabled (not selectable)
   */
  async checkTokenIsDisabled(): Promise<void> {
    const [token] = await this.driver.findElements(this.tokenListButton);
    await token.click();
    const isSelected = await token.isSelected();
    assert.equal(isSelected, false);
  }
}

export default AssetPicker;
