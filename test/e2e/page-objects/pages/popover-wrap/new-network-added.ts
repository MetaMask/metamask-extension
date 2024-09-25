import { Driver } from '../../../webdriver/driver';

class NewNetworkAdded {
  private driver: Driver;

  private SwitchButton: object | undefined;

  private DismissButton: object;

  constructor(driver: Driver) {
    this.driver = driver;
    this.DismissButton = {
      tag: 'h6',
      text: 'Dismiss',
    };
  }

  async clickDismissButton(): Promise<void> {
    console.log(`Click Dismiss`);
    await this.driver.clickElement(this.DismissButton);
  }

  async clickSwitchButton(networkName: string): Promise<void> {
    console.log(`Click Switch Button`);
    this.SwitchButton = {
      tag: 'h6',
      text: `Switch to ${networkName}`,
    };
    await this.driver.clickElement(this.SwitchButton);
  }
}

export default NewNetworkAdded;
