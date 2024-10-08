import { Driver } from '../../webdriver/driver';

export default class SnapAccountNamingPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async enterAccountName(name: string): Promise<void> {
    await this.driver.fill('#custom-name-input', name);
  }

  async confirmAccountCreation(): Promise<void> {
    await this.driver.clickElement({ text: 'Create', tag: 'button' });
  }

  async checkSnapName(expectedName: string): Promise<void> {
    await this.driver.waitForSelector({
      css: '.snap-name',
      text: expectedName,
    });
  }

  async checkSnapId(expectedId: string): Promise<void> {
    await this.driver.waitForSelector({
      css: '.snap-id',
      text: expectedId,
    });
  }
}
