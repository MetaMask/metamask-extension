import { type Locator, type Page } from '@playwright/test';

export class SwapPage {
  private page: Page;

  private swapQty: string;

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

  readonly viewInActivityBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.swapQty = '';
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
    this.viewInActivityBtn = this.page.getByTestId(
      'page-container-footer-next',
    );
  }

  async enterQuote(options: {
    from?: string;
    to: string;
    qty: string;
    checkBalance: boolean;
  }) {
    // Enter source token
    const native = await this.page.$(`text=/${options.from}/`);
    if (!native && options.from) {
      this.swapFromDropDown.click();
      await this.selectTokenFromList(options.from);
    }

    const balanceString = await this.page
      .locator('[class*="balance"]')
      .first()
      .textContent();
    if (balanceString && options.checkBalance) {
      if (parseFloat(balanceString.split(' ')[1]) <= parseFloat(options.qty)) {
        await this.goBack();
        // not enough balance so cancel out
        return false;
      }
    }

    // Enter Swap Quantity
    await this.page.waitForTimeout(1000);
    await this.tokenQty.waitFor({ state: 'visible' });
    await this.tokenQty.fill(options.qty);
    this.swapQty = options.qty;

    // Enter destination token
    await this.swapToDropDown.click();
    await this.selectTokenFromList(options.to);
    return true;
  }

  async waitForQuote() {
    let quoteFound = false;
    do {
      // Clear Swap Anyway button if present
      const swapAnywayButton = await this.page.$('text=/Swap anyway/');
      if (swapAnywayButton) {
        await swapAnywayButton.click();
      }

      // No quotes available
      const noQuotes = await this.page.$('text=/No quotes available/');
      if (noQuotes) {
        await this.goBack();
        break;
      }

      if (await this.page.$('text=/New quotes in/')) {
        quoteFound = true;
        break;
      }
      await this.page.waitForTimeout(1000);
    } while (!quoteFound);

    return quoteFound;
  }

  async swap() {
    await this.waitForCountDown();
    await this.swapTokenButton.click();
  }

  async switchTokenOrder() {
    // Wait for swap button to appear
    await this.swapTokenButton.waitFor();
    await this.switchTokensButton.click();
    await this.waitForCountDown();
  }

  async goBack() {
    await this.backButton.click();
  }

  async waitForCountDown(second: number = 23) {
    await this.page.waitForSelector(`text=/New quotes in 0:${second}/`);
  }

  async waitForTransactionToComplete(options: { seconds: number }) {
    let countSecond = options.seconds;
    let transactionCompleted;
    do {
      transactionCompleted = await this.page.$('text=/Transaction complete/');
      if (transactionCompleted) {
        await this.closeButton.click();
        break;
      }

      await this.page.waitForTimeout(1000);
      countSecond -= 1;
    } while (countSecond);

    if (!transactionCompleted && !countSecond) {
      await this.viewInActivityBtn.click();
      return false;
    }
    return true;
  }

  async waitForInsufficentBalance() {
    await this.page.waitForSelector('text="Insufficient balance"');
    await this.waitForCountDown();
  }

  async selectTokenFromList(symbol: string) {
    await this.tokenSearch.waitFor();
    await this.tokenSearch.fill(symbol);
    await this.page.waitForTimeout(1000);
    const regex = new RegExp(`^${symbol}$`, 'u');
    const searchItem = await this.tokenList.filter({ hasText: regex });
    await searchItem.click({ timeout: 5000 });
  }
}
