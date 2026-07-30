import { Driver } from '../../../webdriver/driver';

class CustomTokenImportPage {
  private readonly addressInput =
    '[data-testid="custom-token-import-address-input"]';

  private readonly backButton =
    '[data-testid="custom-token-import-back-button"]';

  private readonly driver: Driver;

  private readonly pageSelector = '[data-testid="custom-token-import-page"]';

  private readonly submitButton =
    '[data-testid="custom-token-import-submit-button"]';

  private readonly submitButtonEnabled =
    '[data-testid="custom-token-import-submit-button"]:not([disabled])';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check that the Add Custom Token page is loaded');
    await this.driver.waitForSelector(this.pageSelector);
  }

  async goBackToHomepage(): Promise<void> {
    console.log('Go back to homepage from the Add Custom Token page');
    await this.driver.clickElement(this.backButton);
  }

  async importToken(tokenAddress: string): Promise<void> {
    console.log(`Import custom token at address ${tokenAddress}`);
    await this.driver.fill(this.addressInput, tokenAddress);
    await this.driver.waitForSelector(this.submitButtonEnabled);
    await this.driver.clickElement(this.submitButton);
  }
}

export default CustomTokenImportPage;
