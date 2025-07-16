import { Driver } from '../../webdriver/driver';

class NFTDetailsPage {
  private driver: Driver;

  private readonly nftSendButton = '[data-testid="nft-send-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickNFTSendButton() {
    await this.driver.clickElement(this.nftSendButton);
  }
}

export default NFTDetailsPage;
