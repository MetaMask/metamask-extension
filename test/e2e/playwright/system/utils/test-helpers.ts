import { Page, expect } from '@playwright/test';

export class TestHelpers {
  static async waitForElementWithText(page: Page, text: string, timeout: number = 30000) {
    await page.waitForSelector(`text=${text}`, { timeout });
  }

  static async waitForTestId(page: Page, testId: string, timeout: number = 30000) {
    await page.waitForSelector(`[data-testid="${testId}"]`, { timeout });
  }

  static async clickByTestId(page: Page, testId: string) {
    await page.click(`[data-testid="${testId}"]`);
  }

  static async fillByTestId(page: Page, testId: string, value: string) {
    await page.fill(`[data-testid="${testId}"]`, value);
  }

  static async getTextByTestId(page: Page, testId: string): Promise<string> {
    const element = page.locator(`[data-testid="${testId}"]`);
    return await element.textContent() || '';
  }

  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  static async assertElementVisible(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
  }

  static async assertElementHidden(page: Page, selector: string) {
    const element = page.locator(selector);
    await expect(element).toBeHidden();
  }

  static async assertTextContains(page: Page, selector: string, expectedText: string) {
    const element = page.locator(selector);
    await expect(element).toContainText(expectedText);
  }

  static async waitForTransactionToComplete(page: Page, maxWaitTime: number = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if transaction is confirmed
        const confirmedStatus = page.locator('.transaction-status--confirmed');
        if (await confirmedStatus.isVisible()) {
          return true;
        }

        // Check if transaction failed
        const failedStatus = page.locator('.transaction-status--failed');
        if (await failedStatus.isVisible()) {
          return false;
        }

        await page.waitForTimeout(1000);
      } catch (error) {
        // Continue waiting
      }
    }

    throw new Error(`Transaction did not complete within ${maxWaitTime}ms`);
  }

  static generateRandomAddress(): string {
    // Generate a random Ethereum address for testing
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  static generateRandomAmount(): string {
    // Generate a small random amount for testing
    return (Math.random() * 0.01).toFixed(6);
  }

  static async dismissAnyModal(page: Page) {
    // Try to dismiss any modal that might be open
    const modals = [
      '[data-testid="modal-close-button"]',
      '.modal__close',
      'button:has-text("Close")',
      'button:has-text("Cancel")',
      '[aria-label="Close"]'
    ];

    for (const modalSelector of modals) {
      try {
        const modal = page.locator(modalSelector);
        if (await modal.isVisible()) {
          await modal.click();
          await page.waitForTimeout(500);
          break;
        }
      } catch (error) {
        // Continue to next modal selector
      }
    }
  }

  static async acceptAnyPopup(page: Page) {
    // Accept any popup that might appear
    const acceptButtons = [
      'button:has-text("Accept")',
      'button:has-text("OK")',
      'button:has-text("Continue")',
      'button:has-text("Agree")',
      '[data-testid="accept-button"]'
    ];

    for (const buttonSelector of acceptButtons) {
      try {
        const button = page.locator(buttonSelector);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(500);
          break;
        }
      } catch (error) {
        // Continue to next button selector
      }
    }
  }

  static async waitForPageLoad(page: Page) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
  }

  static async retryAction(action: () => Promise<void>, maxRetries: number = 3, delay: number = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await action();
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
