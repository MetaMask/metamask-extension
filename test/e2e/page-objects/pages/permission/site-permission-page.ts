import { Driver } from '../../../webdriver/driver';

/**
 * Represents the site permission page.
 * This page allows users to view and manage permissions for a connected site.
 */
class SitePermissionPage {
  private driver: Driver;

  private readonly enabledNetworksInfo = {
    text: 'Use your enabled networks',
    tag: 'p',
  };

  private readonly connectedAccountsInfo = {
    text: 'See your accounts and suggest transactions',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Check if site permission page is loaded
   *
   * @param site - Site to check
   */
  async check_pageIsLoaded(site: string): Promise<void> {
    try {
      await this.driver.waitForSelector(this.connectedAccountsInfo);
      await this.driver.waitForSelector(this.enabledNetworksInfo);
      await this.driver.waitForSelector({ text: site, tag: 'span' });
    } catch (e) {
      console.log(
        'Timeout while waiting for site permission page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Site permission page is loaded');
  }
}

export default SitePermissionPage;
