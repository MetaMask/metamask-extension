import { Driver } from '../../../webdriver/driver';

export type BridgeQuote = {
  amount: string;
  tokenFrom: string;
  tokenTo: string;
  fromChain: string;
  toChain: string;
  unapproved?: boolean;
};

class BridgeQuotePage {
  protected driver: Driver;

  public sourceAssetPickerButton = '[data-testid="bridge-source-button"]';

  private destinationAssetPickerButton =
    '[data-testid="bridge-destination-button"]';

  public assetPrickerSearchInput =
    '[data-testid="asset-picker-modal-search-input"]';

  private sourceAmount = '[data-testid="from-amount"]';

  private destinationAmount = '[data-testid="to-amount"]';

  private lineaNetwork = '[data-testid="Linea"]';

  public tokenButton = '[data-testid="multichain-token-list-button"]';

  private submitButton = { text: 'Submit', tag: 'button' };

  private backButton = '[aria-label="Back"]';

  private networkSelector = '[data-testid="avatar-group"]';

  private applyButton = { text: 'Apply', tag: 'button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  enterBridgeQuote = async (quote: BridgeQuote) => {
    // Source
    await this.driver.clickElement(this.sourceAssetPickerButton);
    if (quote.tokenFrom === 'ETH') {
      await this.driver.clickElement(this.networkSelector);
      await this.driver.clickElement(this.lineaNetwork);
      await this.driver.clickElement(this.applyButton);
    }
    await this.driver.fill(this.assetPrickerSearchInput, quote.tokenFrom);
    await this.driver.clickElement({
      text: quote.tokenFrom,
      css: this.tokenButton,
    });

    // QTY
    await this.driver.fill(this.sourceAmount, quote.amount);

    // Destination
    await this.driver.waitForSelector(this.destinationAssetPickerButton);
    await this.driver.clickElement(this.destinationAssetPickerButton);
    await this.driver.clickElement(`[data-testid="${quote.toChain}"]`);
    await this.driver.fill(this.assetPrickerSearchInput, quote.tokenTo);
    await this.driver.clickElement({
      text: quote.tokenTo,
      css: this.tokenButton,
    });
  };

  submitQuote = async () => {
    await this.driver.waitForSelector(this.submitButton, { timeout: 60000 });
    await this.driver.clickElement(this.submitButton);
  };

  goBack = async () => {
    await this.driver.waitForSelector(this.backButton);
    await this.driver.clickElement(this.backButton);
  };
}

export default BridgeQuotePage;
