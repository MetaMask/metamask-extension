import { type Locator, type Page } from '@playwright/test';

export class WalletPage {
  private page: Page;

  readonly importTokensButton: Locator;

  readonly importButton: Locator;

  readonly swapButton: Locator;

  readonly activityListTab: Locator;

  readonly tokenTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.swapButton = this.page.getByTestId('token-overview-button-swap');
    this.importTokensButton = this.page.getByText('Import tokens').first();
    this.importButton = this.page.getByText('Import (');
    this.tokenTab = this.page.getByTestId('account-overview__asset-tab');
    this.activityListTab = this.page.getByTestId(
      'account-overview__activity-tab',
    );
  }

  async importTokens() {
    await this.page.waitForSelector('text=/new token/');
    await this.importTokensButton.click();
    await this.importButton.waitFor({ state: 'visible' });
    await this.importButton.click();
  }

  async selectTokenWallet() {
    await this.tokenTab.click();
  }

  async selectSwapAction() {
    await this.swapButton.click();
  }

  async selectActivityList() {
    await this.activityListTab.click();
  }
}
