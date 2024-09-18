import { Driver } from '../../webdriver/driver';

class AddNetworkPage {
  private driver: Driver;

  private addNetworkManuallyLink: string;

  private networkNameInput: string;

  private rpcUrlInput: string;

  private chainIdInput: string;

  private currencySymbolInput: string;

  private blockExplorerUrlInput: string;

  private saveButton: object;

  constructor(driver: Driver) {
    this.driver = driver;

    this.addNetworkManuallyLink = '[data-testid="add-network-manually"]';

    this.networkNameInput = '[data-testid="network-form-network-name"]';

    this.rpcUrlInput = '[data-testid="network-form-rpc-url"]';

    this.chainIdInput = '[data-testid="network-form-chain-id"]';

    this.currencySymbolInput = '[data-testid="network-form-ticker-input"]';

    this.blockExplorerUrlInput =
      '[data-testid="network-form-block-explorer-url"]';

    this.saveButton = {
      tag: 'button',
      text: 'Save',
    };
  }

  async addNewNetworkManually(): Promise<void> {
    console.log(`Click Add network manually link`);
    await this.driver.clickElement(this.addNetworkManuallyLink);
  }

  async addNetwork(network: {
    name: string;
    rpcUrl: string;
    chainId: string;
    symbol: string;
    explorerUrl: string;
  }): Promise<void> {
    console.log(`Adding network: ${network.name}`);

    await this.driver.fill(this.networkNameInput, network.name);
    await this.driver.fill(this.rpcUrlInput, network.rpcUrl);
    await this.driver.fill(this.chainIdInput, network.chainId);

    await this.driver.fill(this.currencySymbolInput, network.symbol);
    await this.driver.fill(this.blockExplorerUrlInput, network.explorerUrl);

    // Click save button to add the network
    await this.driver.clickElement(this.saveButton);
  }
}

export default AddNetworkPage;
