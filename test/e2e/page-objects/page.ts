import { Driver } from '../webdriver/driver';

export class Page {
  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Common methods that can be used by all page objects
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.driver.waitForSelector(selector, timeout);
  }

  async clickElement(selector: string): Promise<void> {
    await this.driver.clickElement(selector);
  }

  async fill(selector: string, text: string): Promise<void> {
    await this.driver.fill(selector, text);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.driver.findElement(selector);
    return await element.getText();
  }

  async isElementPresent(selector: string): Promise<boolean> {
    return await this.driver.isElementPresent(selector);
  }

  async press(selector: string, text: string): Promise<void> {
    await this.driver.press(selector, text);
  }
}
