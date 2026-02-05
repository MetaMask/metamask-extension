import { type Locator, type Page, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly sendButton: Locator;
  readonly activityTab: Locator;
  readonly tokensTab: Locator;
  readonly balance: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sendButton = this.page.getByTestId('eth-overview-send');
    this.activityTab = this.page.getByTestId('account-overview__activity-tab');
    this.tokensTab = this.page.getByTestId('account-overview__asset-tab');
    this.balance = this.page.locator('[data-testid="eth-overview__primary-currency"]');
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking Home page is loaded');
    await expect(this.sendButton).toBeVisible();
    await expect(this.activityTab).toBeVisible();
    await expect(this.tokensTab).toBeVisible();
    console.log('Home page is loaded');
  }

  /**
   * Checks if the expected balance is displayed on homepage.
   *
   * @param expectedBalance - The expected balance to be displayed. Defaults to '25'.
   * @param symbol - The symbol of the currency or token. Defaults to 'ETH'.
   */
  async checkExpectedBalanceIsDisplayed(
    expectedBalance: string = '25',
    symbol: string = 'ETH',
  ): Promise<void> {
    console.log(`Checking expected balance ${expectedBalance} ${symbol} is displayed on homepage`);
    await expect(this.balance).toContainText(expectedBalance);
    console.log(`Expected balance ${expectedBalance} ${symbol} is displayed on homepage`);
  }
}