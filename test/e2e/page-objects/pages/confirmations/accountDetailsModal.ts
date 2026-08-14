import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import { tEn } from '../../../../lib/i18n-helpers';
import Confirmation from './confirmation';

/**
 * Account details modal opened from a confirmation header.
 *
 * Screen: overlay modal on a redesigned confirmation (not a hash route).
 * Owns: account balance display, address copy / copied feedback, and close.
 * Boundaries: extends `Confirmation` for shared helpers, but this object is
 * scoped to the account-details modal only. Opening it via the header button
 * belongs to `Confirmation`; after close, control returns to the parent
 * confirmation.
 * Related: `Confirmation` (how tests get here).
 *
 * @see ui/pages/confirmations/components/confirm/header/header-info.tsx
 */
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
