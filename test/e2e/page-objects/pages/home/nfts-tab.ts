import HomePage from './homepage';

/**
 * Home NFTs tab: grid and empty state.
 *
 * Screen: `#/` NFTs tab (`account-overview__nfts-tab`), reached via
 * `HomePage.goToNftTab()`.
 * Owns: NFT grid items and names, empty state, opening the import NFT page,
 * and import/remove success toasts.
 * Boundaries: homepage chrome and other tabs stay on `HomePage`. The import
 * form is `ImportNftPage`. Full NFT detail screens are outside this object —
 * `clickNFTIconOnActivityList` only opens one.
 * Related: `HomePage` (`goToNftTab`), `ImportNftPage`.
 *
 * @see ui/components/app/assets/nfts/nfts-tab/nfts-tab.tsx
 */
class NftsTab extends HomePage {
  private readonly actionBarButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private readonly importNftButton = '[data-testid="import-nfts__button"]';

  private readonly nftIconOnActivityList = '[data-testid="nft-item"]';

  private readonly nftNameByText = (nftName: string) => ({
    tag: 'p',
    text: nftName,
  });

  private readonly nftsPage = {
    testId: 'parent-selector-nfts-tab',
  };

  private readonly noNftInfo = '[data-testid="nft-tab-empty-state"]';

  private readonly successImportNftMessage =
    '[data-testid="nft-import-success-toast"]';

  private readonly successRemoveNftMessage =
    '[data-testid="nft-remove-success-toast"]';

  /**
   * Checks if the NFT icon is displayed in the NFT tab on the homepage.
   */
  async checkNftImageIsDisplayed(): Promise<void> {
    console.log('Check that NFT image is displayed in NFT tab on homepage');
    await this.driver.waitForSelector(this.nftIconOnActivityList);
  }

  /**
   * Checks if the NFT item with the specified name is displayed in the homepage nft tab.
   *
   * @param nftName - The name of the NFT to check for.
   */
  async checkNftNameIsDisplayed(nftName: string): Promise<void> {
    console.log(
      `Check that NFT item ${nftName} is displayed in NFT tab on homepage`,
    );
    await this.driver.waitForSelector(this.nftNameByText(nftName));
  }

  /**
   * Checks if the no NFT info is displayed in the NFT tab on the homepage.
   */
  async checkNoNftInfoIsDisplayed(): Promise<void> {
    console.log('Check that no NFT info is displayed on nft tab');
    await this.driver.waitForSelector(this.noNftInfo);
  }

  /**
   * Checks if the number of NFTs displayed in the NFT tab on the homepage is the expected number.
   *
   * @param expectedNumberOfNfts - The expected number of NFTs to display.
   */
  async checkNumberOfNftsDisplayed(
    expectedNumberOfNfts: number,
  ): Promise<void> {
    console.log(
      `Check that ${expectedNumberOfNfts} NFTs are displayed in NFT tab on homepage`,
    );
    await this.driver.wait(async () => {
      const nftIconOnActivityList = await this.driver.findElements(
        this.nftIconOnActivityList,
      );
      return nftIconOnActivityList.length === expectedNumberOfNfts;
    }, 10000);

    console.log(`${expectedNumberOfNfts} NFTs found in NFT list on homepage`);
  }

  /**
   * Checks if the NFT tab page is loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.nftsPage);
    console.log('NFT list page is loaded');
  }

  /**
   * Checks if the success imported NFT message is displayed in the NFT tab on the homepage.
   */
  async checkSuccessImportNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success imported NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successImportNftMessage);
  }

  /**
   * Checks if the success removed NFT message is displayed in the NFT tab on the homepage.
   */
  async checkSuccessRemoveNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success removed NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successRemoveNftMessage);
  }

  /**
   * Clicks the NFT icon on the activity list.
   */
  async clickNFTIconOnActivityList() {
    console.log('Clicking NFT icon on activity list');
    await this.driver.clickElement(this.nftIconOnActivityList);
  }

  /**
   * Opens the Import NFT page from the NFTs tab overflow menu.
   */
  async openImportNft(): Promise<void> {
    console.log('Open the Import NFT page from the NFTs tab');
    await this.driver.clickElement(this.actionBarButton);
    await this.driver.clickElement(this.importNftButton);
  }
}

export default NftsTab;
