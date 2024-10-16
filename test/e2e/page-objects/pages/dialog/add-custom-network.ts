import { Driver } from '../../../webdriver/driver';

class AddNetworkPage {
  private driver: Driver;

  private networkNameInput: string;

  private dropDownRPC: string;

  private rpcUrlInput: string;

  private addRPCUrlButton: object;

  private addUrlButton: object;

  private chainIdInput: string;

  private currencySymbolInput: string;

  private dropDownExplorer: string;

  private blockExplorerUrlInput: string;

  private addBlockExplorerUrlButton: object;

  private saveButton: object;

  constructor(driver: Driver) {
    this.driver = driver;

    this.networkNameInput = '[data-testid="network-form-network-name"]';

    this.dropDownRPC = '[data-testid="test-add-rpc-drop-down"]';

    this.addRPCUrlButton = {
      text: "Add RPC URL",
      tag: 'button',
    };

    this.rpcUrlInput = '[data-testid="rpc-url-input-test"]';
    this.addUrlButton ={
      text: 'Add URL',
      tag: 'button',
    }

    this.chainIdInput = '[data-testid="network-form-chain-id"]';

    this.currencySymbolInput = '[data-testid="network-form-ticker-input"]';

    this.dropDownExplorer = '[data-testid="test-explorer-drop-down"]';

    this.blockExplorerUrlInput =
      '[data-testid="explorer-url-input"]';

    this.addBlockExplorerUrlButton = {
      text: 'Add a block explorer URL',
      tag: 'button',
    }

    this.saveButton = {
      tag: 'button',
      text: 'Save',
    };
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
    if(network.rpcUrl) {
      this.addRPCUrl(network.rpcUrl);
    }
    await this.driver.fill(this.chainIdInput, network.chainId);

    await this.driver.fill(this.currencySymbolInput, network.symbol);

    //await this.driver.scrollToElement('.networks-tab__scrollable');

    if(network.explorerUrl){
      this.addBlockExplorerUrl(network.explorerUrl);
    }

    // Click save button to add the network
    await this.driver.clickElement(this.saveButton);
  }

  async addRPCUrl(rpcUrl: string): Promise<void> {
    console.log(`Adding RPC URL: ${rpcUrl}`);

    await this.driver.clickElement(this.dropDownRPC);
    await this.driver.clickElement(this.addRPCUrlButton);
    await this.driver.fill(this.rpcUrlInput, rpcUrl);
    await this.driver.clickElement(this.addUrlButton);
  }

  async addBlockExplorerUrl(blockExplorerUrl: string): Promise<void> {
    console.log(`Adding block explorer URL: ${blockExplorerUrl}`);

    await this.driver.clickElement(this.dropDownExplorer);
    await this.driver.clickElement(this.addBlockExplorerUrlButton);
    await this.driver.fill(this.blockExplorerUrlInput, blockExplorerUrl);
    await this.driver.clickElement(this.addUrlButton);
  }
}

export default AddNetworkPage;
