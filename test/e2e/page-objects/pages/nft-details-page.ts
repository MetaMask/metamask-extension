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

  private readonly nftDetailsDescription =
    '[data-testid="nft-details__description"]';

  private readonly nftDetailsName = '[data-testid="nft-details__name"]';

  private readonly nftRenderedImage = '[data-testid="nft-image"]';

  private readonly nftImageContainer = '.nft-item__container';

  private readonly nftOptionsButton = '[data-testid="nft-options__button"]';

  private readonly nftRemoveButton = '[data-testid="nft-item-remove__button"]';

  private readonly nftSendButton = '[data-testid="nft-send-button"]';

  private readonly nftItemButtom = '[data-testid="nft-item"]';

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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

  async clickNFTSendButton() {
    await this.driver.clickElement(this.nftSendButton);
  }

  async clickNFTItemButton() {
    await this.driver.clickElement(this.nftItemButtom);
  }

  async removeNFT() {
    console.log('Click to remove NFT on NFT details page');
    await this.driver.clickElement(this.nftOptionsButton);
    await this.driver.clickElement(this.nftRemoveButton);
  }

  async showNftImage() {
    console.log('Click to show NFT image on NFT details page');
    await this.driver.clickElement(this.showNftImageButton);
    await this.driver.waitForSelector(this.showNftImageMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmShowNftImageButton,
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftDescriptionIsDisplayed(description: string) {
    console.log(
      'Check if NFT description is displayed on NFT details page',
      description,
    );
    await this.driver.waitForSelector({
      css: this.nftDetailsDescription,
      text: description,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftDefaultImageIsDisplayed() {
    console.log('Check if NFT default image is displayed on NFT details page');
    await this.driver.waitForSelector(this.nftDefaultImage);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftDetailsAddressIsDisplayed(address: string) {
    console.log(
      'Check if NFT address is displayed on NFT details page',
      address,
    );
    await this.driver.waitForSelector({
      css: this.nftDetailsAddress,
      text: address,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftImageContainerIsDisplayed() {
    console.log(
      'Check if NFT image container is displayed on NFT details page',
    );
    await this.driver.waitForSelector(this.nftImageContainer);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftRenderedImageIsDisplayed() {
    console.log('Check if NFT rendered image is displayed on NFT details page');
    await this.driver.waitForSelector(this.nftRenderedImage);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftNameIsDisplayed(name: string) {
    console.log('Check if NFT name is displayed on NFT details page', name);
    await this.driver.waitForSelector({
      css: this.nftDetailsName,
      text: name,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftFullImageIsDisplayed() {
    console.log('Check if NFT full image is displayed on NFT details page');
    await this.driver.waitForSelector('[data-testid="nft-item"]');
  }
}

export default NFTDetailsPage;
