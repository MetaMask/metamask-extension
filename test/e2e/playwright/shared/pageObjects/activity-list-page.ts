import { expect, type Locator, type Page } from '@playwright/test';

export class ActivityListPage {
  private page: Page;

  readonly activityItem: Locator;

  readonly status: Locator;

  constructor(page: Page) {
    this.page = page;
    this.activityItem = this.page
      .getByTestId('activity-list-item-action')
      .first();

    this.status = this.page.locator('.transaction-status-label').first();
  }

  async checkActivityIsConfirmed(options: { activity: string }) {
    const itemText = await this.activityItem.innerText();
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31881
    // Fix test pattern - remove await from expect calls. Playwright expect() can be used without await when values are already resolved
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(itemText).toEqual(options.activity);

    const itemStatus = await this.status.innerText();
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31881
    // eslint-disable-next-line @typescript-eslint/await-thenable
    // Fix test pattern - remove await from expect calls. Playwright expect() can be used without await when values are already resolved
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31881
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(itemStatus).toEqual('Confirmed');
  }
}
