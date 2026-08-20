import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import { tEn } from '../../../../lib/i18n-helpers';
import Confirmation from './confirmation';

class AccountDetailsModal extends Confirmation {
  private accountBalanceInfo: RawLocator;

  private accountDetailsModalCloseButton: RawLocator;

  private addressCopiedButton: RawLocator;

  private addressCopyButton: RawLocator;

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

  async assertHeaderInfoBalance(balance: string) {
    await this.driver.waitForSelector({
      css: this.accountBalanceInfo.toString(),
      text: `${balance} ETH`,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountBalanceInfo,
        this.addressCopyButton,
        this.accountDetailsModalCloseButton,
      ]);
    } catch (error) {
      console.error(
        'Error checking if account details modal is loaded:',
        error,
      );
      throw error;
    }
  }

  async clickAccountDetailsModalCloseButton() {
    await this.driver.clickElementAndWaitToDisappear(
      this.accountDetailsModalCloseButton,
    );
  }

  async clickAddressCopyButton() {
    await this.driver.clickElement(this.addressCopyButton);
  }

  async waitForAddressCopied() {
    await this.driver.waitForSelector(this.addressCopiedButton);
  }
}

export default AccountDetailsModal;
