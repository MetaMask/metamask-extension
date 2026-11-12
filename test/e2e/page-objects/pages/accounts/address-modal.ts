import { Driver } from '../../../webdriver/driver';
import { quoteXPathText } from '../../../../helpers/quoteXPathText';

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

  private readonly qrModalCopyButton =
    '[data-testid="address-qr-code-modal-copy-button"]';

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
   * Verify the displayed address matches the expected one
   *
   * @param expectedAddress - The address expected in the modal
   */
  async checkQrPopupShowsAddress(expectedAddress: string): Promise<void> {
    console.log(`Check QR popup shows address "${expectedAddress}"`);
    await this.driver.waitForSelector({
      xpath: `//*[@data-testid='account-address'][translate(normalize-space(.), ' ', '') = ${quoteXPathText(expectedAddress)}]`,
    });
  }

  /**
   * Verify the View on Etherscan button is present
   */
  async checkViewOnEtherscanButton(): Promise<void> {
    console.log('Verifying View on Etherscan button');
    await this.driver.findElement(this.viewOnEtherscanLink);
  }

  /**
   * Verify the View on Tronscan button is present
   */
  async checkViewOnTronscanButton(): Promise<void> {
    console.log('Verify View on Tronscan button is present');
    await this.driver.waitForSelector({
      css: this.viewOnEtherscanLink,
      text: 'View on Tronscan',
    });
  }

  async clickQrCopyAddressLink(expectedAddress: string): Promise<void> {
    console.log('Click copy address button in QR popup');
    await this.driver.clickElement(this.qrModalCopyButton);
    await this.driver.waitForClipboardContent(expectedAddress);
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
