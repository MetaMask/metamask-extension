import { type BrowserContext, type Page } from '@playwright/test';
const MM_WALLET_PASSWORD = '123123123';
const MM_WALLET_SEED_PHRASE =
  'buzz pill embody elite name festival crystal pigeon grief memory allow blue';
export class MetaMaskExtension {
  static extensionId: string | undefined;
  private page: Page;
  private clearSmartTranModalDone: boolean;
  readonly context: any;
  readonly extensionUrl: string;

  constructor(browserContext: BrowserContext) {
    this.clearSmartTranModalDone = false;
    this.context = browserContext;
    this.extensionUrl = `chrome-extension://${MetaMaskExtension.extensionId}/home.html`;
  }

  async openTab() {
    this.page = this.context
      .pages()
      .find((page: Page) =>
        page.url().includes(MetaMaskExtension.extensionId!),
      );
    if (!this.page) {
      this.page = await this.context.newPage();
      await this.page.goto(this.extensionUrl);
    }
  }

  async initialOnBoarding() {
    await this.page.getByTestId('onboarding-terms-checkbox').click();
    await this.page.getByTestId('onboarding-import-wallet').click();
    await this.page.getByTestId('metametrics-no-thanks').click();
    const seedPhrase = MM_WALLET_SEED_PHRASE!.split(' ');
    for (let index = 0; index < seedPhrase.length; index++) {
      await this.page
        .getByTestId(`import-srp__srp-word-${index}`)
        .fill(seedPhrase[index]);
    }
    await this.page.getByTestId('import-srp-confirm').click();
    await this.page
      .getByTestId('create-password-new')
      .fill(MM_WALLET_PASSWORD!);
    await this.page
      .getByTestId('create-password-confirm')
      .fill(MM_WALLET_PASSWORD!);
    await this.page.getByTestId('create-password-terms').click();
    await this.page.getByRole('button', { name: 'Import my wallet' }).click();
    await this.page.getByTestId('onboarding-complete-done').click();
    await this.page.getByTestId('pin-extension-next').click();
    await this.page.getByTestId('pin-extension-done').click();
    await this.page.getByTestId('popover-close').click();
  }

  async changeNetwork(option) {
    await this.page.getByTestId('network-display').click();
    await this.page.getByText('Add network').click();
    await this.page.getByTestId('add-network-manually').click();
    const formField = await this.page.$$('.form-field__input');
    await formField[0].fill(option.name);
    await formField[1].fill(option.url);
    await formField[2].fill(option.chainID);
    await formField[3].fill(option.symbol);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.getByRole('button', { name: 'Switch to Tenderly' }).click();
  }

  async swap(options) {
    await this.page.getByTestId('token-overview-button-swap').click();
    if (!this.clearSmartTranModalDone) {
      this.clearSmartTranModalDone = true;
      await this.page.getByRole('button', { name: 'No, thanks.' }).click();
    }
    await this.page.waitForTimeout(1000);
    if (options.from) {
      await this.page.getByTestId('prepare-swap-page-swap-from').click();
      await this.page
        .locator('[id="list-with-search__text-search"]')
        .fill(options.from);
      await this.page.waitForTimeout(500);
      await this.page
        .getByTestId('searchable-item-list-primary-label')
        .first()
        .click();
    }
    await this.page
      .getByTestId('prepare-swap-page-from-token-amount')
      .fill(options.qty);
    await this.page.getByTestId('prepare-swap-page-swap-to').click();
    await this.page
      .locator('[id="list-with-search__text-search"]')
      .fill(options.to);
    await this.page.waitForTimeout(500);
    await this.page
      .getByTestId('searchable-item-list-primary-label')
      .first()
      .click();
    await this.page.waitForTimeout(500);
    await this.page.getByTestId('page-container-footer-next').click();
    await this.page.waitForTimeout(3000);
    await this.page.getByTestId('page-container-footer-next').click();
    await this.page.waitForTimeout(1000);
  }
}
