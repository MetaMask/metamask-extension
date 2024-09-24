import { tEn } from '../../../lib/i18n-helpers';
import { Driver } from '../../webdriver/driver';
import { RawLocator } from '../common';
import TransactionConfirmation from './transaction-confirmation';

class SetApprovalForAllTransactionConfirmation extends TransactionConfirmation {
  private setApprovalForAllTitleElement: RawLocator;

  private setApprovalForAllSubHeadingElement: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.setApprovalForAllTitleElement = {
      css: 'h2',
      text: tEn('setApprovalForAllRedesignedTitle') as string,
    };
    this.setApprovalForAllSubHeadingElement = {
      css: 'p',
      text: tEn('confirmTitleDescApproveTransaction') as string,
    };
  }

  async check_setApprovalForAllTitle() {
    await this.driver.waitForSelector(this.setApprovalForAllTitleElement);
  }

  async check_setApprovalForAllSubHeading() {
    await this.driver.waitForSelector(this.setApprovalForAllSubHeadingElement);
  }
}

export default SetApprovalForAllTransactionConfirmation;
