import { WebDriver, By } from 'selenium-webdriver';

class HomePage {
  private readonly driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  /**
   * Gets the primary balance displayed on the home page.
   *
   * @returns The primary balance as a string.
   */
  async getPrimaryBalance(): Promise<string> {
    const balanceElement = await this.driver.findElement(
      By.css('.eth-overview__primary-balance'),
    );
    return balanceElement.getText();
  }
}

export default HomePage;
