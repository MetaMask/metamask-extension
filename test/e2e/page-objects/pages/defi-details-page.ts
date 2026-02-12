import { Driver } from '../../webdriver/driver';
import TokenList from './token-list';

class DeFiDetailsPage extends TokenList {
  protected readonly driver: Driver;

  private readonly defiBackButton =
    '[data-testid="defi-details-page-back-button"]';

  private readonly defiProtocolName = '[data-testid="defi-details-page-title"]';

  private readonly defiProtocolTotalVlaue =
    '[data-testid="defi-details-page-market-value"]';

  protected readonly backButton =
    '[data-testid="defi-details-page-back-button"]';

  private readonly suppliedHeading =
    '[data-testid="defi-details-list-supply-position"]';

  constructor(driver: Driver) {
    super(driver);
    this.driver = driver;
  }

  async clickBackButton() {
    console.log('Click back button');
    await this.driver.clickElement(this.backButton);
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

  async checkDefiDetailsTotalValueIsDisplayed(defiProtocolTotalVlaue: string) {
    console.log('Check if DeFi total value is displayed on DeFi details page');
    await this.driver.waitForSelector({
      css: this.defiProtocolTotalVlaue,
      text: defiProtocolTotalVlaue,
    });
  }
}

export default DeFiDetailsPage;
