import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import TransactionConfirmation from './transaction-confirmation';

/**
 * SetApprovalForAll (and revoke) confirmation on the redesigned confirm
 * screen.
 *
 * Screen: `#/confirmation` for setApprovalForAll transaction types.
 * Owns: set-approval-for-all / revoke titles and approve-transaction
 * subtitle checks.
 * Boundaries: inherits gas and shared transaction helpers from
 * `TransactionConfirmation`. ERC-20 spending-cap approvals are
 * `ERC20ApproveTransactionConfirmation`.
 * Related: `TransactionConfirmation`, `ERC20ApproveTransactionConfirmation`.
 *
 * @see ui/pages/confirmations/components/confirm/info/set-approval-for-all-info/set-approval-for-all-info.tsx
 */
class SetApprovalForAllTransactionConfirmation extends TransactionConfirmation {
  private revokeSetApprovalForAllTitleElement: RawLocator;

  private setApprovalForAllSubHeadingElement: RawLocator;

  private setApprovalForAllTitleElement: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.setApprovalForAllTitleElement = {
      css: 'h2',
      text: tEn('setApprovalForAllRedesignedTitle'),
    };
    this.setApprovalForAllSubHeadingElement = {
      css: 'p',
      text: tEn('confirmTitleDescApproveTransaction'),
    };
    this.revokeSetApprovalForAllTitleElement = {
      css: 'h2',
      text: tEn('confirmTitleSetApprovalForAllRevokeTransaction'),
    };
  }

  async checkRevokeSetApprovalForAllTitle() {
    await this.driver.waitForSelector(this.revokeSetApprovalForAllTitleElement);
  }

  async checkSetApprovalForAllSubHeading() {
    await this.driver.waitForSelector(this.setApprovalForAllSubHeadingElement);
  }

  async checkSetApprovalForAllTitle() {
    await this.driver.waitForSelector(this.setApprovalForAllTitleElement);
  }
}

export default SetApprovalForAllTransactionConfirmation;
