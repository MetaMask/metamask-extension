import { type Locator, type Page } from '@playwright/test';

export class SwapPage {
  private page: Page;

  readonly toggleSmartSwap: Locator;

  readonly updateSettingsButton: Locator;

  readonly swapFromDropDown: Locator;

  readonly swapToDropDown: Locator;

  readonly tokenSearch: Locator;

  readonly tokenList: Locator;

  readonly tokenQty: Locator;

  readonly fetchQuoteButton: Locator;

  readonly swapTokenButton: Locator;

  readonly backButton: Locator;

  readonly switchTokensButton: Locator;

  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toggleSmartSwap = this.page.locator('text="On"');
    this.updateSettingsButton = this.page.getByTestId(
      'update-transaction-settings-button',
    );
    this.swapFromDropDown = this.page.getByTestId(
      'prepare-swap-page-swap-from',
    );
    this.swapToDropDown = this.page.getByTestId('prepare-swap-page-swap-to');
    this.switchTokensButton = this.page.getByTestId(
      'prepare-swap-page-switch-tokens',
    );
    this.tokenSearch = this.page.locator(
      '[id="list-with-search__text-search"]',
    );
    this.tokenList = this.page.getByTestId(
      'searchable-item-list-primary-label',
    );
    this.tokenQty = this.page.getByTestId(
      'prepare-swap-page-from-token-amount',
    );
    this.fetchQuoteButton = this.page.getByText('Fetch quote');
    this.swapTokenButton = this.page.locator('button', { hasText: 'Swap' });
    this.closeButton = this.page.getByText('Close');
    this.backButton = this.page.locator('[title="Cancel"]');
  }

  async fetchQuote(options: { from?: string; to: string; qty: string }) {
    // Enter Swap Quantity
    await this.tokenQty.fill(options.qty);

    // Enter source token
    if (options.from) {
      this.swapFromDropDown.click();
      await this.tokenSearch.fill(options.from);
      await this.selectTokenFromList(options.from);
    }

    // Enter destionation token
    await this.swapToDropDown.click();
    await this.tokenSearch.fill(options.to);
    await this.selectTokenFromList(options.to);
  }

  async swap() {
    await this.waitForCountDown();

    // Clear Swap Anyway button if present
    const swapAnywayButton = await this.page.$('text=/Swap anyway/');
    if (swapAnywayButton) {
      await swapAnywayButton.click();
    }
    await this.swapTokenButton.click();
  }

  async switchTokens() {
    // Wait for swap button to appear
    await this.swapTokenButton.waitFor();
    await this.switchTokensButton.click();
    await this.waitForCountDown();
  }

  async gotBack() {
    await this.backButton.click();
  }

  async waitForCountDown(second: number = 23) {
    await this.page.waitForSelector(`text=/New quotes in 0:${second}/`);
  }

  async waitForTransactionToComplete() {
    await this.page.waitForSelector('text=/Transaction complete/');
    await this.closeButton.click(); // Close button
  }

  async waitForInsufficentBalance() {
    await this.page.waitForSelector('text="Insufficient balance"');
    await this.waitForCountDown();
  }

  async selectTokenFromList(symbol: string) {
    let searchItem;
    do {
      searchItem = await this.tokenList.first().textContent();
    } while (searchItem !== symbol);

    await this.tokenList.first().click();
  }

  async waitForSearchListToPopulate(symbol: string): Promise<void> {
    let searchItem;
    do {
      searchItem = await this.tokenList.first().textContent();
    } while (searchItem !== symbol);

    return await this.tokenList.first().click();
  }
}
