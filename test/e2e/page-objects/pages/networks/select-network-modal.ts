import { type CaipChainId } from '@metamask/utils';
import { convertCaipToHexChainId } from '../../../../../shared/lib/network.utils';
import { Driver } from '../../../webdriver/driver';

export enum NetworkId {
  ETHEREUM = 'eip155:1',
  LINEA = 'eip155:59144',
  ARBITRUM = 'eip155:42161',
  AVALANCHE = 'eip155:43114',
  BSC = 'eip155:56',
  BASE = 'eip155:8453',
  OPTIMISM = 'eip155:10',
  POLYGON = 'eip155:137',
}

/**
 * The network filter keys EVM rows by hex chain id and non-EVM rows by CAIP
 * chain id, while tests refer to networks by CAIP chain id throughout.
 *
 * @param chainId - A CAIP chain id, e.g. `eip155:1` or `solana:5eykt4...`.
 * @returns The chain id in the form used by the rendered list item.
 */
function toListItemChainId(chainId: string): string {
  return chainId.startsWith('eip155:')
    ? convertCaipToHexChainId(chainId as CaipChainId)
    : chainId;
}

/**
 * The network selection modal, used both to switch the active network and to
 * filter the asset list by network.
 *
 * Screen: modal layered over the current page, opened by `NetworkFilter.open()`.
 * Owns: the network rows and their selected state, the "All networks" row, the
 * "Manage networks" button, and closing the modal.
 * Boundaries: stops at the modal edge. Opening it belongs to `NetworkFilter`;
 * everything behind "Manage networks" belongs to `NetworksPage`.
 * `clickManageNetworks` only clicks - it does not assert the next screen.
 * Related: `NetworkFilter` (opens this), `NetworksPage` (reached via
 * `clickManageNetworks`), `flows/network.flow.ts` for journeys spanning both.
 *
 * @see ui/components/app/assets/asset-list/asset-list-control-bar/home-network-filter-modal.tsx
 */
class SelectNetworkModal {
  private readonly allNetworksItem =
    '[data-testid="home-network-filter-all-default"]';

  private readonly deselectedAllNetworksItem = `${this.allNetworksItem}.bg-transparent`;

  private readonly deselectedNetworkListItem = (selector: string) =>
    `:is(${selector}.multichain-network-list-item--deselected, ${selector} .multichain-network-list-item--deselected)`;

  protected readonly driver: Driver;

  private readonly manageNetworksButton =
    '[data-testid="home-network-filter-manage-networks"]';

  private readonly modalCloseButton = 'header button[aria-label="Close"]';

  private readonly networkListItem = (chainId: string) =>
    `[data-testid="network-list-item-${toListItemChainId(chainId)}"]`;

  private readonly networkListItemByName = (networkName: string) =>
    `[data-testid="${networkName}"]`;

  private readonly networkListItemClass = '.multichain-network-list-item';

  private readonly selectedAllNetworksItem = `${this.allNetworksItem}.bg-muted`;

  private readonly selectedNetworkListItem = (selector: string) =>
    `:is(${selector}.multichain-network-list-item--selected, ${selector} .multichain-network-list-item--selected)`;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAllPopularNetworksIsDeselected(): Promise<void> {
    console.log('Checking if "All networks" is deselected');

    try {
      await this.driver.waitForSelector(this.deselectedAllNetworksItem);

      console.log('All networks is properly deselected');
    } catch (error) {
      throw new Error('All networks is selected');
    }
  }

  async checkAllPopularNetworksIsSelected(): Promise<void> {
    console.log('Checking if "All networks" is selected');

    try {
      await this.driver.waitForSelector(this.selectedAllNetworksItem);

      console.log('All networks is properly selected');
    } catch (error) {
      throw new Error('All networks is not selected');
    }
  }

  async checkCustomNetworkIsSelected(caipChainId: string) {
    await this.checkNetworkIsSelected(caipChainId);

    console.log(
      `Custom network ${caipChainId} is properly selected with background indication`,
    );
  }

  async checkNetworkIsDeselected(chainId: string): Promise<void> {
    console.log(`Checking if network is deselected: ${chainId}`);

    try {
      await this.driver.waitForSelector(
        this.deselectedNetworkListItem(this.networkListItem(chainId)),
      );

      console.log(`Network ${chainId} is properly deselected`);
    } catch (error) {
      throw new Error(`Network ${chainId} is selected`);
    }
  }

  /**
   * Checks that a network is present in the modal's list.
   *
   * @param networkName - The display name of the network, e.g. `Tron`.
   */
  async checkNetworkIsListed(networkName: string): Promise<void> {
    console.log(`Verify network "${networkName}" appears in the network modal`);
    await this.driver.waitForSelector({
      css: this.networkListItemClass,
      text: networkName,
    });
  }

  // Method to check if a network is currently selected/active
  async checkNetworkIsSelected(chainId: string): Promise<void> {
    console.log(`Checking if network is selected: ${chainId}`);

    try {
      await this.driver.waitForSelector(
        this.selectedNetworkListItem(this.networkListItem(chainId)),
      );

      console.log(`Network ${chainId} is properly selected`);
    } catch (error) {
      throw new Error(`Network ${chainId} is not selected`);
    }
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking the select network modal is loaded');
    await this.driver.waitForSelector(this.allNetworksItem);
  }

  /**
   * Navigates from the modal to the networks page, which is where networks can
   * be added, edited and deleted. Await `NetworksPage.checkPageIsLoaded` to wait
   * for that page.
   */
  async clickManageNetworks(): Promise<void> {
    console.log('Going to the networks page');
    await this.driver.clickElement(this.manageNetworksButton);
  }

  async close(): Promise<void> {
    console.log(`Closing the select network modal`);
    await this.driver.clickElementAndWaitToDisappear(this.modalCloseButton);
  }

  async selectAllNetworks(): Promise<void> {
    console.log('Selecting all networks');
    await this.driver.clickElementAndWaitToDisappear(this.allNetworksItem);
  }

  async selectNetworkByChainId(chainId: string): Promise<void> {
    await this.driver.clickElementSafe(this.networkListItem(chainId));
  }

  async selectNetworkByName(networkName: string): Promise<void> {
    console.log(
      `Selecting network by name: ${networkName} on select network modal`,
    );
    await this.driver.clickElement(this.networkListItemByName(networkName));
  }

  async selectNetworkByNameWithWait(networkName: string): Promise<void> {
    console.log(`Selecting network by name: ${networkName}`);
    await this.driver.clickElementAndWaitToDisappear(
      this.networkListItemByName(networkName),
    );
  }
}

export default SelectNetworkModal;
