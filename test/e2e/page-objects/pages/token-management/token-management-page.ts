import { Driver } from '../../../webdriver/driver';

/**
 * Manage Tokens hub: open custom import and success toast.
 *
 * Screen: `#/token-management`.
 * Owns: page-loaded check, "Add a custom token", success toast after import,
 * and back to homepage.
 * Boundaries: the manage-tokens list/hub. The custom token form is
 * `CustomTokenImportPage`.
 * Related: `CustomTokenImportPage`.
 *
 * @see ui/pages/token-management/token-management.tsx
 */
class TokenManagementPage {
  private readonly addCustomTokenButton =
    '[data-testid="token-management-add-custom-token-button"]';

  private readonly backButton =
    '[data-testid="token-management-header-back-button"]';

  private readonly driver: Driver;

  private readonly pageSelector = '[data-testid="token-management-page"]';

  private readonly successToast =
    '[data-testid="token-management-custom-token-success-toast"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check that the Manage Tokens page is loaded');
    await this.driver.waitForSelector(this.pageSelector);
  }

  async checkSuccessToastIsDisplayed(): Promise<void> {
    console.log('Check custom token success toast is displayed');
    await this.driver.waitForSelector(this.successToast);
  }

  async clickAddCustomToken(): Promise<void> {
    console.log('Click "Add a custom token"');
    await this.driver.clickElement(this.addCustomTokenButton);
  }

  async goBackToHomepage(): Promise<void> {
    console.log('Go back to homepage from the Manage Tokens page');
    await this.driver.clickElement(this.backButton);
  }
}

export default TokenManagementPage;
