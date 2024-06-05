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

  async checkActivityIsConfirmed(options: any) {
    // await this.page.waitForTimeout(20000000);
    const itemText = await this.activityItem.innerText();
    await expect(itemText).toEqual(options.activity);

    const status = await this.page.$(
      '[data-testid="activity-list-item-action"] + div',
    );
    const itemStatus = await this.status.innerText();
    await expect(itemStatus).toEqual('Confirmed');
  }
}
