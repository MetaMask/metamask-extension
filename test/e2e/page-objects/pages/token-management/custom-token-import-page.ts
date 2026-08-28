import { Driver } from '../../../webdriver/driver';

/**
 * Add Custom Token form: network, address, and submit.
 *
 * Screen: `#/custom-token-import`.
 * Owns: page-loaded check, stable address input fill, submit, and back to
 * homepage.
 * Boundaries: the custom import form only. The manage-tokens hub that opens
 * this page is `TokenManagementPage`.
 * Related: `TokenManagementPage`.
 *
 * @see ui/pages/custom-token-import/custom-token-import.tsx
 */
class CustomTokenImportPage {
  private readonly addressInput =
    '[data-testid="custom-token-import-address-input"]';

  private readonly backButton =
    '[data-testid="custom-token-import-back-button"]';

  private readonly driver: Driver;

  private readonly networkSelector = '[data-testid="network-selector"]';

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
    // Product clears the form whenever selectedNetwork changes
    // (custom-token-import.tsx:423-428). Wait for the network picker and
    // address input to settle, then fill once — do not retry typing.
    await this.driver.waitForElementToStopMoving(this.networkSelector);
    await this.waitForAddressInputStable();
    await this.driver.fill(this.addressInput, tokenAddress);
    await this.driver.waitForSelector(this.submitButtonEnabled);
    await this.driver.clickElement(this.submitButton);
  }

  /**
   * Waits until the address input is present and remains stable so a late
   * product clearFormData() (on selectedNetwork change) cannot wipe a fill.
   */
  async waitForAddressInputStable(): Promise<void> {
    console.log('Waiting for custom token address input to be stable');
    await this.driver.waitUntil(
      async () => {
        return await this.driver.isElementPresentAndVisible(
          this.addressInput,
          1000,
        );
      },
      {
        timeout: this.driver.timeout,
        interval: 100,
        stableFor: 2000,
      },
    );
  }
}

export default CustomTokenImportPage;
