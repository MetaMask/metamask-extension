import { Driver } from '../../../webdriver/driver';

/**
 * Represents the Gator Permissions page.
 * This page shows permission categories (Connections and Assets) when Gator Permissions feature is enabled.
 */
class GatorPermissionsPage {
  private readonly assetsButton = { text: 'Token transfer', tag: 'p' };

  private readonly backButton =
    '[data-testid="gator-permissions-page"] button[aria-label="Back"]';

  private readonly connectionsButton = { text: 'Connections', tag: 'p' };

  private driver: Driver;

  private readonly gatorPermissionsPage =
    '[data-testid="gator-permissions-page"]';

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
   * Click on Connections to navigate to Permissions page
   */
  async clickSites(): Promise<void> {
    console.log('Click Connections on Gator Permissions page');
    await this.driver.clickElement(this.connectionsButton);
  }

  /**
   * Check if the Connections button is present on the page.
   * The button may not be present if there are no site connections.
   */
  async isConnectionsButtonPresent(): Promise<boolean> {
    return await this.driver.isElementPresentAndVisible(this.connectionsButton);
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
