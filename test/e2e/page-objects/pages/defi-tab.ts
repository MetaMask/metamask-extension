import { Driver } from '../../webdriver/driver';
import TokenList from './token-list';

class DeFiTab extends TokenList {
  protected readonly driver: Driver;

  private readonly allNetworksOption =
    '[data-testid="network-filter-all__button"]';

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  private readonly popularNetworks =
    '[data-testid="network-filter-all__button"]';

  private readonly stakeLink = '[data-testid="staking-entrypoint-0x1"]';

  private readonly groupIcon = '[data-testid="avatar-group"]';

  private readonly errorMessage = '[data-testid="defi-tab-error-message"]';

  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  async openNetworksFilterAndClickPopularNetworks(): Promise<void> {
    console.log(`Opening the network filter and click popular networks`);
    await this.driver.clickElement(this.networksToggle);
    await this.driver.waitUntil(
      async () => {
        return await this.driver.findElement(this.allNetworksOption);
      },
      {
        timeout: 5000,
        interval: 100,
      },
    );
    await this.driver.clickElement(this.popularNetworks);
  }

  async clickIntoAaveV3DetailsPage() {
    console.log('Click Aave V3 details page');
    await this.driver.clickElement({
      text: 'Aave V3',
    });
  }

  async check_errorMessageIsDisplayed(): Promise<void> {
    console.log('Check that error message is displayed');
    await this.driver.waitForSelector(this.errorMessage);
  }

  async check_groupIconIsDisplayed(): Promise<void> {
    console.log('Check that group icon is displayed');
    await this.driver.waitForSelector(this.groupIcon);
  }

  async waitForStakeLink(): Promise<void> {
    console.log('Wait for stake link to be displayed');
    await this.driver.waitForSelector(this.stakeLink);
  }
}

export default DeFiTab;
