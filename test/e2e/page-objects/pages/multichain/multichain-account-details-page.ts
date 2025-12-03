import { Driver } from '../../../webdriver/driver';
import { largeDelayMs } from '../../../helpers';

class MultichainAccountDetailsPage {
  private readonly driver: Driver;

  // Header elements
  private readonly backButton = '[aria-label="Back"]';

  private readonly accountNameHeader = '.multichain-page-header'; // The header title

  // Account information section
  private readonly accountAvatar = '[data-testid="avatar"]';

  private readonly accountNameRow =
    '[data-testid="account-details-row-value-account-name"]'; // First row is account name

  private readonly accountAddressRow =
    '.multichain-account-details__row:nth-of-type(2)'; // Second row is address

  private readonly accountNavigationButton =
    '[data-testid="account-address-navigation-button"]';

  // Account name editing
  private readonly editAccountNameButton = '[aria-label="Edit"]';

  private readonly accountNameInput = 'input[placeholder*="Account"]';

  private readonly confirmAccountNameButton = 'button[aria-label="Confirm"]';

  // Address and wallet navigation
  private readonly addressValue =
    '[data-testid="account-details-row-value-address"]'; // Address text

  private readonly walletValue =
    '[data-testid="account-details-row-value-wallet"]'; // Wallet text

  private readonly walletNavigationButton =
    '[data-testid="account-details-row-wallet"]';

  // Account-specific features
  private readonly showSrpButton = '[data-testid="account-show-srp-button"]';

  private readonly secretRecoveryPhraseRow =
    '[data-testid="multichain-srp-backup"]';

  // Account removal
  private readonly removeAccountButton =
    '[data-testid="account-details-row-remove-account"]';

  private readonly removeAccountModalHeader = {
    tag: 'h4',
    text: 'Remove account',
  };

  private readonly removeAccountConfirmButton = {
    css: '.mm-modal-footer__button',
    text: 'Remove',
  };

  private readonly removeAccountCancelButton = {
    css: '.mm-modal-footer__button',
    text: 'Cancel',
  };

  // QR Code and address display
  private readonly qrCodeImage = '.qr-code';

  private readonly copyAddressButton =
    '[data-testid="address-copy-button-text"]';

  private readonly viewOnEtherscanButton = {
    tag: 'button',
    text: 'View on explorer',
  };

  private readonly networksRow = { text: 'Networks' };

  private readonly privateKeyRow = { text: 'Private key' };

  // Error states
  private readonly errorMessage = '[data-testid="error-message"]';

  private readonly loadingSpinner = '[data-testid="loading-spinner"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the account details page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    console.log('Check if multichain account details page is loaded');
    await this.driver.waitForSelector(this.accountNameHeader);
    await this.driver.waitForSelector(this.accountAvatar);
    await this.driver.waitForSelector(this.accountNameRow);
    await this.driver.waitForSelector(this.accountAddressRow);
  }

  /**
   * Get the account name from the header
   */
  async getAccountName(): Promise<string> {
    const element = await this.driver.findElement(this.accountNameHeader);
    return await element.getText();
  }

  /**
   * Get the account address from the address row
   */
  async getAccountAddress(): Promise<string> {
    const element = await this.driver.findElement(this.addressValue);
    return await element.getText();
  }

  /**
   * Get the wallet name from the wallet row
   */
  async getWalletName(): Promise<string> {
    const element = await this.driver.findElement(this.walletValue);
    return await element.getText();
  }

  /**
   * Get the account name from the account name row
   */
  async getAccountNameFromRow(): Promise<string> {
    // Since the account name row contains the account name, we can get it from the row text
    const element = await this.driver.findElement(this.accountNameRow);
    const rowText = await element.getText();
    // The account name should be in the row text
    return rowText;
  }

  /**
   * Check if account icon is present
   */
  async checkAccountIconPresent(): Promise<boolean> {
    return await this.driver.isElementPresent(this.accountAvatar);
  }

  /**
   * Click on the Networks row
   */
  async clickNetworksRow(): Promise<void> {
    console.log('Click on the networks row');
    const netoworksRow = await this.driver.findElement(this.networksRow);
    await netoworksRow.click();
  }

  /**
   * Click on the private key row
   */
  async clickPrivateKeyRow(): Promise<void> {
    console.log('Click on the private key row');
    const privateKeyRow = await this.driver.findElement(this.privateKeyRow);
    await privateKeyRow.click();
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Check that the "show private key" button is not displayed
   */
  async checkShowPrivateKeyButtonIsNotDisplayed(): Promise<void> {
    console.log('Check that show private key button is not displayed');
    await this.driver.assertElementNotPresent(this.privateKeyRow);
  }

  /**
   * Click on the remove account button
   */
  async clickRemoveAccountButton(): Promise<void> {
    console.log('Click on the remove account button');
    const removeAccountButton = await this.driver.findElement(
      this.removeAccountButton,
    );
    await removeAccountButton.click();
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Click on the remove account confirm button
   */
  async clickRemoveAccountConfirmButton(): Promise<void> {
    console.log('Click on the remove account confirm button');
    const removeAccountConfirmButton = await this.driver.findElement(
      this.removeAccountConfirmButton,
    );
    await removeAccountConfirmButton.click();
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Click on the wallet row
   */
  async clickWalletRow(): Promise<void> {
    console.log('Click on the wallet row');
    await this.driver.clickElement(this.walletNavigationButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Click on the address row
   */
  async clickAddressNavigationButton(): Promise<void> {
    console.log('Click on the address navigation button');
    await this.driver.clickElement(this.accountNavigationButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Get address from share modal
   */
  async getAddressFromShareModal(): Promise<string> {
    const element = await this.driver.findElement('.qr-code__address-segments');
    return await element.getText();
  }

  /**
   * Click on the copy address button
   */
  async clickCopyAddressButton(): Promise<void> {
    console.log('Click on the copy address button');
    await this.driver.clickElement(this.copyAddressButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Click on the view on etherscan button
   */
  async clickViewOnEtherscanButton(): Promise<void> {
    console.log('Click on the view on etherscan button');
    await this.driver.clickElement(this.viewOnEtherscanButton);
    await this.driver.delay(largeDelayMs);
  }

  async clickSecretRecoveryPhraseRow(): Promise<void> {
    console.log('Click on the Secret Recovery Phrase row');
    await this.driver.clickElement(this.secretRecoveryPhraseRow);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Navigate back from account details
   */
  async navigateBack(): Promise<void> {
    console.log('Navigate back from account details');
    await this.driver.clickElement(this.backButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Edit account name
   *
   * @param newName
   */
  async editAccountName(newName: string): Promise<void> {
    console.log(`Edit account name to: ${newName}`);
    await this.driver.clickElement(this.editAccountNameButton);
    await this.driver.delay(largeDelayMs);
    await this.driver.fill(this.accountNameInput, newName);
    await this.driver.clickElement(this.confirmAccountNameButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Fill the account name input field
   *
   * @param newName
   */
  async fillAccountNameInput(newName: string): Promise<void> {
    console.log(`Fill account name input with: ${newName}`);
    await this.driver.fill(this.accountNameInput, newName);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Click the confirm account name button
   */
  async clickConfirmAccountNameButton(): Promise<void> {
    console.log('Click confirm account name button');
    await this.driver.clickElement(this.confirmAccountNameButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Navigate to wallet details
   */
  async navigateToWalletDetails(): Promise<void> {
    console.log('Navigate to wallet details');
    await this.driver.clickElement(this.walletNavigationButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Navigate to QR code view
   */
  async navigateToQrCode(): Promise<void> {
    console.log('Navigate to QR code view');
    await this.driver.clickElement(this.accountNavigationButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Check if QR code is displayed
   */
  async checkQrCodeIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.qrCodeImage);
  }

  /**
   * Check if remove account button is present
   */
  async checkRemoveAccountButtonPresent(): Promise<boolean> {
    try {
      await this.driver.findElement(this.removeAccountButton, 3000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove account
   */
  async removeAccount(): Promise<void> {
    console.log('Remove account');
    await this.driver.clickElement(this.removeAccountButton);
    await this.driver.delay(largeDelayMs);
    await this.driver.waitForSelector(this.removeAccountModalHeader);
    await this.driver.clickElement(this.removeAccountConfirmButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Cancel account removal
   */
  async cancelAccountRemoval(): Promise<void> {
    console.log('Cancel account removal');
    await this.driver.clickElement(this.removeAccountButton);
    await this.driver.delay(largeDelayMs);
    await this.driver.waitForSelector(this.removeAccountModalHeader);
    await this.driver.clickElement(this.removeAccountCancelButton);
    await this.driver.delay(largeDelayMs);
  }

  /**
   * Verify account details match expected values
   *
   * @param expectedName
   * @param expectedAddress
   * @param expectedWalletName
   */
  async verifyAccountDetails(
    expectedName: string,
    expectedAddress: string,
    expectedWalletName: string,
  ): Promise<void> {
    const actualName = await this.getAccountName();
    const actualAddress = await this.getAccountAddress();
    const actualWalletName = await this.getWalletName();

    if (actualName !== expectedName) {
      throw new Error(
        `Expected account name "${expectedName}" but got "${actualName}"`,
      );
    }
    if (actualAddress !== expectedAddress) {
      throw new Error(
        `Expected account address "${expectedAddress}" but got "${actualAddress}"`,
      );
    }
    if (actualWalletName !== expectedWalletName) {
      throw new Error(
        `Expected wallet name "${expectedWalletName}" but got "${actualWalletName}"`,
      );
    }
  }
}

export default MultichainAccountDetailsPage;
