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

  private readonly nativeReceiveButton =
    '[data-testid="coin-overview-receive"]';

  private readonly nativeSendButton = '[data-testid="coin-overview-send"]';

  private readonly nativeSwapButton = '[data-testid="coin-overview-swap"]';

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly priceHeader = '[data-testid="asset-hovered-price"]';

  private readonly tokenBuyButton = '[data-testid="token-overview-buy"]';

  private readonly tokenSendButton = '[data-testid="eth-overview-send"]';

  private readonly tokenSwapButton = '[data-testid="token-overview-swap"]';

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

  async checkTokenActionButtons(): Promise<void> {
    await this.driver.waitForSelector(this.tokenBuyButton);
    await this.driver.waitForSelector(this.tokenSendButton);
    await this.driver.waitForSelector(this.tokenSwapButton);
    await this.driver.assertElementNotPresent(this.nativeReceiveButton);
  }

  async checkPriceChart(): Promise<void> {
    await this.driver.waitForSelector(this.priceChart);
  }

  async checkCurrentPriceHeader(): Promise<void> {
    await this.driver.waitForSelector(this.priceHeader);
  }

  async checkDailyResourcesSection(): Promise<void> {
    await this.driver.waitForSelector({ text: 'Daily resource', tag: 'h4' });
    await this.driver.waitForSelector({
      text: 'This is your daily allowance',
      tag: 'p',
    });
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
