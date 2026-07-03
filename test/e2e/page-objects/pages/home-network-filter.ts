import { Driver } from '../../webdriver/driver';

type HomeNetworkFilterSection = 'network' | 'custom' | 'test';

class HomeNetworkFilter {
  private readonly allDefaultNetworksItem =
    '[data-testid="home-network-filter-all-default"]';

  protected readonly driver: Driver;

  private readonly modalCloseButton =
    '.mm-modal-header button[aria-label="Close"]';

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkIsListed(networkName: string): Promise<void> {
    console.log(
      `Verify network "${networkName}" appears in the home network filter`,
    );
    await this.driver.waitForSelector({
      css: '.multichain-network-list-item',
      text: networkName,
    });
  }

  async close(): Promise<void> {
    console.log('Closing the home network filter');
    await this.driver.clickElementAndWaitToDisappear(this.modalCloseButton);
  }

  async open(): Promise<void> {
    console.log('Opening the home network filter');
    await this.driver.clickElement(this.networksToggle);
    await this.driver.waitForSelector(this.allDefaultNetworksItem);
  }

  async selectNetworkByChainId(
    chainId: string,
    section: HomeNetworkFilterSection = 'network',
  ): Promise<void> {
    console.log(`Selecting network ${chainId} from the home network filter`);
    await this.driver.clickElementAndWaitToDisappear(
      `[data-testid="home-network-filter-${section}-${chainId}"]`,
    );
  }
}

export default HomeNetworkFilter;
