import { Driver } from '../../../webdriver/driver';

/**
 * Password gate before revealing a multichain account private key.
 *
 * Screen: password step on / from
 * `#/multichain-account-private-key-list` (opened from account details export).
 * Owns: password input, confirm, and wrong-password messaging.
 * Boundaries: authentication only. The revealed key list/rows belong to the
 * private-key list UI; account details entry is
 * `MultichainAccountDetailsPage`.
 * Related: `MultichainAccountDetailsPage` (export entry point).
 *
 * @see ui/components/multichain-accounts/multichain-private-key-list/multichain-private-key-list.tsx
 * @see ui/pages/multichain-accounts/multichain-account-private-key-list-page/multichain-account-private-key-list-page.tsx
 */
class PrivateKeyModal {
  private readonly confirmButton = '[data-testid="confirm-button"]';

  private driver: Driver;

  private readonly privateKeyPasswordInput =
    '[data-testid="multichain-private-key-password-input"]';

  private readonly wrontPasswordMsg = '[data-testid="wrong-password-msg"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.privateKeyPasswordInput,
        this.confirmButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for private key modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Private key modal is loaded');
  }

  /**
   * Check wrong password message
   */
  async checkWrongPasswordMsgIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.wrontPasswordMsg);
  }

  /**
   * Confirm button
   */
  async clickConfirm(): Promise<void> {
    await this.driver.clickElement(this.confirmButton);
  }

  /**
   * Enter Password
   *
   * @param password
   */
  async typePassword(password: string): Promise<void> {
    await this.driver.fill(this.privateKeyPasswordInput, password);
  }
}

export default PrivateKeyModal;
