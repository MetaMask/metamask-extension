import { Driver } from '../../../webdriver/driver';

class SnapTxInsights {
  private driver: Driver;

  private readonly insightTitle = {
    text: 'Insights Example Snap',
    tag: 'span',
  };

  private readonly transactionType = '.snap-ui-renderer__text';

  private readonly transactionAddress = '[data-testid="snap-ui-address"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.insightTitle,
        this.transactionAddress,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Snap txInsight section to be loaded under transaction confirmation dialog',
        e,
      );
      throw e;
    }
    console.log(
      'Snap txInsight section is loaded under transaction confirmation dialog',
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_transactionInsightsTitle() {
    console.log('Checking transaction insights title');
    await this.driver.waitForSelector(this.insightTitle);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_transactionInsightsType(transactionType: string) {
    console.log('Checking transaction insights type');
    await this.driver.waitForSelector({
      css: this.transactionType,
      text: transactionType,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_transactionAddress(address: string) {
    console.log('Checking transaction address');
    await this.driver.waitForSelector({
      css: this.transactionAddress,
      text: address,
    });
  }
}

export default SnapTxInsights;
