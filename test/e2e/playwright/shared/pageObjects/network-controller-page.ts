import { type Locator, type Page } from '@playwright/test';

export class NetworkController {
  readonly page: Page;

  readonly networkDisplay: Locator;

  readonly addNetworkButton: Locator;

  readonly addNetworkManuallyButton: Locator;

  readonly approveBtn: Locator;

  readonly saveBtn: Locator;

  readonly switchToNetworkBtn: Locator;

  readonly gotItBtn: Locator;

  readonly networkSearch: Locator;

  readonly networkName: Locator;

  readonly networkRpc: Locator;

  readonly networkChainId: Locator;

  readonly networkTicker: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkDisplay = this.page.getByTestId('network-display');
    this.addNetworkButton = this.page.getByText('Add network');
    this.addNetworkManuallyButton = this.page.getByTestId(
      'add-network-manually',
    );
    this.saveBtn = this.page.getByRole('button', { name: 'Save' });
    this.approveBtn = this.page.getByTestId('confirmation-submit-button');
    this.switchToNetworkBtn = this.page.locator('button', {
      hasText: 'Switch to',
    });
    this.gotItBtn = this.page.getByRole('button', { name: 'Got it' });
    this.networkSearch = this.page.locator('input[type="search"]');
    this.networkName = this.page.getByTestId('network-form-network-name');
    this.networkRpc = this.page.getByTestId('network-form-rpc-url');
    this.networkChainId = this.page.getByTestId('network-form-chain-id');
    this.networkTicker = this.page.getByTestId('network-form-ticker-input');
  }

  async addCustomNetwork(options: {
    name: string;
    url: string;
    chainID: string;
    symbol: string;
  }) {
    await this.networkDisplay.click();
    await this.addNetworkButton.click();
    await this.addNetworkManuallyButton.click();

    await this.networkName.waitFor();
    await this.networkName.fill(options.name);
    await this.networkRpc.fill(options.url);
    await this.networkChainId.fill(options.chainID);
    await this.networkTicker.fill(options.symbol);
    await this.saveBtn.click();
    await this.switchToNetworkBtn.click();
  }

  async addPopularNetwork(options: { networkName: string }) {
    await this.networkDisplay.click();
    await this.addNetworkButton.click();
    const addBtn = this.page.getByTestId(`add-network-${options.networkName}`);
    await addBtn.click();
    await this.approveBtn.click();
    await this.switchToNetworkBtn.click();
    await this.gotItBtn.click();
  }

  async selectNetwork(options: { networkName: string }) {
    await this.networkDisplay.click();
    await this.networkSearch.fill(options.networkName);
    await this.page.getByText(options.networkName).click();
  }
}
