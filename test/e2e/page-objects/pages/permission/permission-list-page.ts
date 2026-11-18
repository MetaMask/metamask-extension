import { Driver } from '../../../webdriver/driver';

/**
 * Connected-sites permissions list.
 *
 * Screen: `#/permissions`.
 * Owns: page-loaded checks, counting connection list items, asserting a site
 * is listed, opening a site's permission page, and back navigation.
 * Boundaries: the list only. Per-site edit/disconnect is
 * `EditConnectedAccountsPage`; the Gator category hub is
 * `GatorPermissionsPage`.
 * Related: `EditConnectedAccountsPage`, `GatorPermissionsPage`,
 * `flows/permissions.flow.ts`.
 *
 * @see ui/components/multichain/pages/permissions-page/permissions-page.js
 * @see test/e2e/page-objects/flows/permissions.flow.ts
 */
class PermissionListPage {
  private readonly backButton = '[data-testid="permissions-page-back"]';

  private readonly connectionListItem = '[data-testid="connection-list-item"]';

  private driver: Driver;

  private readonly page = '[data-testid="parent-selector-permission-list"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if account is connected to site
   *
   * @param site - Site to check
   */
  async checkConnectedToSite(site: string): Promise<void> {
    console.log('Check if account is connected to site', site);
    await this.driver.waitForSelector({ text: site, tag: 'p' });
  }

  /**
   * Check the number of connected sites
   *
   * @param expectedNumberOfConnectedSites - The expected number of connected sites, default to 1
   */
  async checkNumberOfConnectedSites(
    expectedNumberOfConnectedSites: number = 1,
  ): Promise<void> {
    console.log(
      `Verify the number of connected sites is: ${expectedNumberOfConnectedSites}`,
    );
    await this.driver.waitForSelector(this.connectionListItem);
    await this.driver.wait(async () => {
      const connectedSites = await this.driver.findElements(
        this.connectionListItem,
      );
      return connectedSites.length === expectedNumberOfConnectedSites;
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.page);
    } catch (e) {
      console.log(
        'Timeout while waiting for permission list page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Permission list page is loaded');
  }

  /**
   * Click the back button on the permissions page
   */
  async clickBackButton(): Promise<void> {
    console.log('Click back button on permissions page');
    await this.driver.clickElement(this.backButton);
  }

  /**
   * Open permission page for site
   *
   * @param site - Site to open
   */
  async openPermissionPageForSite(site: string): Promise<void> {
    console.log('Open permission page for site', site);
    await this.driver.clickElement({ text: site, tag: 'p' });
  }
}

export default PermissionListPage;
