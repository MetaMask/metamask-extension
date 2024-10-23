import { Driver } from '../../../webdriver/driver';

class SelectNetwork {
  private driver: Driver;

  private networkName: string | undefined;

  private addNetworkButton: object;

  private closeButton: string;

  private toggleButton: string;

  private searchInput: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.addNetworkButton = {
      tag: 'button',
      text: 'Add a custom network',
    };
    this.closeButton = 'button[aria-label="Close"]';
    this.toggleButton = '.toggle-button > div';
    this.searchInput = '[data-testid="network-redesign-modal-search-input"]';
  }

  async clickNetworkName(networkName: string): Promise<void> {
    console.log(`Click ${networkName}`);
    this.networkName = `[data-testid="${networkName}"]`;
    await this.driver.clickElement(this.networkName);
  }

  async addNewNetwork(): Promise<void> {
    console.log('Click Add network');
    await this.driver.clickElement(this.addNetworkButton);
  }

  async clickCloseButton(): Promise<void> {
    console.log('Click Close Button');
    await this.driver.clickElementAndWaitToDisappear(this.closeButton);
  }

  async clickToggleButton(): Promise<void> {
    console.log('Click Toggle Button');
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
