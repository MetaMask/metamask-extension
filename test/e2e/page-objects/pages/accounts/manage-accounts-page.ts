import { Driver } from '../../../webdriver/driver';
import { quoteXPathText } from '../../../../helpers/quoteXPathText';

/**
 * Manage Accounts page object.
 *
 * Screen: `#/manage-accounts`.
 * Owns: search, sections (pinned, wallets, hardware, imported), direct visibility toggling,
 * wallet removal, and Add Wallet navigation.
 *
 * @see ui/pages/multichain-accounts/manage-accounts/manage-accounts.tsx
 */
export class ManageAccountsPage {
  private readonly accountRemoveCancelButton =
    '[data-testid="account-remove-modal-cancel-button"]';

  private readonly accountRemoveConfirmButton =
    '[data-testid="account-remove-modal-remove-button"]';

  private readonly addWalletButton =
    '[data-testid="manage-accounts-add-wallet-button"]';

  private readonly backButton =
    '[data-testid="manage-accounts-page-back-button"]';

  private readonly driver: Driver;

  private readonly listContainer = '[data-testid="account-management-list"]';

  private readonly noResults = '[data-testid="manage-accounts-no-results"]';

  private readonly pageContainer = '[data-testid="manage-accounts-page"]';

  private readonly searchInput =
    '[data-testid="manage-accounts-search"] input';

  private readonly walletRemoveCancelButton =
    '[data-testid="wallet-remove-modal-cancel-button"]';

  private readonly walletRemoveConfirmButton =
    '[data-testid="wallet-remove-modal-remove-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async cancelAccountRemoval(): Promise<void> {
    console.log('Cancel account removal in Manage Accounts');
    await this.driver.clickElement(this.accountRemoveCancelButton);
  }

  async cancelWalletRemoval(): Promise<void> {
    console.log('Cancel wallet removal in Manage Accounts');
    await this.driver.clickElement(this.walletRemoveCancelButton);
  }

  async checkAccountIsDisplayed(accountName: string): Promise<void> {
    console.log(`Check account "${accountName}" is displayed in Manage Accounts`);
    await this.driver.waitForSelector({
      text: accountName,
      tag: 'p',
    });
  }

  async checkAccountIsNotDisplayed(accountName: string): Promise<void> {
    console.log(
      `Check account "${accountName}" is not displayed in Manage Accounts`,
    );
    await this.driver.assertElementNotPresent({
      text: accountName,
      tag: 'p',
    });
  }

  async checkAccountRowIsHidden(groupId: string): Promise<void> {
    console.log(`Check account "${groupId}" row is hidden`);
    await this.driver.waitForSelector(
      `[data-testid="account-management-row-${groupId}"].account-management-row--hidden`,
    );
  }

  async checkNoAccountsFound(): Promise<void> {
    console.log('Check no accounts found message is displayed');
    await this.driver.waitForSelector(this.noResults);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Manage Accounts page is loaded');
    await this.driver.waitForSelector(this.pageContainer);
  }

  async checkWalletSectionExists(sectionId: string): Promise<void> {
    console.log(`Check wallet section "${sectionId}" exists`);
    const section = `[data-testid="wallet-section-${sectionId}"]`;
    await this.driver.waitForSelector(section);
  }

  async clickAccountRow(groupId: string): Promise<void> {
    console.log(`Click account row "${groupId}"`);
    const row = `[data-testid="account-management-row-${groupId}"] .multichain-account-cell`;
    await this.driver.clickElement(row);
  }

  async clickAddWalletButton(): Promise<void> {
    console.log('Click Add Wallet button in Manage Accounts');
    await this.driver.clickElement(this.addWalletButton);
  }

  async clickBackButton(): Promise<void> {
    console.log('Click Back button in Manage Accounts');
    await this.driver.clickElement(this.backButton);
  }

  async clickRemoveAccount(groupId: string): Promise<void> {
    console.log(`Click remove account button for "${groupId}"`);
    const removeButton = `[data-testid="account-management-row-remove-${groupId}"]`;
    await this.driver.clickElement(removeButton);
  }

  async clickRemoveWallet(sectionId: string): Promise<void> {
    console.log(`Click remove wallet button for section "${sectionId}"`);
    const removeButton = `[data-testid="wallet-section-header-${sectionId}-remove-button"]`;
    await this.driver.clickElement(removeButton);
  }

  async confirmAccountRemoval(): Promise<void> {
    console.log('Confirm account removal in Manage Accounts');
    await this.driver.clickElement(this.accountRemoveConfirmButton);
  }

  async confirmWalletRemoval(): Promise<void> {
    console.log('Confirm wallet removal in Manage Accounts');
    await this.driver.clickElement(this.walletRemoveConfirmButton);
  }

  async search(text: string): Promise<void> {
    console.log(`Search in Manage Accounts for "${text}"`);
    await this.driver.fill(this.searchInput, text);
  }

  async toggleAccountVisibility(groupId: string): Promise<void> {
    console.log(`Toggle account visibility for "${groupId}"`);
    const toggleButton = `[data-testid="account-management-row-visibility-toggle-${groupId}"]`;
    await this.driver.clickElement(toggleButton);
  }

  async toggleAccountVisibilityByAccountName(
    accountName: string,
  ): Promise<void> {
    console.log(
      `Toggle account visibility for account name "${accountName}" in Manage Accounts`,
    );
    const rowXpath = `//*[contains(@class, 'account-management-row') and .//*[contains(@class, 'multichain-account-cell__account-name') and text()=${quoteXPathText(accountName)}]]//button[contains(@data-testid, 'account-management-row-visibility-toggle-')]`;
    await this.driver.clickElement({ xpath: rowXpath });
  }

  async toggleSectionExpand(sectionId: string): Promise<void> {
    console.log(`Toggle section expand for section "${sectionId}"`);
    const header = `[data-testid="wallet-section-header-${sectionId}"]`;
    await this.driver.clickElement(header);
  }
}

export default ManageAccountsPage;
