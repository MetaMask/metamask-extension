import { Driver } from '../../webdriver/driver';

/**
 * Generic helper for asserting body text on E2E mock / stub HTML pages.
 *
 * Screen: external or locally served mock pages (not MetaMask UI routes),
 * e.g. portfolio stubs and phishing-controller fixtures.
 * Owns: waiting for a message string on the page body.
 * Boundaries: message assertion only. Opening URLs, phishing warning UI, and
 * navigation back into the extension belong to other page objects/helpers.
 * Related: `PhishingWarningPage` (when mocks feed the phishing flow);
 * portfolio and snaps link tests that land on stub pages.
 *
 * @see test/e2e/mock-e2e.js
 * @see test/e2e/tests/phishing-controller/mock-page-with-paths/index.html
 */
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
  async checkDisplayedMessage(message: string): Promise<void> {
    console.log('Checking if message is displayed on mocked page', message);
    await this.driver.waitForSelector({
      text: message,
      tag: 'body',
    });
  }
}

export default MockedPage;
