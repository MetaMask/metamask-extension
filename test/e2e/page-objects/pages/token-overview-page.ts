import { Driver } from '../../webdriver/driver';

class TokenOverviewPage {
  private driver: Driver;

  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly receiveButton = {
    text: 'Receive',
    css: '.icon-button',
  };

  private readonly sendButton = {
    text: 'Send',
    css: '.icon-button',
  };

  private readonly swapButton = {
    text: 'Swap',
    css: '.icon-button',
  };

  private readonly viewAssetInExplorerButton = {
    text: 'View Asset in explorer',
    tag: 'div',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        // this.swapButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Token overview page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Token overview page is loaded');
  }

  async clickReceive(): Promise<void> {
    await this.driver.clickElement(this.receiveButton);
  }

  async clickSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async clickSwap(): Promise<void> {
    await this.driver.clickElement(this.swapButton);
  }

  /**
   * This method opens the asset in explorer.
   */
  async viewAssetInExplorer(): Promise<void> {
    console.log('Viewing asset in explorer');
    await this.driver.clickElement(this.assetOptionsButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.viewAssetInExplorerButton,
    );
  }
}

export default TokenOverviewPage;
