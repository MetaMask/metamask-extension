import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from '@playwright/test';

// eslint-disable-next-line node/no-unsupported-features/es-syntax
export class DummyAppPage {
  readonly page: Page;

  readonly connectBtn: Locator;

  readonly getBtnById: (text: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectBtn = page.locator('button:has-text("Connect")');

    this.getBtnById = (id: string) => page.locator(`#${id}`);
  }

  async goto() {
    await this.page.goto(process.env.MMI_E2E_MMI_TEST_DAPP_URL as string);
  }

  async bringToFront() {
    await this.page.bringToFront();
  }

  async connectMMI(context: BrowserContext) {
    const [popup1] = await Promise.all([
      context.waitForEvent('page'),
      this.connectBtn.click(),
    ]);
    await popup1.waitForLoadState();
    await popup1.getByTestId('edit').nth(1).click();
    await popup1.getByText('Select all').click();
    await popup1.getByTestId('Sepolia').click();
    await popup1.getByTestId('connect-more-chains-button').click();
    await popup1.getByTestId('confirm-btn').click();
    await popup1.close();
  }

  async callTestDappButton(
    context: BrowserContext,
    buttonId: string,
    isSign: boolean | undefined,
    signedTransactionTime: string,
  ) {
    if (isSign) {
      await this.page.fill('#signTypedContentsId', signedTransactionTime);
    }

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      this.getBtnById(buttonId).click(),
    ]);
    await popup.waitForLoadState();

    if (isSign) {
      await popup.click('button:has-text("Confirm")');
    } else {
      await popup.getByTestId('confirm-footer-button').click();

      await popup
        .getByTestId('custody-confirm-link__btn')
        .click({ timeout: 10000 });
    }

    await popup.close();
  }

  async checkContractStatus(status: string | RegExp) {
    await expect(this.page.locator('#contractStatus')).toHaveText(status, {
      timeout: 60000,
      ignoreCase: true,
    });
  }
}