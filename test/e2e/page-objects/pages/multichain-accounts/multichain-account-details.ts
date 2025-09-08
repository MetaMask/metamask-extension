import { Driver } from '../../../webdriver/driver';

class MultichainAccountDetailsPage {
  private readonly driver: Driver;

  private readonly accountNameHeader = '.multichain-page-header';

  private readonly container = 'multichain-account-details-page';

  private readonly networksButton = '[data-testid="network-addresses-link"]';

  private readonly accountNameButton = '[data-testid="account-name-action"]';

  private readonly privateKeyButton =
    '[data-testid="account-show-private-key-button"]';

  private readonly addressesButton = '[data-testid="network-addresses-link"]';

  private readonly srpsButton = '[data-testid="account-show-srp-button"]';

  private readonly removeAccountButton =
    '[data-testid="account-list-menu-remove"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.container);
  }

  async clickNetworksButton(): Promise<void> {
    await this.driver.clickElement(this.networksButton);
  }

  async clickAccountNameButton(): Promise<void> {
    await this.driver.clickElement(this.accountNameButton);
  }

  async clickPrivateKeyButton(): Promise<void> {
    await this.driver.clickElement(this.privateKeyButton);
  }

  async clickAddressesButton(): Promise<void> {
    await this.driver.clickElement(this.addressesButton);
  }

  async clickSrpsButton(): Promise<void> {
    await this.driver.clickElement(this.srpsButton);
  }

  async clickRemoveAccountButton(): Promise<void> {
    await this.driver.clickElement(this.removeAccountButton);
  }
}

export default MultichainAccountDetailsPage;
