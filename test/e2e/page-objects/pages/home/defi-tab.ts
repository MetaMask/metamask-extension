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
  readonly defiTabCells: DeFiToken;

  private readonly errorMessage = '[data-testid="defi-tab-error-message"]';

  private readonly groupIcon = '[data-testid="avatar-group"]';

  private readonly noPositionsMessage = '[data-testid="defi-tab-empty-state"]';

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
}

export default DeFiTab;
