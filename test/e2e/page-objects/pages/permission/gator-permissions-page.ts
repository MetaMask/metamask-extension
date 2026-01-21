import { Driver } from '../../../webdriver/driver';

/**
 * Represents the Gator Permissions page.
 * This page shows permission categories (Sites and Assets) when Gator Permissions feature is enabled.
 */
class GatorPermissionsPage {
  private driver: Driver;

  private readonly gatorPermissionsPage =
    '[data-testid="gator-permissions-page"]';

  private readonly backButton =
    '[data-testid="gator-permissions-page"] button[aria-label="Back"]';

  private readonly sitesButton = { text: 'Sites', tag: 'p' };

  private readonly assetsButton = { text: 'Token transfer', tag: 'p' };

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
   * Click on Assets/Token transfer to navigate to Token Transfer page
   */
  async clickAssets(): Promise<void> {
    console.log('Click Assets on Gator Permissions page');
    await this.driver.clickElement(this.assetsButton);
  }
}

export default GatorPermissionsPage;
