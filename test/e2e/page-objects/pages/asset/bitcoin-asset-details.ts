import { Driver } from '../../../webdriver/driver';

const SECTION_TITLES = [
  'Your balance',
  'Token details',
  'Market details',
  'Your activity',
] as const;
type SectionTitle = (typeof SECTION_TITLES)[number];

class BitcoinAssetDetailsPage {
  private driver: Driver;

  private readonly nativeReceiveButton =
    '[data-testid="coin-overview-default"], [data-testid="coin-overview-more"]';

  private readonly nativeSendButton = '[data-testid="coin-overview-send"]';

  private readonly nativeSwapButton = '[data-testid="coin-overview-swap"]';

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly priceHeader = '[data-testid="asset-hovered-price"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkActionButtons(options: {
    swap?: boolean;
    send?: boolean;
    receive?: boolean;
  }): Promise<void> {
    if (options.send === true) {
      await this.driver.waitForSelector(this.nativeSendButton);
    } else if (options.send === false) {
      await this.driver.assertElementNotPresent(this.nativeSendButton);
    }
    if (options.swap === true) {
      await this.driver.waitForSelector(this.nativeSwapButton);
    } else if (options.swap === false) {
      await this.driver.assertElementNotPresent(this.nativeSwapButton);
    }
    if (options.receive === true) {
      await this.driver.waitForSelector(this.nativeReceiveButton);
    } else if (options.receive === false) {
      await this.driver.assertElementNotPresent(this.nativeReceiveButton);
    }
  }

  async checkAllStandardSections(): Promise<void> {
    for (const title of SECTION_TITLES) {
      await this.checkSection(title);
    }
  }

  async checkCurrentPriceHeader(): Promise<void> {
    await this.driver.waitForSelector(this.priceHeader);
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector({ text: 'Your balance' });
  }

  async checkPriceChart(): Promise<void> {
    await this.driver.waitForSelector(this.priceChart);
  }

  async checkSection(name: SectionTitle): Promise<void> {
    await this.driver.waitForSelector({ text: name });
  }

  async checkStakedBalanceIsAbsent(): Promise<void> {
    await this.driver.assertElementNotPresent({ text: 'Staked balance' });
  }
}

export default BitcoinAssetDetailsPage;
