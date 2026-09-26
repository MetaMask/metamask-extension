import { Driver } from '../../../webdriver/driver';

/**
 * Single-address QR overlay: full address and view-on-explorer.
 *
 * Screen: address QR modal opened from the multichain address list (not a
 * dedicated hash route).
 * Owns: reading the displayed address, view-on-Etherscan presence, and close /
 * back.
 * Boundaries: the QR modal only. The per-network address list is
 * `AccountAddressListPage`.
 * Related: `AccountAddressListPage` (how tests open this overlay).
 *
 * @see ui/components/multichain-accounts/address-qr-code-modal/address-qr-code-modal.tsx
 */
class AccountAddressModal {
  private readonly accountAddress = '[data-testid="account-address"]';

  private readonly backButton = '[aria-label="Close"]';

  private driver: Driver;

  private readonly parentSelector =
    '[data-testid="parent-selector-address-qr-code-modal"]';

  private readonly viewOnEtherscanButton = {
    css: 'button',
    text: 'View on Etherscan',
  };

  private readonly viewOnEtherscanLink =
    '[data-testid="view-address-on-etherscan"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.parentSelector,
        this.accountAddress,
        this.viewOnEtherscanLink,
      ]);
      // Wait for modal animation to complete
      await this.driver.waitForElementToStopMoving(this.parentSelector);
    } catch (e) {
      console.log(
        'Timeout while waiting for account address modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Account address modal is loaded');
  }

  /**
   * Verify the View on Etherscan button is present
   */
  async checkViewOnEtherscanButton(): Promise<void> {
    console.log('Verifying View on Etherscan button');
    await this.driver.findElement(this.viewOnEtherscanButton);
  }

  /**
   * Get the account address from the modal
   */
  async getAccountAddress(): Promise<string> {
    console.log('Getting the address from the modal');
    // Wait for animation to complete before reading the address
    await this.driver.waitForElementToStopMoving(this.accountAddress);
    await this.driver.waitForSelector(this.accountAddress);
    const element = await this.driver.findElement(this.accountAddress);
    await this.driver.waitForNonEmptyElement(element);
    return await element.getText();
  }

  /**
   * Go back
   */
  async goBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }
}

export default AccountAddressModal;
