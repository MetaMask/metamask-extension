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
}

export default BitcoinReviewTxPage;
