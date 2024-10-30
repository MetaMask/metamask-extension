import { Driver } from '../../../webdriver/driver';

class SelectNetwork {
  private driver: Driver;

  private networkName: string | undefined;

  private readonly addNetworkButton = {
    tag: 'button',
    text: 'Add a custom network',
  };

  private readonly closeButton = 'button[aria-label="Close"]';

  private readonly searchInput =
    '[data-testid="network-redesign-modal-search-input"]';

  private readonly selectNetworkMessage = {
    text: 'Select a network',
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

  async selectNetworkName(networkName: string): Promise<void> {
    console.log(`Click ${networkName}`);
    this.networkName = `[data-testid="${networkName}"]`;
    await this.driver.clickElementAndWaitToDisappear(this.networkName);
  }

  async addNewNetwork(): Promise<void> {
    console.log('Click Add network');
    await this.driver.clickElement(this.addNetworkButton);
  }

  async clickCloseButton(): Promise<void> {
    console.log('Click Close Button');
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }

  async toggleShowTestNetwork(): Promise<void> {
    console.log('Toggle show test network in select network dialog');
    await this.driver.clickElement(this.toggleButton);
  }

  async fillNetworkSearchInput(networkName: string): Promise<void> {
    console.log(`Fill network search input with ${networkName}`);
    await this.driver.fill(this.searchInput, networkName);
  }

  async clickAddButton(): Promise<void> {
    console.log('Click Add Button');
    await this.driver.clickElementAndWaitToDisappear(
      '[data-testid="test-add-button"]',
    );
  }
}

export default SelectNetwork;
