import { Driver } from '../../../webdriver/driver';

class SelectNetwork {
  private driver: Driver;

  private readonly addCustomNetworkButton = {
    text: 'Add a custom network',
    tag: 'button',
  };

  private readonly addNetworkButton = '[data-testid="test-add-button"]';

  private readonly closeButton = 'button[aria-label="Close"]';

  private readonly confirmDeleteNetworkButton = {
    text: 'Delete',
    tag: 'button',
  };

  private readonly confirmDeleteNetworkModal = {
    testId: 'confirm-delete-network-modal',
  };

  private readonly deleteNetworkButton = {
    testId: 'network-list-item-options-delete',
  };

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

  /**
   * Delete a network from the network list.
   *
   * @param chainId - The chain ID of the network to delete.
   */
  async deleteNetwork(chainId: string): Promise<void> {
    console.log(`Delete network ${chainId} from network list`);
    await this.openNetworkListOptions(chainId);
    await this.driver.clickElementAndWaitToDisappear(this.deleteNetworkButton);
    await this.driver.waitForSelector(this.confirmDeleteNetworkModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmDeleteNetworkButton,
    );
  }

  async fillNetworkSearchInput(networkName: string): Promise<void> {
    console.log(`Fill network search input with ${networkName}`);
    await this.driver.fill(this.searchInput, networkName);
  }

  async openAddCustomNetworkModal(): Promise<void> {
    console.log('Open add custom network modal');
    await this.driver.clickElementAndWaitToDisappear(
      this.addCustomNetworkButton,
    );
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
    await this.driver.assertElementNotPresent('.loading-overlay');
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

  /**
   * Check if a network option is displayed in the select network dialog.
   *
   * @param networkName - The name of the network to check.
   * @param shouldBeDisplayed - Whether the network should be displayed. Defaults to true.
   */
  async check_networkOptionIsDisplayed(
    networkName: string,
    shouldBeDisplayed: boolean = true,
  ): Promise<void> {
    console.log(
      `Check if ${networkName} is ${
        shouldBeDisplayed ? 'displayed' : 'not displayed'
      } in select network dialog`,
    );
    const networkNameItem = `[data-testid="${networkName}"]`;
    if (shouldBeDisplayed) {
      await this.driver.waitForSelector(networkNameItem);
    } else {
      await this.driver.assertElementNotPresent(networkNameItem);
    }
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

  async clickDiscoverButton(): Promise<void> {
    console.log('Click Discover button in network options');
    await this.driver.clickElement(
      '[data-testid="network-list-item-options-discover"]',
    );
  }

  async check_discoverButtonIsVisible(): Promise<void> {
    console.log('Check Discover button is visible in network options');
    await this.driver.waitForSelector(
      '[data-testid="network-list-item-options-discover"]',
    );
  }
}

export default SelectNetwork;
