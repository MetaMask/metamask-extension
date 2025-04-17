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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async click_backButton() {
    console.log('Click back button');
    await this.driver.clickElement(this.backButton);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_deFiProtocolNameIsDisplayed(description: string) {
    console.log('Check if defi protocol name is displayed', description);
    await this.driver.waitForSelector({
      css: this.defiProtocolName,
      text: description,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_suppliedHeadingIsDisplayed(): Promise<void> {
    console.log('Check that supplied heading is displayed');
    await this.driver.waitForSelector({
      text: 'Supplied',
      css: this.suppliedHeading,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_defiDetailsNameIsDisplayed(name: string) {
    console.log('Check if DeFi name is displayed on details page', name);
    await this.driver.waitForSelector({
      css: this.defiProtocolName,
      text: name,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_defiDetailsTotalValueIsDisplayed(defiProtocolTotalVlaue: string) {
    console.log('Check if DeFi total value is displayed on DeFi details page');
    await this.driver.waitForSelector({
      css: this.defiProtocolTotalVlaue,
      text: defiProtocolTotalVlaue,
    });
  }
}

export default DeFiDetailsPage;
