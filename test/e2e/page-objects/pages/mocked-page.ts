import { Driver } from '../../webdriver/driver';

class MockedPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * This method checks if message is displayed on the mocked page.
   *
   * @param message - The message to check if it is displayed on the mocked page.
   */
  async check_displayedMessage(message: string): Promise<void> {
    console.log('Checking if message is displayed on mocked page', message);
    await this.driver.waitForSelector({
      text: message,
      tag: 'body',
    });
  }
}

export default MockedPage;
