import { Driver } from '../../webdriver/driver';

type HomeNetworkFilterSection = 'network' | 'custom' | 'test';

class HomeNetworkFilter {
  protected readonly driver: Driver;

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  private readonly allDefaultNetworksItem =
    '[data-testid="home-network-filter-all-default"]';

  private readonly modalCloseButton =
    '.mm-modal-header button[aria-label="Close"]';

  private readonly multichainNetworkListItemByName = (networkName: string) => ({
    css: '.multichain-network-list-item',
    text: networkName,
  });

  private networkItemSelector(
    chainId: string,
    section: HomeNetworkFilterSection = 'network',
  ): string {
    return `[data-testid="home-network-filter-${section}-${chainId}"]`;
  }

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async open(): Promise<void> {
    console.log('Opening the home network filter');
    await this.driver.clickElement(this.networksToggle);
    await this.driver.waitForSelector(this.allDefaultNetworksItem);
  }

  async close(): Promise<void> {
    console.log('Closing the home network filter');
    await this.driver.clickElementAndWaitToDisappear(this.modalCloseButton);
  }

  async checkNetworkIsListed(networkName: string): Promise<void> {
    console.log(
      `Verify network "${networkName}" appears in the home network filter`,
    );
    await this.driver.waitForSelector(
      this.multichainNetworkListItemByName(networkName),
    );
  }

  async selectNetworkByChainId(
    chainId: string,
    section: HomeNetworkFilterSection = 'network',
  ): Promise<void> {
    console.log(`Selecting network ${chainId} from the home network filter`);
    await this.driver.clickElementAndWaitToDisappear(
      this.networkItemSelector(chainId, section),
    );
  }
}

export default HomeNetworkFilter;
