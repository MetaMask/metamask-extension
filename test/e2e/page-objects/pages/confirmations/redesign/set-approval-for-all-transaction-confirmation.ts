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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_setApprovalForAllTitle() {
    await this.driver.waitForSelector(this.setApprovalForAllTitleElement);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_setApprovalForAllSubHeading() {
    await this.driver.waitForSelector(this.setApprovalForAllSubHeadingElement);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_revokeSetApprovalForAllTitle() {
    await this.driver.waitForSelector(this.revokeSetApprovalForAllTitleElement);
  }
}

export default SetApprovalForAllTransactionConfirmation;
