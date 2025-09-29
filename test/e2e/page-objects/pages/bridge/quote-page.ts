import { strict as assert } from 'assert';
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

  private mutlichainAssetPicker =
    '[data-testid="multichain-asset-picker__network"]';

  public assetPrickerSearchInput =
    '[data-testid="asset-picker-modal-search-input"]';

  private sourceAmount = '[data-testid="from-amount"]';

  private destinationAmount = '[data-testid="to-amount"]';

  private lineaNetwork = '[data-testid="Linea"]';

  public tokenButton = '[data-testid="multichain-token-list-button"]';

  private submitButton = { text: 'Swap', tag: 'button' };

  private insufficientFundsButton = {
    text: 'Insufficient funds',
    tag: 'button',
  };

  private backButton = '[aria-label="Back"]';

  private networkSelector = '[data-testid="avatar-group"]';

  private networkFees = '[data-testid="network-fees"]';

  private applyButton = { text: 'Apply', tag: 'button' };

  private confirmButton =
    '[data-testid="confirm-sign-and-send-transaction-confirm-snap-footer-button"]';

  private selectAllButton = { text: 'Select all', tag: 'button' };

  private noOptionAvailable = {
    text: `This trade route isn't available right now. Try changing the amount, network, or token and we'll find the best option.`,
    css: '.mm-text--body-md',
  };

  private moreETHneededForGas = {
    text: `You don't have enough ETH to pay the gas fee for this bridge. Enter a smaller amount or buy more ETH.`,
    css: '.mm-text--body-md',
  };

  private switchTokensButton = '[data-testid="switch-tokens"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  enterBridgeQuote = async (quote: BridgeQuote) => {
    // Source
    await this.driver.clickElement(this.sourceAssetPickerButton);
    await this.driver.clickElement(this.networkSelector);
    await this.driver.clickElement(this.selectAllButton);
    await this.driver.clickElement(`[data-testid="${quote.fromChain}"]`);
    await this.driver.clickElementAndWaitToDisappear(this.applyButton);

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

    // After clicking destination, we might see either:
    // 1. Network selection modal (if destination is pre-populated and different from desired network)
    // 2. Token picker with network badge (if destination is empty or on the correct network)

    // Check if we're in the network selection modal (has network options visible)
    const networkOptionExists = await this.driver.isElementPresent(
      `[data-testid="${quote.toChain}"]`,
    );

    if (!networkOptionExists) {
      // We're in token picker, need to click network badge first
      await this.driver.waitForSelector(this.mutlichainAssetPicker);
      await this.driver.clickElement(this.mutlichainAssetPicker);
    }

    // Now select the destination network
    await this.driver.clickElementAndWaitToDisappear(
      `[data-testid="${quote.toChain}"]`,
    );
    await this.driver.fill(this.assetPrickerSearchInput, quote.tokenTo);
    await this.driver.clickElementAndWaitToDisappear({
      text: quote.tokenTo,
      css: this.tokenButton,
    });
    await this.driver.assertElementNotPresent(
      {
        tag: 'p',
        text: 'Fetching quotes...',
      },
      { waitAtLeastGuard: 1000 },
    );
  };

  waitForQuote = async () => {
    await this.driver.waitForSelector(this.submitButton, { timeout: 30000 });
  };

  submitQuote = async () => {
    await this.driver.clickElement(this.submitButton);
  };

  confirmBridgeTransaction = async () => {
    await this.driver.clickElement(this.confirmButton);
  };

  goBack = async () => {
    await this.driver.waitForSelector(this.backButton);
    await this.driver.clickElement(this.backButton);
  };

  async searchAssetAndVerifyCount(
    searchInput: string,
    count: number,
  ): Promise<void> {
    console.log(`Fill search input with ${searchInput}`);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, searchInput);
    await this.driver.elementCountBecomesN(this.tokenButton, count);
  }

  async checkTokenIsDisabled() {
    const [tkn] = await this.driver.findElements(this.tokenButton);

    await tkn.click();
    const isSelected = await tkn.isSelected();
    assert.equal(isSelected, false);
  }

  async checkNoTradeRouteMessageIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.noOptionAvailable);
    } catch (e) {
      console.log(
        `Expected message that "no trade route is available" is not present`,
      );
      throw e;
    }
    console.log('The message "no trade route is available" is displayed');
  }

  async checkInsufficientFundsButtonIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.insufficientFundsButton);
    } catch (e) {
      console.log(`Expected button "Insufficient funds" is not present`);
      throw e;
    }
    console.log('The button "Insufficient funds" is displayed');
  }

  async checkMoreETHneededIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.moreETHneededForGas);
    } catch (e) {
      console.log(
        `Expected message that "More ETH needed for gas" is not present`,
      );
      throw e;
    }
    console.log('The message "More ETH needed for gas" is displayed');
  }

  async checkExpectedNetworkFeeIsDisplayed(): Promise<void> {
    try {
      const balance = await this.driver.waitForSelector(this.networkFees);
      const currentBalanceText = await balance.getText();
      // Verify that the text matches the pattern $XXX.XX
      const pricePattern = /^\$\d+\.\d{2}$/u;
      if (!pricePattern.test(currentBalanceText)) {
        throw new Error(`Price format is not valid: ${currentBalanceText}`);
      }
    } catch (e: unknown) {
      console.log(
        `Error checking price format: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
      throw e;
    }
    console.log('Price matches expected format');
  }

  async switchTokens(): Promise<void> {
    await this.driver.clickElement(this.switchTokensButton);
  }
}

export default BridgeQuotePage;
