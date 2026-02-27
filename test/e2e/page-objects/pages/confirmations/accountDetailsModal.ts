import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import { tEn } from '../../../../lib/i18n-helpers';
import Confirmation from './confirmation';

class AccountDetailsModal extends Confirmation {
  private accountBalanceInfo: RawLocator;

  private addressCopyButton: RawLocator;

  private addressCopiedButton: RawLocator;

  private accountDetailsModalCloseButton: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.accountBalanceInfo =
      '[data-testid="confirmation-account-details-modal__account-balance"]';

    this.addressCopyButton = '[data-testid="address-copy-button-text"]';

    this.addressCopiedButton = {
      text: tEn('copiedExclamation') as string,
      tag: 'div',
    };

    this.accountDetailsModalCloseButton =
      '[data-testid="confirmation-account-details-modal__close-button"]';
  }

  async clickAddressCopyButton() {
    await this.driver.clickElement(this.addressCopyButton);
  }

  async waitForAddressCopied() {
    await this.driver.waitForSelector(this.addressCopiedButton);
  }

  async clickAccountDetailsModalCloseButton() {
    await this.driver.clickElement(this.accountDetailsModalCloseButton);
  }

  async assertHeaderInfoBalance(balance: string) {
    await this.driver.waitForSelector({
      css: this.accountBalanceInfo.toString(),
      text: `${balance} ETH`,
    });
  }
}

export default AccountDetailsModal;
