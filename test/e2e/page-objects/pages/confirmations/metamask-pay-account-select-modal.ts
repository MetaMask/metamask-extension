import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

/**
 * The "Select an account" modal opened from the from-account pill on
 * quote-backed confirmations to change which wallet account funds the
 * transaction.
 *
 * Screen: modal over the confirmation.
 * Owns: the modal-loaded check and selecting an account by address.
 * Boundaries: the pill that opens the modal belongs to the confirmation page
 * object (e.g. `MoneyAccountDepositConfirmation`). Selecting an account is
 * driven from `metamask-pay.flow.ts`.
 *
 * @see ui/pages/confirmations/components/account-select-modal/account-select-modal.tsx
 */
export class MetaMaskPayAccountSelectModal {
  private readonly accountItem = (address: string) => ({
    testId: `account-select-item-${address.toLowerCase()}`,
  });

  private readonly confirmationPage = {
    testId: 'parent-selector-confirmation-page',
  };

  private readonly driver: Driver;

  private readonly title = {
    css: 'header',
    text: tEn('selectAnAccount'),
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for account select modal to load');
    await this.driver.waitForSelector(this.title);
  }

  async selectAccount(address: string): Promise<void> {
    console.log(`Select funding account ${address}`);
    await this.driver.clickElement(this.accountItem(address));
    await this.driver.assertElementNotPresent(this.title, {
      findElementGuard: this.confirmationPage,
    });
  }
}

export default MetaMaskPayAccountSelectModal;
