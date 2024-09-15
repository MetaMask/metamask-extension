import { Driver } from '../../webdriver/driver';

export class BasePage {
  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }
}
