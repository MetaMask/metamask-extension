import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import Confirmation from './confirmation';

class TransactionConfirmation extends Confirmation {
  private walletInitiatedHeadingTitle: RawLocator;

  private dappInitiatedHeadingTitle: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.walletInitiatedHeadingTitle = {
      css: 'h3',
      text: tEn('review') as string,
    };
    this.dappInitiatedHeadingTitle = {
      css: 'h3',
      text: tEn('transferRequest') as string,
    };
  }

  async check_walletInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.walletInitiatedHeadingTitle);
  }

  async check_dappInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.dappInitiatedHeadingTitle);
  }
}

export default TransactionConfirmation;
