import { Driver } from '../../../webdriver/driver';
import HomePage from './homepage';

/**
 * A single DeFi protocol / position cell in the DeFi list.
 *
 * Screen: not a route by itself — cells inside the DeFi tab on `#/`.
 * Owns: asserting a cell's token/protocol name and market-value text.
 * Boundaries: tab-level empty/error states and navigation into protocol
 * details belong to `DeFiTab`.
 * Related: `DeFiTab` (owner; exposes `defiTabCells`).
 *
 * @see ui/components/app/assets/defi-list/cells/defi-protocol-cell.tsx
 */
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

/**
 * Home DeFi tab: protocol positions list, empty/error states, and entry into
 * protocol details.
 *
 * Screen: `#/` DeFi tab (`account-overview__defi-tab`), reached via
 * `HomePage.goToDeFiTab()`; protocol rows navigate to `#/defi/...`.
 * Owns: empty and error messages, the avatar group icon, `DeFiToken` cell
 * checks via `defiTabCells`, and clicking into Aave V3 details.
 * Boundaries: homepage chrome and other tabs stay on `HomePage`. Cell-level
 * name/value assertions belong to `DeFiToken`.
 * Related: `HomePage` (`goToDeFiTab`), `DeFiToken` (`defiTabCells`),
 * `NetworkFilter` (shared control bar on the DeFi list).
 *
 * @see ui/pages/defi/pages/defi-tab.tsx
 */
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
