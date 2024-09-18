import { Driver } from '../../../webdriver/driver';

class SelectNetwork {
  private driver: Driver;

  private ethereumMainnet: string;

  private addNetworkButton: object;

  constructor(driver: Driver) {
    this.driver = driver;
    this.ethereumMainnet = '[data-testid="Ethereum Mainnet"]';
    this.addNetworkButton = {
      tag: 'button',
      text: 'Add network',
    };
  }

  async clickEthereumMainnet(): Promise<void> {
    console.log(`Click Ethereum Mainnet`);
    await this.driver.clickElement(this.ethereumMainnet);
  }

  async addNewNetwork(): Promise<void> {
    console.log(`Click Add network`);
    await this.driver.clickElement(this.addNetworkButton);
  }
}

export default SelectNetwork;
