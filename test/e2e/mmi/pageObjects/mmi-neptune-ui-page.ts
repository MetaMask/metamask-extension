import { expect, type BrowserContext, type Page, test } from '@playwright/test';

export class MMINeptuneUIPage {
  readonly page: Page;

  readonly context: BrowserContext;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
  }

  async goto() {
    await this.page.goto(process.env.MMI_E2E_NEPTUNE_UI_BASE_URL as string);
  }

  async connectMMI(visual?: false) {
    const pagePromise = this.page.context().waitForEvent('page');
    await this.page.getByRole('button', { name: /connect mmi/iu }).click();
    const neptuneUI = await pagePromise;
    await neptuneUI.waitForLoadState();
    if (visual) {
      await test.expect
        .soft(this.page)
        .toHaveScreenshot('confirm_connect_neptune.png', { fullPage: true });
    }
    await neptuneUI.getByRole('button', { name: /allow/iu }).click();
    if (visual) {
      await test.expect
        .soft(this.page)
        .toHaveScreenshot('custodian_account_selection.png', {
          fullPage: true,
        });
    }
    await neptuneUI.getByTestId('select-all-accounts-selected-false').click();
    await neptuneUI.getByRole('button', { name: /connect/iu }).click();
    if (visual) {
      await test.expect
        .soft(this.page)
        .toHaveScreenshot('custodian_added.png', { fullPage: true });
    }
    await neptuneUI.getByRole('button', { name: /close/iu }).click();
    await this.page.close();
  }

  async issueNewToken(context: BrowserContext, durationSeconds: number) {
    await this.page.locator('text=Replace token').click();
    await this.page
      .getByLabel('Token validity period (seconds)')
      .fill(durationSeconds.toString()); // 3 seconds was way too short for something that is supposed to succeed...

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      this.page.locator('text=Issue and inject token').click(),
    ]);
    await popup.waitForLoadState();

    // Check remove token screen
    await expect.soft(popup).toHaveScreenshot('popop-token-remove-approve.png');

    await popup.getByText('Approve').click();
    await popup.getByText('Close').click();
    await popup.close();
  }

  async issueNewTokenAndFail() {
    await this.page.locator('text=Replace token').click();
    await this.page.getByLabel('Token validity period (seconds)').click();
    await this.page.getByLabel('Token validity period (seconds)').fill('1');
    await this.page.locator('text=Issue and inject token').click();
  }

  async close() {
    await this.page.close();
  }
}
