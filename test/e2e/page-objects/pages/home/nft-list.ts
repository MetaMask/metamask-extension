import { Driver } from '../../../webdriver/driver';

class NftListPage {
  private readonly driver: Driver;

  private readonly confirmImportNftButton =
    '[data-testid="import-nfts-modal-import-button"]';

  private readonly importNftNetworkDropdown =
    '[data-testid="test-import-tokens-drop-down-custom-import"]';

  private readonly importNftNetworkName =
    '[data-testid="select-network-item-0x539"]';

  private readonly importNftAddressInput = '#address';

  private readonly importNftButton = '[data-testid="import-nfts__button"]';

  private readonly actionBarButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private readonly importNftModalTitle = { text: 'Import NFT', tag: 'h4' };

  private readonly importNftTokenIdInput = '#token-id';

  private readonly nftIconOnActivityList = '[data-testid="nft-item"]';

  private readonly noNftInfo = {
    text: 'No NFTs yet',
    tag: 'p',
  };

  private readonly successImportNftMessage = {
    text: 'NFT was successfully added!',
    tag: 'h6',
  };

  private readonly successRemoveNftMessage = {
    text: 'NFT was successfully removed!',
    tag: 'h6',
  };

  private readonly nftListItem = '[data-testid="nft-wrapper"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.clickElement(this.actionBarButton);
      await this.driver.waitForSelector(this.importNftButton);
    } catch (e) {
      console.log('Timeout while waiting for NFT list page to be loaded', e);
      throw e;
    }
    console.log('NFT list page is loaded');
  }

  async clickNFTIconOnActivityList() {
    await this.driver.clickElement(this.nftIconOnActivityList);
  }

  /**
   * Imports an NFT by entering the NFT contract address and token ID
   *
   * @param nftContractAddress - The address of the NFT contract to import
   * @param id - The ID of the NFT to import
   * @param expectedErrorMessage - Expected error message if the import should fail
   */
  async importNft(
    nftContractAddress: string,
    id: string,
    expectedErrorMessage?: string,
  ) {
    await this.driver.clickElement(this.actionBarButton);
    await this.driver.clickElement(this.importNftButton);
    await this.driver.waitForSelector(this.importNftModalTitle);
    await this.driver.clickElement(this.importNftNetworkDropdown);
    await this.driver.clickElement(this.importNftNetworkName);
    await this.driver.fill(this.importNftAddressInput, nftContractAddress);
    await this.driver.fill(this.importNftTokenIdInput, id);
    if (expectedErrorMessage) {
      await this.driver.clickElement(this.confirmImportNftButton);
      await this.driver.waitForSelector({
        tag: 'p',
        text: expectedErrorMessage,
      });
    } else {
      await this.driver.clickElementAndWaitToDisappear(
        this.confirmImportNftButton,
      );
    }
  }

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
    await this.driver.waitForSelector({
      tag: 'p',
      text: nftName,
    });
  }

  async checkNoNftInfoIsDisplayed(): Promise<void> {
    console.log('Check that no NFT info is displayed on nft tab');
    await this.driver.waitForSelector(this.noNftInfo);
  }

  async checkSuccessImportNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success imported NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successImportNftMessage);
  }

  async checkSuccessRemoveNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success removed NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successRemoveNftMessage);
  }

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

  async clickNFTFromList(index = 0, timeout = 10000): Promise<void> {
    console.log(`Clicking NFT at index ${index}`);
    const nfts = await this.driver.findElements(this.nftListItem);
    if (nfts.length === 0) {
      throw new Error('No NFTs found to select');
    }

    const element = nfts[index];
    await element.click();
    // @ts-expect-error - The waitForElementState method is not typed correctly in the driver.
    await element.waitForElementState('hidden', timeout);
    console.log(`NFT at index ${index} selected successfully`);
  }
}

export default NftListPage;
