import { Driver } from '../../../webdriver/driver';

/**
 * Gator permissions hub: Connections and Token transfer categories.
 *
 * Screen: `#/gator-permissions` when the Gator permissions feature is enabled.
 * Owns: page-loaded / displayed checks, navigating into Connections (Dapps) or Token
 * transfer (Assets), and back toward home.
 * Boundaries: the category hub only. Site list and per-site management are
 * `PermissionListPage` / `EditConnectedAccountsPage`.
 * Related: `PermissionListPage`, `flows/permissions.flow.ts`.
 *
 * @see ui/components/multichain/pages/gator-permissions/gator-permissions-page.tsx
 * @see test/e2e/page-objects/flows/permissions.flow.ts
 */
class GatorPermissionsPage {
  private readonly assetsButton = { text: 'Token transfer', tag: 'p' };

  private readonly backButton =
    '[data-testid="parent-selector-gator-permissions"] button[aria-label="Back"]';

  private readonly connectionsButton = { text: 'Connections', tag: 'p' };

  private readonly driver: Driver;

  private readonly loadingIndicator =
    '[data-testid="gator-permissions-loading"]';

  private readonly page = '[data-testid="parent-selector-gator-permissions"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the Gator Permissions page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.page);
    } catch (e) {
      console.log(
        'Timeout while waiting for Gator Permissions page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Gator Permissions page is loaded');
  }

  /**
   * Click on Assets/Token transfer to navigate to Token Transfer Permissions page
   */
  async clickAssets(): Promise<void> {
    console.log('Click Assets on Gator Permissions page');
    await this.driver.clickElement(this.assetsButton);
  }

  /**
   * Click the back button to navigate to home
   */
  async clickBackButton(): Promise<void> {
    console.log('Click back button on Gator Permissions page');
    await this.driver.clickElement(this.backButton);
  }

  /**
   * Click on Connections to navigate to Dapp Permissions page
   */
  async clickConnections(): Promise<void> {
    console.log('Click Connections on Gator Permissions page');
    await this.driver.clickElement(this.connectionsButton);
  }

  /**
   * Check if the Connections (Dapps) button is present on the page.
   * The button may not be present if there are no site connections.
   *
   * @param timeout - Timeout in ms. Use a short timeout (1-2s) after
   * waitForLoadingComplete() to avoid burning the full driver timeout
   * when the button doesn't exist (auto-redirect case).
   */
  async isConnectionsButtonPresent(timeout = 2000): Promise<boolean> {
    return await this.driver.isElementPresentAndVisible(
      this.connectionsButton,
      timeout,
    );
  }

  /**
   * Check if the Gator Permissions page is displayed.
   * Useful for flow logic to detect whether we landed on this intermediate page.
   */
  async isPageDisplayed(): Promise<boolean> {
    return await this.driver.isElementPresentAndVisible(this.page);
  }

  /**
   * Wait for the loading spinner to disappear.
   * Call this before checking for buttons to avoid race conditions.
   */
  async waitForLoadingComplete(): Promise<void> {
    console.log('Waiting for Gator Permissions page to finish loading');
    await this.driver.assertElementNotPresent(this.loadingIndicator, {
      timeout: 10000,
    });
    console.log('Gator Permissions page finished loading');
  }
}

export default GatorPermissionsPage;
