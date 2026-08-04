import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { type CaipChainId } from '@metamask/utils';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { Driver } from '../../webdriver/driver';

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

class NetworkManager {
  private readonly allNetworksItem =
    '[data-testid="home-network-filter-all-default"]';

  private readonly customNetworkRow =
    '[data-testid^="home-network-filter-custom-"]';

  private readonly defaultNetworkRow =
    '[data-testid^="home-network-filter-network-"]';

  private readonly deselectedAllNetworksItem = `${this.allNetworksItem}.bg-transparent`;

  private readonly deselectedNetworkListItem = (selector: string) =>
    `:is(${selector}.multichain-network-list-item--deselected, ${selector} .multichain-network-list-item--deselected)`;

  protected readonly driver: Driver;

  private readonly manageNetworksButton =
    '[data-testid="home-network-filter-manage-networks"]';

  // The redesigned filter renders the design-system `ModalHeader`, whose close
  // button is only identifiable by its aria label.
  private readonly modalCloseButton = 'header button[aria-label="Close"]';

  private readonly networkItemDeleteOption = `[data-testid="network-list-item-options-delete"]`;

  private readonly networkItemMenuButtonByChainId = (chainId: string) =>
    `[data-testid="network-list-item-options-button-${chainId}"]`;

  private readonly networkListItem = (chainId: string) =>
    `[data-testid="network-list-item-${toListItemChainId(chainId)}"]`;

  private readonly networkListItemByName = (networkName: string) =>
    `[data-testid="${networkName}"]`;

  private readonly networkManagerToggle = '[data-testid="sort-by-networks"]';

  private readonly networkPopupDeleteButton =
    '[data-testid="confirm-delete-network-modal-delete-button"]';

  private readonly networksPageBackButton =
    '[data-testid="page-header-back-button"]';

  private readonly networksPageList = '[data-testid="networks-page-list"]';

  // "All networks" is a plain button rather than a network list item, so its
  // selected state shows through the background utility class.
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
    console.log('Checking the network manager is loaded');
    await this.driver.waitForSelector(this.allNetworksItem);
  }

  /**
   * The redesigned filter lists every category at once instead of behind tabs,
   * so this asserts the matching section is rendered.
   *
   * @param tabName - Either `Custom` or `Popular`.
   */
  async checkTabIsSelected(tabName: string): Promise<void> {
    console.log(`Checking if ${tabName} networks are listed`);
    await this.driver.waitForSelector(
      tabName === 'Custom' ? this.customNetworkRow : this.defaultNetworkRow,
    );
    console.log(`${tabName} networks are listed`);
  }

  async closeNetworkManager(): Promise<void> {
    console.log(`Closing the network manager`);
    await this.driver.clickElementAndWaitToDisappear(this.modalCloseButton);
  }

  /**
   * Deletes a network from the networks page. The filter modal itself no longer
   * exposes per-network options, so `openManageNetworks` must run first.
   *
   * @param chainId - The hexadecimal chain id of the network to delete.
   */
  async deleteNetworkByChainId(chainId: `0x${string}`): Promise<void> {
    console.log(`Deleting network: ${chainId}`);

    // The networks page keys its list items by CAIP chain id.
    const caipChainId = toEvmCaipChainId(chainId);

    await this.driver.clickElement(
      this.networkItemMenuButtonByChainId(caipChainId),
    );
    await this.driver.clickElement(this.networkItemDeleteOption);
    await this.driver.clickElement(this.networkPopupDeleteButton);

    console.log(`Successfully deleted network: ${chainId}`);
  }

  async leaveNetworksPage(): Promise<void> {
    console.log('Leaving the networks page');
    await this.driver.clickElementAndWaitToDisappear(
      this.networksPageBackButton,
    );
  }

  /**
   * Navigates from the network filter to the full networks page, which is where
   * networks can be added, edited and deleted.
   */
  async openManageNetworks(): Promise<void> {
    console.log('Opening the networks page');
    await this.driver.clickElement(this.manageNetworksButton);
    await this.driver.waitForSelector(this.networksPageList);
  }

  async openNetworkAndDeleteNetwork(
    tabName: string,
    networkName: string,
  ): Promise<void> {
    console.log(
      `Opening network manager and deleting ${networkName} on ${tabName} tab`,
    );
    await this.openNetworkManager();
    await this.openManageNetworks();
    await this.deleteNetworkByChainId(networkName as `0x${string}`);
    await this.leaveNetworksPage();
  }

  async openNetworkAndSelectNetwork(
    tabName: string,
    networkName: string,
  ): Promise<void> {
    console.log(
      `Opening network manager and selecting ${networkName} on ${tabName} tab`,
    );
    await this.openNetworkManager();
    await this.selectTab(tabName);
    if (networkName.startsWith('eip155:')) {
      await this.selectNetworkByChainId(networkName);
    } else {
      await this.selectNetworkByNameWithWait(networkName);
    }
  }

  // select a network from the manager list
  async openNetworkManager(): Promise<void> {
    console.log(`Opening the network manager`);
    await this.driver.clickElement(this.networkManagerToggle);
    await this.checkPageIsLoaded();
  }

  async selectAllNetworks(): Promise<void> {
    console.log('Selecting all networks');
    await this.driver.clickElementAndWaitToDisappear(this.allNetworksItem);
  }

  async selectNetworkByChainId(chainId: string): Promise<void> {
    await this.driver.clickElementSafe(this.networkListItem(chainId));
  }

  async selectNetworkByName(networkName: string): Promise<void> {
    console.log(`Selecting network by name: ${networkName} on network manager`);
    await this.driver.clickElement(this.networkListItemByName(networkName));
  }

  async selectNetworkByNameWithWait(networkName: string): Promise<void> {
    console.log(`Selecting network by name: ${networkName}`);
    await this.driver.clickElementAndWaitToDisappear(
      this.networkListItemByName(networkName),
    );
  }

  /**
   * The Popular and Custom tabs were merged into a single scrolling list, so
   * there is nothing to switch to. Retained so callers can keep expressing
   * which category they are about to pick from.
   *
   * @param tabName - Either `Custom` or `Popular`.
   */
  async selectTab(tabName: string): Promise<void> {
    console.log(`Selecting tab: ${tabName}`);
    await this.waitForCategoryContent(tabName);
  }

  async waitForCategoryContent(networkCategory: string): Promise<void> {
    console.log(`Waiting for ${networkCategory} networks to load`);
    await this.checkPageIsLoaded();
  }
}

export default NetworkManager;
