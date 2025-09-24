import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import TransactionConfirmation from './transaction-confirmation';

class SetApprovalForAllTransactionConfirmation extends TransactionConfirmation {
  private setApprovalForAllTitleElement: RawLocator;

  private setApprovalForAllSubHeadingElement: RawLocator;

  private revokeSetApprovalForAllTitleElement: RawLocator;

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
    this.revokeSetApprovalForAllTitleElement = {
      css: 'h2',
      text: tEn('confirmTitleSetApprovalForAllRevokeTransaction') as string,
    };
  }

  async checkSetApprovalForAllTitle() {
    await this.driver.waitForSelector(this.setApprovalForAllTitleElement);
  }

  async checkSetApprovalForAllSubHeading() {
    await this.driver.waitForSelector(this.setApprovalForAllSubHeadingElement);
  }

  async checkRevokeSetApprovalForAllTitle() {
    await this.driver.waitForSelector(this.revokeSetApprovalForAllTitleElement);
  }
}

export default SetApprovalForAllTransactionConfirmation;
