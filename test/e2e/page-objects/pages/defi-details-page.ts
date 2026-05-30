import { Driver } from '../../webdriver/driver';

class DeFiDetailsPage {
  private readonly driver: Driver;

  private readonly defiBackButton =
    '[data-testid="defi-details-page-back-button"]';

  private readonly defiProtocolName = '[data-testid="defi-details-page-title"]';

  private readonly defiProtocolTotalValue =
    '[data-testid="defi-details-page-market-value"]';

  private readonly suppliedHeading =
    '[data-testid="defi-details-list-supply-position"]';

  private readonly tokenListItemSecondaryValue =
    '[data-testid="multichain-token-list-item-secondary-value"]';

  private readonly tokenListItemTokenName =
    '[data-testid="multichain-token-list-item-token-name"]';

  private readonly tokenListItemValue =
    '[data-testid="multichain-token-list-item-value"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickBackButton() {
    console.log('Click back button');
    await this.driver.clickElement(this.defiBackButton);
  }

  async checkDeFiProtocolNameIsDisplayed(description: string) {
    console.log('Check if defi protocol name is displayed', description);
    await this.driver.waitForSelector({
      css: this.defiProtocolName,
      text: description,
    });
  }

  async checkSuppliedHeadingIsDisplayed(): Promise<void> {
    console.log('Check that supplied heading is displayed');
    await this.driver.waitForSelector({
      text: 'Supplied',
      css: this.suppliedHeading,
    });
  }

  async checkDefiDetailsNameIsDisplayed(name: string) {
    console.log('Check if DeFi name is displayed on details page', name);
    await this.driver.waitForSelector({
      css: this.defiProtocolName,
      text: name,
    });
  }

  async checkDefiDetailsTotalValueIsDisplayed(defiProtocolTotalValue: string) {
    console.log('Check if DeFi total value is displayed on DeFi details page');
    await this.driver.waitForSelector({
      css: this.defiProtocolTotalValue,
      text: defiProtocolTotalValue,
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

  async checkTokenBalanceWithName(tokenListItemValue: string) {
    console.log(
      'Check if token balance is displayed on token list item',
      tokenListItemValue,
    );
    await this.driver.waitForSelector({
      css: this.tokenListItemValue,
      text: tokenListItemValue,
    });
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
}

export default DeFiDetailsPage;
