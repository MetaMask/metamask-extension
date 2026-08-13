import { Driver } from '../../../webdriver/driver';

/**
 * Gator permissions hub: Sites and Token transfer categories.
 *
 * Screen: `#/gator-permissions` when the Gator permissions feature is enabled.
 * Owns: page-loaded / displayed checks, navigating into Sites or Token
 * transfer (Assets), and back toward home.
 * Boundaries: the category hub only. Site list and per-site management are
 * `PermissionListPage` / `SitePermissionPage`.
 * Related: `PermissionListPage`, `flows/permissions.flow.ts`.
 *
 * @see ui/components/multichain/pages/gator-permissions/gator-permissions-page.tsx
 * @see test/e2e/page-objects/flows/permissions.flow.ts
 */
class GatorPermissionsPage {
  private readonly assetsButton = { text: 'Token transfer', tag: 'p' };

  private readonly backButton =
    '[data-testid="gator-permissions-page"] button[aria-label="Back"]';

  private driver: Driver;

  private readonly gatorPermissionsPage =
    '[data-testid="gator-permissions-page"]';

  private readonly sitesButton = { text: 'Sites', tag: 'p' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if the Gator Permissions page is loaded
   */
  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.gatorPermissionsPage);
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
   * Click on Assets/Token transfer to navigate to Token Transfer page
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
   * Click on Sites to navigate to Sites Permissions page
   */
  async clickSites(): Promise<void> {
    console.log('Click Sites on Gator Permissions page');
    await this.driver.clickElement(this.sitesButton);
  }

  /**
   * Check if the Gator Permissions page is displayed.
   * Useful for flow logic to detect whether we landed on this intermediate page.
   */
  async isPageDisplayed(): Promise<boolean> {
    return await this.driver.isElementPresentAndVisible(
      this.gatorPermissionsPage,
    );
  }
}

export default GatorPermissionsPage;
