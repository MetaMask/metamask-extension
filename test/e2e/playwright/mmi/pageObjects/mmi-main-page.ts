import { expect, test, type Locator, type Page } from '@playwright/test';

export class MMIMainPage {
  readonly page: Page;

  readonly activityTab: Locator;

  readonly NFTsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.activityTab = page.getByRole('button', { name: /activity/iu });
    this.NFTsTab = page.getByRole('button', { name: /nfts/iu });
  }

  async closeWhatsNewBanner() {
    await this.page.locator('data-testid=popover-close').click();
  }

  async bringToFront() {
    await this.page.bringToFront();
  }

  async openActivityTab() {
    await this.activityTab.click();
  }

  async checkLastTransactionStatus(status: string | RegExp) {
    // NOTE: Assumes that transaction is the first one on the activity list
    await expect(
      this.page.locator('.transaction-status-label').first(),
    ).toHaveText(status, { timeout: 60000, ignoreCase: true });
  }

  async checkLastTransactionCSS(status: string) {
    // NOTE: Assumes that transaction is the first one on the activity list
    await expect(
      this.page.locator(
        `.transaction-list-item >> nth=0 >> transaction-status--${status}`,
      ),
    ).toBeVisible();
  }

  async getCustodianTXId() {
    return (await this.page
      .locator('.test-transaction-meta')
      .first()
      .getAttribute('data-custodiantransactionid')) as string;
  }

  async selectMainAction(action: string) {
    await this.page
      .locator(`.wallet-overview__buttons >> text=${action}`)
      .click();
  }

  async sendFunds(account: string, amount: string) {
    await this.page
      .getByTestId('recipient-group')
      .locator(`text="${account}"`)
      .click();
    await expect(
      this.page.locator('.ens-input__selected-input__title'),
    ).toHaveText(`${account}`);
    await this.page.locator('input.unit-input__input').type(`${amount}`);
    await this.page.locator('text="Next"').click();
    await this.page.locator('text="Confirm"').click();
    await this.page.locator('text="Approve"').click();
  }

  async mainPageScreenshot(screenshotName: string, accountName: string) {
    // Scroll to the top of the page to avoid flakiness
    await this.page.mouse.wheel(0, -500);

    const fundsDetails = this.page.getByTestId(
      'multichain-token-list-item-value',
    );
    const accountsFunds = this.page.locator('.wallet-overview__balance');
    const accountMenu = this.page.getByTestId('account-menu-icon');
    await expect(accountMenu).toHaveText(accountName);
    await test.expect.soft(this.page).toHaveScreenshot(screenshotName, {
      fullPage: true,
      mask: [accountsFunds, fundsDetails, accountMenu],
      maxDiffPixelRatio: 0.02,
    });
  }
}
