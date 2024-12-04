import { Driver } from '../../../webdriver/driver';

class SelectNetwork {
  private driver: Driver;

  private readonly addNetworkButton = '[data-testid="test-add-button"]';

  private readonly closeButton = 'button[aria-label="Close"]';

  private readonly editNetworkButton =
    '[data-testid="network-list-item-options-edit"]';

  private readonly rpcUrlItem = '.select-rpc-url__item';

  private readonly searchInput =
    '[data-testid="network-redesign-modal-search-input"]';

  private readonly selectNetworkMessage = {
    text: 'Select a network',
    tag: 'h4',
  };

  private readonly selectRpcMessage = {
    text: 'Select RPC URL',
    tag: 'h4',
  };

  private readonly toggleButton = '.toggle-button > div';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.selectNetworkMessage,
        this.searchInput,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for select network dialog to be loaded',
        e,
      );
      throw e;
    }
    console.log('Select network dialog is loaded');
  }

  async clickAddButton(): Promise<void> {
    console.log('Click Add Button');
    await this.driver.clickElementAndWaitToDisappear(this.addNetworkButton);
  }

  async clickCloseButton(): Promise<void> {
    console.log('Click Close Button');
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }

  async fillNetworkSearchInput(networkName: string): Promise<void> {
    console.log(`Fill network search input with ${networkName}`);
    await this.driver.fill(this.searchInput, networkName);
  }

  async openEditNetworkModal(): Promise<void> {
    console.log('Open edit network modal');
    await this.driver.clickElementAndWaitToDisappear(this.editNetworkButton);
  }

  async openNetworkListOptions(chainId: string): Promise<void> {
    console.log(`Open network options for ${chainId} in network dialog`);
    await this.driver.clickElement(
      `[data-testid="network-list-item-options-button-${chainId}"]`,
    );
  }

  async openNetworkRPC(chainId: string): Promise<void> {
    console.log(`Open network RPC ${chainId}`);
    await this.driver.clickElementAndWaitToDisappear(
      `[data-testid="network-rpc-name-button-${chainId}"]`,
    );
    await this.driver.waitForSelector(this.selectRpcMessage);
  }

  async selectNetworkName(networkName: string): Promise<void> {
    console.log(`Click ${networkName}`);
    const networkNameItem = `[data-testid="${networkName}"]`;
    await this.driver.clickElementAndWaitToDisappear(networkNameItem);
  }

  async selectRPC(rpcName: string): Promise<void> {
    console.log(`Select RPC ${rpcName} for network`);
    await this.driver.waitForSelector(this.selectRpcMessage);
    await this.driver.clickElementAndWaitToDisappear({
      text: rpcName,
      tag: 'button',
    });
  }

  async toggleShowTestNetwork(): Promise<void> {
    console.log('Toggle show test network in select network dialog');
    await this.driver.clickElement(this.toggleButton);
  }

  async check_networkRPCNumber(expectedNumber: number): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} RPC URLs to be displayed in select network dialog`,
    );
    await this.driver.wait(async () => {
      const rpcNumber = await this.driver.findElements(this.rpcUrlItem);
      return rpcNumber.length === expectedNumber;
    }, 10000);
    console.log(`${expectedNumber} RPC URLs found in select network dialog`);
  }

  async check_rpcIsSelected(rpcName: string): Promise<void> {
    console.log(`Check RPC ${rpcName} is selected in network dialog`);
    await this.driver.waitForSelector({
      text: rpcName,
      tag: 'button',
    });
  }
}

export default SelectNetwork;
