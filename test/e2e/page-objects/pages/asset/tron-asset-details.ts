import { Driver } from '../../../webdriver/driver';

const SECTION_TITLES = [
  'Your balance',
  'Token details',
  'Market details',
  'Your activity',
] as const;
type SectionTitle = (typeof SECTION_TITLES)[number];

class TronAssetDetailsPage {
  private driver: Driver;

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly sendButton = '[data-testid="coin-overview-send"]';

  private readonly swapButton = '[data-testid="coin-overview-swap"]';

  private readonly receiveButton = '[data-testid="coin-overview-receive"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    // Use a section title that is rendered for every Tron asset (including
    // view-only assets like Staked TRX which have no action buttons).
    await this.driver.waitForSelector({ text: 'Your balance' });
  }

  async checkActionButtons(options: {
    swap?: boolean;
    send?: boolean;
    receive?: boolean;
  }): Promise<void> {
    if (options.send === true) {
      await this.driver.waitForSelector(this.sendButton);
    } else if (options.send === false) {
      await this.driver.assertElementNotPresent(this.sendButton);
    }
    if (options.swap === true) {
      await this.driver.waitForSelector(this.swapButton);
    } else if (options.swap === false) {
      await this.driver.assertElementNotPresent(this.swapButton);
    }
    if (options.receive === true) {
      await this.driver.waitForSelector(this.receiveButton);
    } else if (options.receive === false) {
      await this.driver.assertElementNotPresent(this.receiveButton);
    }
  }

  async checkPriceChart(): Promise<void> {
    await this.driver.waitForSelector(this.priceChart);
  }

  async checkDailyResourcesSection(): Promise<void> {
    await this.driver.waitForSelector({ text: 'Daily resource', tag: 'h4' });
    await this.driver.waitForSelector({ text: 'Energy', tag: 'p' });
    await this.driver.waitForSelector({ text: 'Bandwidth', tag: 'p' });
  }

  async checkSection(name: SectionTitle): Promise<void> {
    await this.driver.waitForSelector({ text: name });
  }

  async checkAllStandardSections(): Promise<void> {
    for (const title of SECTION_TITLES) {
      await this.checkSection(title);
    }
  }
}

export default TronAssetDetailsPage;
