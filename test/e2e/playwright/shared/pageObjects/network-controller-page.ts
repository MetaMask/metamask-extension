import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { Hex } from '@metamask/utils';
import { type Locator, type Page } from '@playwright/test';
import { Tenderly } from '../../swap/tenderly-network';

export class NetworkController {
  readonly page: Page;

  readonly networkDisplay: Locator;

  readonly addNetworkButton: Locator;

  readonly approveBtn: Locator;

  readonly saveBtn: Locator;

  readonly gotItBtn: Locator;

  readonly networkName: Locator;

  readonly networkRpc: Locator;

  readonly networkChainId: Locator;

  readonly networkTicker: Locator;

  readonly dismissBtn: Locator;

  readonly networkListEdit: Locator;

  readonly rpcName: Locator;

  readonly addRpcDropDown: Locator;

  readonly addRpcURLBtn: Locator;

  readonly addURLBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkDisplay = this.page.getByTestId('network-display');
    this.networkListEdit = this.page.getByTestId(
      'network-list-item-options-edit',
    );
    this.addNetworkButton = this.page.getByText('Add a custom network');
    this.addRpcDropDown = this.page.getByTestId('test-add-rpc-drop-down');
    this.addRpcURLBtn = this.page.getByRole('button', { name: 'Add RPC URL' });
    this.addURLBtn = this.page.getByRole('button', { name: 'Add URL' });
    this.saveBtn = this.page.getByRole('button', { name: 'Save' });
    this.approveBtn = this.page.getByTestId('confirmation-submit-button');
    this.gotItBtn = this.page.getByRole('button', { name: 'Got it' });
    this.networkName = this.page.getByTestId('network-form-network-name');
    this.rpcName = this.page.getByTestId('rpc-name-input-test');
    this.networkRpc = this.page.getByTestId('rpc-url-input-test');
    this.networkChainId = this.page.getByTestId('network-form-chain-id');
    this.networkTicker = this.page.getByTestId('network-form-ticker-input');
    this.dismissBtn = this.page.getByRole('button', { name: 'Dismiss' });
  }

  async addCustomNetwork(options: {
    name: string;
    rpcName: string;
    url: string;
    chainID: string;
    symbol: string;
  }) {
    let rpcName = options.name;
    await this.networkDisplay.click();
    if (
      options.name === Tenderly.Mainnet.name ||
      options.name === Tenderly.Linea.name
    ) {
      rpcName = options.rpcName;
      await this.page
        .getByTestId(
          `network-list-item-options-button-${toEvmCaipChainId(
            options.chainID as Hex,
          )}`,
        )
        .click();
      await this.networkListEdit.click();
    } else {
      await this.addNetworkButton.click();
      await this.networkName.fill(rpcName);
    }
    await this.addRpcDropDown.click();
    await this.addRpcURLBtn.click();
    await this.networkRpc.fill(options.url);
    await this.rpcName.fill(rpcName);
    await this.addURLBtn.click();
    if (
      options.name !== Tenderly.Mainnet.name &&
      options.name !== Tenderly.Linea.name
    ) {
      await this.networkChainId.fill(options.chainID);
    }
    await this.networkTicker.fill(options.symbol);
    await this.saveBtn.waitFor({ state: 'visible' });
    await this.saveBtn.click({ timeout: 60000 });
    await this.page.waitForSelector(`text=/was successfully edited/`, {
      timeout: 30000,
    });
  }

  async addPopularNetwork(options: { networkName: string }) {
    await this.networkDisplay.click();
    await this.addNetworkButton.click();
    const addBtn = this.page.getByTestId(`add-network-${options.networkName}`);
    await addBtn.click();
    await this.approveBtn.click();
    await this.gotItBtn.click();
  }

  async selectNetwork(options: {
    name: string;
    rpcName: string;
    url: string;
    chainID: string;
    symbol: string;
  }) {
    const currentNetwork = await this.networkDisplay.textContent();
    if (currentNetwork !== options.name) {
      await this.networkDisplay.click();
      if (options.name === Tenderly.Mainnet.name) {
        await this.page.getByText(options.rpcName).click();
        await this.page.getByText(options.rpcName).click();
      } else {
        await this.page.getByTestId(options.name).click();
      }
    }
  }
}
