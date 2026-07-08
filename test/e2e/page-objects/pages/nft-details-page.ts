import { Driver } from '../../webdriver/driver';

class NFTDetailsPage {
  private driver: Driver;

  private readonly confirmShowNftImageButton = {
    text: 'Confirm',
    tag: 'button',
  };

  private readonly nftBackButton = '[data-testid="nft__back"]';

  private readonly nftDefaultImage = '[data-testid="nft-default-image"]';

  private readonly nftDetailsAddress = '.nft-details__addressButton';

  private readonly nftDetailsAddressByText = (address: string) => ({
    css: this.nftDetailsAddress,
    text: address,
  });

  private readonly nftDetailsDescription =
    '[data-testid="nft-details__description"]';

  private readonly nftDetailsDescriptionByText = (description: string) => ({
    css: this.nftDetailsDescription,
    text: description,
  });

  private readonly nftDetailsName = '[data-testid="nft-details__name"]';

  private readonly nftDetailsNameByText = (name: string) => ({
    css: this.nftDetailsName,
    text: name,
  });

  private readonly nftImageContainer = '.nft-item__container';

  private readonly nftItemButton = '[data-testid="nft-item"]';

  private readonly nftOptionsButton = '[data-testid="nft-options__button"]';

  private readonly nftRemoveButton = '[data-testid="nft-item-remove__button"]';

  private readonly nftRenderedImage = '[data-testid="nft-image"]';

  private readonly nftSendButton = '[data-testid="nft-send-button"]';

  private readonly removeNftSuccessToast =
    '[data-testid="nft-remove-success-toast"]';

  private readonly showNftImageButton = {
    text: 'Show',
    tag: 'button',
  };

  private readonly showNftImageMessage = {
    text: 'Show NFT',
    tag: 'header',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNftDefaultImageIsDisplayed() {
    console.log('Check if NFT default image is displayed on NFT details page');
    await this.driver.waitForSelector(this.nftDefaultImage);
  }

  async checkNftDescriptionIsDisplayed(description: string) {
    console.log(
      'Check if NFT description is displayed on NFT details page',
      description,
    );
    await this.driver.waitForSelector(
      this.nftDetailsDescriptionByText(description),
    );
  }

  async checkNftDetailsAddressIsDisplayed(address: string) {
    console.log(
      'Check if NFT address is displayed on NFT details page',
      address,
    );
    await this.driver.waitForSelector(this.nftDetailsAddressByText(address));
  }

  async checkNftFullImageIsDisplayed() {
    console.log('Check if NFT full image is displayed on NFT details page');
    await this.driver.waitForSelector(this.nftItemButton);
  }

  async checkNftImageContainerIsDisplayed() {
    console.log(
      'Check if NFT image container is displayed on NFT details page',
    );
    await this.driver.waitForSelector(this.nftImageContainer);
  }

  async checkNftNameIsDisplayed(name: string) {
    console.log('Check if NFT name is displayed on NFT details page', name);
    await this.driver.waitForSelector(this.nftDetailsNameByText(name));
  }

  async checkNftRenderedImageIsDisplayed() {
    console.log('Check if NFT rendered image is displayed on NFT details page');
    await this.driver.waitForSelector(this.nftRenderedImage);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check if NFT details page is loaded');
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

  async clickNFTItemButton() {
    console.log('Click to NFT item button on NFT details page');
    await this.driver.clickElement(this.nftItemButton);
  }

  async clickNFTSendButton() {
    console.log('Click to send NFT button on NFT details page');
    await this.driver.clickElement(this.nftSendButton);
  }

  async removeNFT() {
    console.log('Click to remove NFT on NFT details page');
    await this.driver.clickElement(this.nftOptionsButton);
    await this.driver.clickElement(this.nftRemoveButton);
    await this.driver.waitForSelector(this.removeNftSuccessToast);
  }

  async showNftImage() {
    console.log('Click to show NFT image on NFT details page');
    await this.driver.clickElement(this.showNftImageButton);
    await this.driver.waitForSelector(this.showNftImageMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmShowNftImageButton,
    );
  }
}

export default NFTDetailsPage;
