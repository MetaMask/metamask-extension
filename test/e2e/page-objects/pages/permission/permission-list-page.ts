import { Driver } from '../../../webdriver/driver';

/**
 * Represents the permissions list page.
 * This page allows users to view permissions for connected sites.
 */
class PermissionListPage {
  private driver: Driver;

  private readonly connectionListItem = '[data-testid="connection-list-item"]';

  private readonly permissionsPage = '[data-testid="permissions-page"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.permissionsPage);
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
   * Open permission page for site
   *
   * @param site - Site to open
   */
  async openPermissionPageForSite(site: string): Promise<void> {
    console.log('Open permission page for site', site);
    await this.driver.clickElement({ text: site, tag: 'p' });
  }

  /**
   * Check if account is connected to site
   *
   * @param site - Site to check
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_connectedToSite(site: string): Promise<void> {
    console.log('Check if account is connected to site', site);
    await this.driver.waitForSelector({ text: site, tag: 'p' });
  }

  /**
   * Check the number of connected sites
   *
   * @param expectedNumberOfConnectedSites - The expected number of connected sites, default to 1
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_numberOfConnectedSites(
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
}

export default PermissionListPage;
