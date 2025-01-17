import { Driver } from '../../../webdriver/driver';

class BridgeQuotePage {
  protected driver: Driver;

  private sourceAssetPickerButton = { text: 'ETH', tag: 'label' };

  private destinationAssetPickerButton =
    '[data-testid="bridge-destination-button"]';

  private assetPrickerSearchInput =
    '[data-testid="asset-picker-modal-search-input"]';

  private sourceAmount = '[data-testid="from-amount"]';

  private destinationAmount = '[data-testid="to-amount"]';

  private lineaNetwork = '[data-testid="Linea"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  enterBridgeQuote = async (
    fromAmount: string,
    token: string,
    sourceNetwork: string,
    destNetwork: string,
  ) => {
    await this.driver.fill(this.sourceAmount, fromAmount);
    await this.driver.clickElement(this.destinationAssetPickerButton);
    await this.driver.clickElement(`[data-testid="${destNetwork}"]`);
    await this.driver.fill(this.assetPrickerSearchInput, token);
    await this.driver.clickElement(
      '[data-testid="multichain-token-list-item-secondary-value"]',
    );
  };
}

export default BridgeQuotePage;
