import type { Page } from '@playwright/test';

export type NotificationType =
  | 'connect'
  | 'signature'
  | 'transaction'
  | 'add-network'
  | 'switch-network'
  | 'add-token'
  | 'unknown';

export class NotificationPage {
  constructor(private page: Page) {}

  async getNotificationType(): Promise<NotificationType> {
    const selectors: Array<{ type: NotificationType; selector: string }> = [
      {
        type: 'connect',
        selector: '[data-testid="page-container-footer-next"]',
      },
      {
        type: 'signature',
        selector: '[data-testid="signature-request-scroll-button"]',
      },
      { type: 'signature', selector: '[data-testid="confirm-footer-button"]' },
      {
        type: 'transaction',
        selector: '[data-testid="confirm-footer-button"]',
      },
      {
        type: 'add-network',
        selector: '[data-testid="confirmation-submit-button"]',
      },
      {
        type: 'switch-network',
        selector: '[data-testid="confirmation-submit-button"]',
      },
      {
        type: 'add-token',
        selector: '[data-testid="page-container-footer-next"]',
      },
    ];

    for (const { type, selector } of selectors) {
      const isVisible = await this.page
        .locator(selector)
        .isVisible({ timeout: 500 })
        .catch(() => false);
      if (isVisible) {
        return type;
      }
    }

    return 'unknown';
  }

  async approve(): Promise<void> {
    const approveSelectors = [
      '[data-testid="page-container-footer-next"]',
      '[data-testid="confirm-footer-button"]',
      '[data-testid="confirmation-submit-button"]',
      '[data-testid="confirm-btn"]',
    ];

    for (const selector of approveSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.click();
        return;
      }
    }

    throw new Error(
      'Could not find approve button. Tried selectors: ' +
        approveSelectors.join(', '),
    );
  }

  async reject(): Promise<void> {
    const rejectSelectors = [
      '[data-testid="page-container-footer-cancel"]',
      '[data-testid="confirm-footer-cancel-button"]',
      '[data-testid="confirmation-cancel-button"]',
      '[data-testid="cancel-btn"]',
    ];

    for (const selector of rejectSelectors) {
      const button = this.page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.click();
        return;
      }
    }

    throw new Error(
      'Could not find reject button. Tried selectors: ' +
        rejectSelectors.join(', '),
    );
  }

  async scrollAndApprove(): Promise<void> {
    const scrollButton = this.page.locator(
      '[data-testid="signature-request-scroll-button"]',
    );
    if (await scrollButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await scrollButton.click();
      await this.page.waitForTimeout(500);
    }

    await this.approve();
  }

  async getTitle(): Promise<string> {
    const titleSelectors = [
      '[data-testid="signature-request-title"]',
      '.confirm-page-container-header__title',
      '[data-testid="page-container-header-title"]',
      'h2',
    ];

    for (const selector of titleSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
        return (await element.textContent()) ?? '';
      }
    }

    return '';
  }

  async getMessage(): Promise<string> {
    const messageSelectors = [
      '[data-testid="signature-request-data"]',
      '.confirm-page-container-content__data',
      '[data-testid="request-signature-message"]',
    ];

    for (const selector of messageSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
        return (await element.textContent()) ?? '';
      }
    }

    return '';
  }

  async getTransactionDetails(): Promise<{
    to: string | null;
    amount: string | null;
    gasEstimate: string | null;
  }> {
    const toElement = this.page
      .locator('[data-testid="transaction-details-recipient-address"]')
      .first();
    const amountElement = this.page
      .locator('[data-testid="transaction-details-amount"]')
      .first();
    const gasElement = this.page
      .locator('[data-testid="transaction-details-gas-fee"]')
      .first();

    return {
      to: (await toElement.isVisible({ timeout: 500 }).catch(() => false))
        ? await toElement.textContent()
        : null,
      amount: (await amountElement
        .isVisible({ timeout: 500 })
        .catch(() => false))
        ? await amountElement.textContent()
        : null,
      gasEstimate: (await gasElement
        .isVisible({ timeout: 500 })
        .catch(() => false))
        ? await gasElement.textContent()
        : null,
    };
  }

  async waitForClose(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (this.page.isClosed()) {
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    throw new Error(`Notification page did not close within ${timeoutMs}ms`);
  }

  getPage(): Page {
    return this.page;
  }
}
