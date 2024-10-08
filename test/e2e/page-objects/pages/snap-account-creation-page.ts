import { Driver } from '../../webdriver/driver';

export default class SnapAccountCreationPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async createAccount(): Promise<void> {
    await this.driver.clickElement({ text: 'Create Account', tag: 'button' });
  }

  async checkDappConnectionStatus(): Promise<void> {
    await this.driver.waitForSelector({
      css: '#snapConnected',
      text: 'Connected',
    });
  }

  async checkSnapName(expectedName: string): Promise<void> {
    await this.driver.waitForSelector({ text: expectedName });
  }

  async checkSnapId(expectedId: string): Promise<void> {
    await this.driver.waitForSelector({ text: expectedId });
  }

  async checkCreateButtonExists(): Promise<void> {
    await this.driver.waitForSelector({ text: 'Create', tag: 'button' });
  }

  async checkCancelButtonExists(): Promise<void> {
    await this.driver.waitForSelector({ text: 'Cancel', tag: 'button' });
  }
}
