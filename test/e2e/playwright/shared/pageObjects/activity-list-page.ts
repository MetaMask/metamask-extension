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
    await expect(itemText).toEqual(options.activity);

    const itemStatus = await this.status.innerText();
    await expect(itemStatus).toEqual('Confirmed');
  }
}
