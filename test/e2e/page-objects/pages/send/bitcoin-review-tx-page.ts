import { Driver } from '../../../webdriver/driver';

class BitcoinReviewTxPage {
  private driver: Driver;

  private readonly reviewPageTitle = {
    text: 'Review',
    tag: 'h4',
  };

  private readonly sendButton = {
    text: 'Send',
    tag: 'span',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.reviewPageTitle,
        this.sendButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for bitcoin review tx page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bitcoin review tx page is loaded');
  }

  async clickSendButton() {
    console.log('Click send button on bitcoin review tx page');
    await this.driver.clickElementAndWaitToDisappear(this.sendButton);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_feeRateIsDisplayed(feeRate: string): Promise<void> {
    console.log(
      `Check if fee rate ${feeRate} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${feeRate} sat/vB`,
      tag: 'p',
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_networkFeeIsDisplayed(fee: string): Promise<void> {
    console.log(
      `Check if network fee ${fee} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${fee} sats`,
      tag: 'p',
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_sendAmountIsDisplayed(amount: string): Promise<void> {
    console.log(
      `Check if send amount ${amount} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${amount} BTC`,
      tag: 'h2',
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_totalAmountIsDisplayed(total: string): Promise<void> {
    console.log(
      `Check if total amount ${total} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${total} BTC`,
      tag: 'p',
    });
  }
}

export default BitcoinReviewTxPage;
