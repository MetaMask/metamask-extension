import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import Confirmation from './confirmation';

class TransactionConfirmation extends Confirmation {
  private walletInitiatedHeadingTitle: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.walletInitiatedHeadingTitle = {
      css: 'h3',
      text: tEn('review') as string,
    };
  }

  async check_walletInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.walletInitiatedHeadingTitle);
  }
}

export default TransactionConfirmation;
