import type { Page } from '@playwright/test';

export class SrpPage {
  constructor(private readonly page: Page) {}

  private readonly srpInput = '[data-testid="srp-input-import__srp-note"]';
  private readonly confirmButton = '[data-testid="import-srp-confirm"]';

  async isLoaded(): Promise<boolean> {
    try {
      await this.page.locator(this.srpInput).waitFor({ timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async fillSeedPhrase(seedPhrase: string): Promise<void> {
    const input = this.page.locator(this.srpInput);
    await input.click();
    await input.focus();

    await this.page.keyboard.type(seedPhrase, { delay: 10 });

    await this.waitForConfirmButtonEnabled();
  }

  private async waitForConfirmButtonEnabled(timeout = 10000): Promise<void> {
    const button = this.page.locator(this.confirmButton);
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const isEnabled = await button.isEnabled().catch(() => false);
      if (isEnabled) {
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    throw new Error(
      `SRP confirm button did not become enabled within ${timeout}ms. ` +
        'This usually means the seed phrase was not recognized as valid. ' +
        'Check that you entered a valid 12 or 24-word recovery phrase.',
    );
  }

  async clickConfirm(): Promise<void> {
    const button = this.page.locator(this.confirmButton);

    await button.waitFor({ state: 'visible', timeout: 10000 });
    await this.waitForConfirmButtonEnabled();

    await button.click();
    await button.waitFor({ state: 'hidden', timeout: 15000 });
  }
}
