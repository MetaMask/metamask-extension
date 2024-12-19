import { Driver } from '../../../webdriver/driver';

/**
 * Represents the site permission page.
 * This page allows users to view and manage permissions for a connected site.
 */
class SitePermissionPage {
  private driver: Driver;

  private readonly editAccountsModalTitle = {
    text: 'Edit accounts',
    tag: 'h4',
  };

  private readonly editButton = '[data-testid="edit"]';

  private readonly enabledNetworksInfo = {
    text: 'Use your enabled networks',
    tag: 'p',
  };

  private readonly connectedAccountsInfo = {
    text: 'See your accounts and suggest transactions',
    tag: 'p',
  };

  private readonly confirmEditAccountsButton = '[data-testid="connect-more-accounts-button"]';

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

  async editPermissionsForAccount(accountLabels: string[]): Promise<void> {
    const editButtons = await this.driver.findElements(this.editButton);
    await editButtons[0].click();
    await this.driver.waitForSelector(this.editAccountsModalTitle);
    for (const accountLabel of accountLabels) {
      await this.driver.clickElement({ text: accountLabel, tag: 'button' });
    }
    await this.driver.clickElementAndWaitToDisappear(this.confirmEditAccountsButton);
  }

  /**
   * Check if the number of connected accounts is correct
   *
   * @param number - Expected number of connected accounts
   */
  async check_connectedAccountsNumber(number: number): Promise<void> {
    console.log(`Check that the number of connected accounts is: ${number}`);
    await this.driver.waitForSelector({
      text: `${number} accounts connected`,
      tag: 'span',
    });
  }
}

export default SitePermissionPage;
