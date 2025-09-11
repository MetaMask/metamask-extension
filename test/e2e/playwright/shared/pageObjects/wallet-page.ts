import { type Locator, type Page } from '@playwright/test';

export class WalletPage {
  readonly page: Page;

  readonly importTokensButton: Locator;

  readonly importButton: Locator;

  readonly swapButton: Locator;

  readonly activityListTab: Locator;

  readonly tokenTab: Locator;

  readonly accountMenu: Locator;

  readonly addAccountButton: Locator;

  readonly importAccountButton: Locator;

  readonly importAccountConfirmBtn: Locator;

  readonly tokenBalance: Locator;

  constructor(page: Page) {
    this.page = page;
    this.swapButton = this.page.getByTestId('token-overview-button-swap');
    this.importTokensButton = this.page.getByText('Import tokens').first();
    this.accountMenu = this.page.getByTestId('account-menu-icon');
    this.importAccountButton = this.page.getByText('Private Key');
    this.importButton = this.page.getByText('Import (');
    this.tokenTab = this.page.getByTestId('account-overview__asset-tab');
    this.tokenBalance = this.page.getByTestId(
      'multichain-token-list-item-value',
    );
    this.addAccountButton = this.page.getByTestId(
      'multichain-account-menu-popover-action-button',
    );
    this.activityListTab = this.page.getByTestId(
      'account-overview__activity-tab',
    );
    this.importAccountConfirmBtn = this.page.getByTestId(
      'import-account-confirm-button',
    );
  }

  async importTokens() {
    await this.page.waitForSelector('text=/new token/');
    await this.importTokensButton.click();
    await this.importButton.waitFor({ state: 'visible' });
    await this.importButton.click();
  }

  async importAccount(accountPK: string) {
    await this.accountMenu.waitFor({ state: 'visible' });
    await this.accountMenu.click();
    await this.addAccountButton.click();
    await this.importAccountButton.click();
    await this.page.fill('#private-key-box', accountPK);
    await this.importAccountConfirmBtn.click();
  }

  async selectTokenWallet() {
    await this.tokenTab.click();
  }

  async selectSwapAction() {
    await this.swapButton.waitFor({ state: 'visible' });
    await this.swapButton.click();
  }

  async selectActivityList() {
    await this.activityListTab.click();
  }

  async getTokenBalance() {
    return await this.tokenBalance.first().textContent();
  }

  async waitforTokenBalance(balance: string) {
    await this.page.waitForSelector(`text=/${balance}/`, { timeout: 60000 });
  }
}
