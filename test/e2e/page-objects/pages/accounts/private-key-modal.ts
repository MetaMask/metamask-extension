import { Driver } from '../../../webdriver/driver';

/**
 * Password gate before revealing a multichain account private key.
 *
 * Screen: password step on / from
 * `#/multichain-account-private-key-list` (opened from account details export).
 * Owns: password input, confirm, and wrong-password messaging.
 * Boundaries: authentication only. The revealed key list/rows belong to the
 * private-key list UI; account details entry is
 * `AccountDetailsPage`.
 * Related: `AccountDetailsPage` (export entry point).
 *
 * @see ui/components/multichain-accounts/multichain-private-key-list/multichain-private-key-list.tsx
 * @see ui/pages/multichain-accounts/multichain-account-private-key-list-page/multichain-account-private-key-list-page.tsx
 */
class PrivateKeyModal {
  private readonly confirmButton = '[data-testid="confirm-button"]';

  private readonly copyPrivateKeyButton =
    '[data-testid="multichain-address-row-copy-button"]';

  private driver: Driver;

  private readonly parentSelector =
    '[data-testid="parent-selector-multichain-account-private-key-list-page"]';

  private readonly privateKeyCopyButton =
    '[data-testid="multichain-private-key-copy-eip155:1"]';

  private readonly privateKeyPasswordInput =
    '[data-testid="multichain-private-key-password-input"]';

  private readonly wrontPasswordMsg = '[data-testid="wrong-password-msg"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.parentSelector,
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
   * Check that private key copy feedback is displayed.
   */
  async checkPrivateKeyIsCopied(): Promise<void> {
    await this.driver.waitForSelector({
      css: this.privateKeyCopyButton,
      text: 'Private key copied',
    });
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
   * Copy the EVM private key without revealing it.
   */
  async clickCopyPrivateKeyButton(): Promise<void> {
    await this.driver.clickElement(this.privateKeyCopyButton);
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
