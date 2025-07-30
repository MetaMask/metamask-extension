import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';

class AssetPicker {
  private driver: Driver;

  // Selectors
  private readonly assetPickerButton = '[data-testid="asset-picker-button"]';

  private readonly nftTab = { css: 'button', text: 'NFTs' };

  private readonly noNftInfo = {
    text: 'No NFTs yet',
    tag: 'p',
  };

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

  async openNftAssetPicker(): Promise<void> {
    console.log('Opening NFT asset picker');
    await this.driver.clickElement(this.nftTab);
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
   * Checks if the NFT item with the specified name is displayed in the asset picker.
   *
   * @param nftName - The name of the NFT to check for.
   */
  async checkNftNameIsDisplayed(nftName: string): Promise<void> {
    console.log(`Check that NFT item ${nftName} is displayed in asset picker`);
    await this.driver.waitForSelector({
      tag: 'p',
      text: nftName,
    });
  }

  async checkNoNftInfoIsDisplayed(): Promise<void> {
    console.log('Check that no NFT info is displayed on asset picker');
    await this.driver.waitForSelector(this.noNftInfo);
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
