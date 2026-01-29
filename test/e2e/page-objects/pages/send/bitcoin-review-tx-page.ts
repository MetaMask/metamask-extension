import { id } from 'ethers/lib/utils';
import { Driver } from '../../../webdriver/driver';

class BitcoinReviewTxPage {
  private driver: Driver;

  private readonly cancelButton =
    '[data-testid="confirmation-cancel-snap-footer-button"]';

  private readonly confirmButton =
    '[data-testid="confirmation-confirm-snap-footer-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.cancelButton,
        this.cancelButton,
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

  async clickConfirmButton() {
    console.log('Click confirm button on bitcoin review tx page');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }

  async checkNetworkFeeIsDisplayed(fee: string): Promise<void> {
    console.log(
      `Check if network fee ${fee} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${fee} BTC`,
      tag: 'p',
    });
  }

  async checkSendAmountIsDisplayed(amount: string): Promise<void> {
    console.log(
      `Check if send amount ${amount} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `-${amount} BTC`,
      tag: 'p',
    });
  }

  async checkTotalAmountIsDisplayed(total: string): Promise<void> {
    console.log(
      `Check if total amount ${total} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${total} USD`,
      tag: 'p',
    });
  }
}

export default BitcoinReviewTxPage;
