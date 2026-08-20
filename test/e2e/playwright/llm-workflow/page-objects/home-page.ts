import type { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  private readonly accountMenuIcon: Locator;

  private readonly accountOptionsButton: Locator;

  private readonly sendButton: Locator;

  private readonly ethPrimaryCurrency: Locator;

  private readonly ethSecondaryCurrency: Locator;

  private readonly coinPrimaryCurrency: Locator;

  private readonly coinSecondaryCurrency: Locator;

  constructor(page: Page) {
    this.page = page;

    this.accountMenuIcon = page.locator('[data-testid="account-menu-icon"]');
    this.accountOptionsButton = page.locator(
      '[data-testid="account-options-menu-button"]',
    );
    this.sendButton = page.locator('[data-testid="coin-overview-send"]');

    this.ethPrimaryCurrency = page.locator(
      '[data-testid="eth-overview__primary-currency"]',
    );
    this.ethSecondaryCurrency = page.locator(
      '[data-testid="eth-overview__secondary-currency"]',
    );
    this.coinPrimaryCurrency = page.locator(
      '[data-testid="coin-overview__primary-currency"]',
    );
    this.coinSecondaryCurrency = page.locator(
      '[data-testid="coin-overview__secondary-currency"]',
    );
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.accountMenuIcon.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns balance preferring ETH-containing values over fiat.
   * Falls back through: ethPrimary → ethSecondary → coinPrimary → coinSecondary
   */
  async getBalance(): Promise<string> {
    try {
      const ethPrimary = await this.ethPrimaryCurrency
        .textContent({ timeout: 2000 })
        .catch(() => null);
      if (ethPrimary?.includes('ETH')) {
        return ethPrimary.trim();
      }

      const ethSecondary = await this.ethSecondaryCurrency
        .textContent({ timeout: 1500 })
        .catch(() => null);
      if (ethSecondary?.includes('ETH')) {
        return ethSecondary.trim();
      }

      const coinPrimary = await this.coinPrimaryCurrency
        .textContent({ timeout: 1500 })
        .catch(() => null);
      if (coinPrimary?.includes('ETH')) {
        return coinPrimary.trim();
      }

      const coinSecondary = await this.coinSecondaryCurrency
        .textContent({ timeout: 1500 })
        .catch(() => null);
      if (coinSecondary?.includes('ETH')) {
        return coinSecondary.trim();
      }

      if (ethPrimary) {
        return ethPrimary.trim();
      }
      if (coinPrimary) {
        return coinPrimary.trim();
      }

      return '';
    } catch {
      return '';
    }
  }

  async openAccountMenu(): Promise<void> {
    await this.accountMenuIcon.click();
  }

  async openAccountOptions(): Promise<void> {
    await this.accountOptionsButton.click();
  }

  async clickSend(): Promise<void> {
    await this.sendButton.click();
  }
}
