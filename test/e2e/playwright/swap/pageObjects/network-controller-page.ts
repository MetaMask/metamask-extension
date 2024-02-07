import { type Locator, type Page } from '@playwright/test';

export class NetworkController {
  readonly page: Page;

  readonly networkDisplay: Locator;

  readonly addNetworkButton: Locator;

  readonly addNetworkManuallyButton: Locator;

  readonly networkTickerInput: Locator;

  readonly approveBtn: Locator;

  readonly saveBtn: Locator;

  readonly switchToNetworkBtn: Locator;

  readonly gotItBtn: Locator;

  readonly networkSearch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkDisplay = this.page.getByTestId('network-display');
    this.addNetworkButton = this.page.getByText('Add network');
    this.addNetworkManuallyButton = this.page.getByTestId(
      'add-network-manually',
    );
    this.networkTickerInput = this.page.getByTestId(
      'network-form-ticker-input',
    );
    this.saveBtn = this.page.getByRole('button', { name: 'Save' });
    this.approveBtn = this.page.getByTestId('confirmation-submit-button');
    this.switchToNetworkBtn = this.page.locator('button', {
      hasText: 'Switch to',
    });
    this.gotItBtn = this.page.getByRole('button', { name: 'Got it' });
    this.networkSearch = this.page.locator('input[type="search"]');
  }

  async addCustomNetwork(option) {
    await this.networkDisplay.click();
    await this.addNetworkButton.click();
    await this.addNetworkManuallyButton.click();

    const formField = await this.page.$$('.form-field__input');
    await formField[0].fill(option.name);
    await formField[1].fill(option.url);
    await formField[2].fill(option.chainID);
    await this.networkTickerInput.fill(option.symbol);
    await this.saveBtn.click();
    await this.switchToNetworkBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async addPopularNetwork(networkName) {
    await this.networkDisplay.click();
    await this.addNetworkButton.click();
    const addBtn = this.page.getByTestId(`add-network__${networkName}`);
    await addBtn.click();
    await this.approveBtn.click();
    await this.switchToNetworkBtn.click();
    await this.gotItBtn.click();
  }

  async selectNetwork(networkName) {
    await this.networkDisplay.click();
    await this.networkSearch.fill(networkName);
    await this.page.getByText(networkName).click();
    await this.page.waitForTimeout(2000);
  }
}
