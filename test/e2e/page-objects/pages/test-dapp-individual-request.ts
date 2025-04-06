import { Driver } from '../../webdriver/driver';

class TestDappIndividualRequest {
  private readonly driver: Driver;

  private readonly result = 'main';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Verify the result of the request.
   *
   * @param expectedResult - The expected result from the individual request.
   */
  async check_expectedResult(expectedResult: string) {
    console.log('Verify the result from the individual request.');
    await this.driver.waitForSelector({
      tag: this.result,
      text: expectedResult,
    });
  }
}

export default TestDappIndividualRequest;
