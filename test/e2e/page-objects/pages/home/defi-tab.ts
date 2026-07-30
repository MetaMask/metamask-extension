import { Driver } from '../../../webdriver/driver';
import HomePage from './homepage';

class DeFiToken {
  protected readonly driver: Driver;

  protected readonly tokenListItemSecondaryValue =
    '[data-testid="defi-list-market-value"]';

  protected readonly tokenListItemTokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkTokenMarketValue(tokenListItemSecondaryValue: string) {
    console.log(
      'Check if token market value is displayed on token list item',
      tokenListItemSecondaryValue,
    );
    await this.driver.waitForSelector({
      css: this.tokenListItemSecondaryValue,
      text: tokenListItemSecondaryValue,
    });
  }

  async checkTokenName(tokenName: string) {
    console.log(
      'Check if token name is displayed on token list item',
      tokenName,
    );
    await this.driver.waitForSelector({
      css: this.tokenListItemTokenName,
      text: tokenName,
    });
  }
}

class DeFiTab extends HomePage {
  private readonly allNetworksOption =
    '[data-testid="network-filter-all__button"]';

  readonly defiTabCells: DeFiToken;

  private readonly errorMessage = '[data-testid="defi-tab-error-message"]';

  private readonly groupIcon = '[data-testid="avatar-group"]';

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  private readonly noPositionsMessage = '[data-testid="defi-tab-empty-state"]';

  private readonly popularNetworks =
    '[data-testid="network-filter-all__button"]';

  constructor(driver: Driver) {
    super(driver);
    this.defiTabCells = new DeFiToken(driver);
  }

  async checkErrorMessageIsDisplayed(): Promise<void> {
    console.log('Check that error message is displayed');
    await this.driver.waitForSelector(this.errorMessage);
  }

  async checkGroupIconIsDisplayed(): Promise<void> {
    console.log('Check that group icon is displayed');
    await this.driver.waitForSelector(this.groupIcon);
  }

  async checkNoPositionsMessageIsDisplayed(): Promise<void> {
    console.log('Check that no positions message is displayed');
    await this.driver.waitForSelector(this.noPositionsMessage);
  }

  async clickIntoAaveV3DetailsPage() {
    console.log('Click Aave V3 details page');
    await this.driver.clickElement({
      text: 'Aave V3',
    });
  }

  async openNetworksFilterAndClickPopularNetworks(): Promise<void> {
    console.log(`Opening the network filter and click popular networks`);
    await this.driver.clickElement(this.networksToggle);
    await this.driver.waitUntil(
      async () => {
        return Boolean(await this.driver.findElement(this.allNetworksOption));
      },
      {
        timeout: 5000,
        interval: 100,
      },
    );
    await this.driver.clickElement(this.popularNetworks);
  }
}

export default DeFiTab;
