import { Driver } from '../../webdriver/driver';

class NFTDetailsPage {
  private driver: Driver;

  private readonly nftSendButton = '[data-testid="nft-send-button"]';

  private readonly nftItemButtom = '[data-testid="nft-item"]';

  private readonly nftOptionsButton = '[data-testid="nft-options__button"]';

  private readonly nftBackButton = '[data-testid="nft__back"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickNFTSendButton() {
    await this.driver.clickElement(this.nftSendButton);
  }

  async clickNFTItemButton() {
    await this.driver.clickElement(this.nftItemButtom);
  }

  async check_nftFullImageIsDisplayed() {
    console.log('Check if NFT full image is displayed on NFT details page');
    await this.driver.waitForSelector('[data-testid="nft-item"]');
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.nftSendButton,
        this.nftOptionsButton,
        this.nftBackButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for NFT details page to be loaded', e);
      throw e;
    }
    console.log('NFT details page is loaded');
  }
}

export default NFTDetailsPage;
