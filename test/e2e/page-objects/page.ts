import { Driver } from '../webdriver/driver';

export class Page {
  protected driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }
}
