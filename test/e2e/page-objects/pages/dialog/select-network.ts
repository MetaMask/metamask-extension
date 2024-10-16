import { Driver } from '../../../webdriver/driver';

class SelectNetwork {
  private driver: Driver;

  private networkName: string | undefined;

  private addNetworkButton: object;

  private closeButton: string;

  private toggleButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.addNetworkButton = {
      tag: 'button',
      text: 'Add a custom network',
    };
    this.closeButton = 'button[aria-label="Close"]';
    this.toggleButton = '.toggle-button > div';
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
    await this.driver.clickElement(this.closeButton);
  }

  async clickToggleButton(): Promise<void> {
    console.log('Click Toggle Button');
    await this.driver.clickElement(this.toggleButton);
  }
}

export default SelectNetwork;
