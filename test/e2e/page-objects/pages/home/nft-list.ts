import { Driver } from '../../../webdriver/driver';

class NftListPage {
  private readonly driver: Driver;

  private readonly confirmImportNftButton =
    '[data-testid="import-nfts-modal-import-button"]';

  private readonly importNftAddressInput = '#address';

  private readonly importNftButton = '[data-testid="import-nft-button"]';

  private readonly importNftModalTitle = { text: 'Import NFT', tag: 'header' };

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

  constructor(driver: Driver) {
    this.driver = driver;
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
    await this.driver.clickElement(this.importNftButton);
    await this.driver.waitForSelector(this.importNftModalTitle);
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

  async check_nftImageIsDisplayed(): Promise<void> {
    console.log('Check that NFT image is displayed in NFT tab on homepage');
    await this.driver.waitForSelector(this.nftIconOnActivityList);
  }

  /**
   * Checks if the NFT item with the specified name is displayed in the homepage nft tab.
   *
   * @param nftName - The name of the NFT to check for.
   */
  async check_nftNameIsDisplayed(nftName: string): Promise<void> {
    console.log(
      `Check that NFT item ${nftName} is displayed in NFT tab on homepage`,
    );
    await this.driver.waitForSelector({
      tag: 'p',
      text: nftName,
    });
  }

  async check_noNftInfoIsDisplayed(): Promise<void> {
    console.log('Check that no NFT info is displayed on nft tab');
    await this.driver.waitForSelector(this.noNftInfo);
  }

  async check_successImportNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success imported NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successImportNftMessage);
  }

  async check_successRemoveNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success removed NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successRemoveNftMessage);
  }
}

export default NftListPage;
