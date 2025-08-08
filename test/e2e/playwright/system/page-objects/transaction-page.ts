import { Page, Locator, expect } from '@playwright/test';

export class TransactionPage {
  readonly page: Page;
  readonly sendButton: Locator;
  readonly recipientInput: Locator;
  readonly amountInput: Locator;
  readonly nextButton: Locator;
  readonly confirmButton: Locator;
  readonly rejectButton: Locator;
  readonly gasEditButton: Locator;
  readonly activityTab: Locator;
  readonly transactionList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sendButton = page.locator('[data-testid="eth-overview-send"]');
    this.recipientInput = page.locator('[data-testid="ens-input"]');
    this.amountInput = page.locator('.unit-input__input');
    this.nextButton = page.locator('button:has-text("Next")');
    this.confirmButton = page.locator('[data-testid="page-container-footer-next"]');
    this.rejectButton = page.locator('[data-testid="page-container-footer-cancel"]');
    this.gasEditButton = page.locator('[data-testid="edit-gas-fee-button"]');
    this.activityTab = page.locator('[data-testid="account-overview__activity-tab"]');
    this.transactionList = page.locator('[data-testid="activity-list-item"]');
  }

  async initiateTransaction(recipient: string, amount: string) {
    await this.sendButton.click();
    await this.recipientInput.fill(recipient);
    await this.amountInput.fill(amount);
    await this.nextButton.click();
  }

  async confirmTransaction() {
    await this.confirmButton.click();
  }

  async rejectTransaction() {
    await this.rejectButton.click();
  }

  async editGasFee(gasPrice?: string, gasLimit?: string) {
    await this.gasEditButton.click();

    if (gasPrice) {
      await this.page.fill('[data-testid="gas-price-input"]', gasPrice);
    }

    if (gasLimit) {
      await this.page.fill('[data-testid="gas-limit-input"]', gasLimit);
    }

    await this.page.click('button:has-text("Save")');
  }

  async waitForTransactionConfirmation() {
    await this.page.waitForSelector('[data-testid="transaction-confirmation"]', { timeout: 30000 });
  }

  async waitForTransactionComplete() {
    await this.page.waitForSelector('.transaction-status--confirmed', { timeout: 60000 });
  }

  async getTransactionStatus(): Promise<string> {
    const statusElement = await this.page.locator('.transaction-status').first();
    return await statusElement.textContent() || '';
  }

  async getTransactionHistory() {
    await this.activityTab.click();
    await this.page.waitForSelector('[data-testid="activity-list-item"]');

    const transactions = await this.transactionList.all();
    const history = [];

    for (const transaction of transactions) {
      const status = await transaction.locator('.transaction-status').textContent();
      const amount = await transaction.locator('.transaction-list-item__primary-currency').textContent();
      const recipient = await transaction.locator('.transaction-list-item__address').textContent();

      history.push({
        status: status?.trim(),
        amount: amount?.trim(),
        recipient: recipient?.trim(),
      });
    }

    return history;
  }

  async waitForPendingTransaction() {
    await this.page.waitForSelector('.transaction-status--pending', { timeout: 10000 });
  }

  async assertTransactionDetails(expectedRecipient: string, expectedAmount: string) {
    const recipient = await this.page.locator('[data-testid="sender-to-recipient__recipient"]').textContent();
    const amount = await this.page.locator('[data-testid="transaction-detail-value"]').textContent();

    expect(recipient).toContain(expectedRecipient);
    expect(amount).toContain(expectedAmount);
  }

  async assertGasFeePresent() {
    const gasFee = await this.page.locator('[data-testid="transaction-detail-gas"]');
    await expect(gasFee).toBeVisible();
  }

  async getGasFee(): Promise<string> {
    const gasFeeElement = await this.page.locator('[data-testid="transaction-detail-gas"]');
    return await gasFeeElement.textContent() || '';
  }
}
