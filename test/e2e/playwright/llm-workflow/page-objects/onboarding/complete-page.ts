import type { Page } from '@playwright/test';

export class CompletePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private readonly doneButton = '[data-testid="onboarding-complete-done"]';

  private readonly manageSettingsButton =
    '[data-testid="manage-default-settings"]';

  private readonly downloadAppContinue =
    '[data-testid="download-app-continue"]';

  private readonly pinExtensionDone = '[data-testid="pin-extension-done"]';

  async isLoaded(): Promise<boolean> {
    try {
      await this.page.locator(this.doneButton).waitFor({ timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  async clickDone(): Promise<void> {
    const downloadLocator = this.page.locator(this.downloadAppContinue);
    const pinLocator = this.page.locator(this.pinExtensionDone);
    const doneLocator = this.page.locator(this.doneButton);

    const downloadVisible = await downloadLocator
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (downloadVisible) {
      console.log('Skipping download app page...');
      await downloadLocator.click();
      await downloadLocator
        .waitFor({ state: 'hidden', timeout: 5000 })
        // eslint-disable-next-line no-empty-function
        .catch(() => {});
    }

    const pinVisible = await pinLocator
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (pinVisible) {
      console.log('Skipping pin extension page...');
      await pinLocator.click();
      await pinLocator
        .waitFor({ state: 'hidden', timeout: 5000 })
        // eslint-disable-next-line no-empty-function
        .catch(() => {});
    }

    const doneVisible = await doneLocator
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (doneVisible) {
      await doneLocator.click();
    }
  }

  async clickManageSettings(): Promise<void> {
    await this.page.locator(this.manageSettingsButton).click();
  }
}
