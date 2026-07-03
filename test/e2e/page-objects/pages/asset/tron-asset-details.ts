import { Driver } from '../../../webdriver/driver';

const SECTION_TITLES = [
  'Your balance',
  'Token details',
  'Market details',
  'Your activity',
] as const;
type SectionTitle = (typeof SECTION_TITLES)[number];

class TronAssetDetailsPage {
  private readonly assetName = '[data-testid="asset-name"]';

  private driver: Driver;

  private readonly nativeOverflowBatchSellInMenu =
    '[data-testid="coin-overview-batchSell"]';

  /**
   * Native coin overflow when `batchSell` remote flag is enabled (latest UI):
   * Send/Swap are primary buttons; Receive and Batch sell live in the More menu.
   */
  private readonly nativeOverflowMoreButton =
    '[data-testid="coin-overview-more"]';

  private readonly nativeOverflowReceiveInMenu =
    '[data-testid="coin-overview-receive"]';

  /** Legacy sole-overflow layout when batch sell is disabled. */
  private readonly nativeOverflowSoleAction =
    '[data-testid="coin-overview-default"]';

  private readonly nativeSendButton = '[data-testid="coin-overview-send"]';

  private readonly nativeSwapButton = '[data-testid="coin-overview-swap"]';

  private readonly priceChart = '[data-testid="asset-price-chart"]';

  private readonly priceHeader = '[data-testid="asset-hovered-price"]';

  private readonly tokenBuyButton = '[data-testid="token-overview-buy"]';

  private readonly tokenSendButton = '[data-testid="eth-overview-send"]';

  private readonly tokenSwapButton = '[data-testid="token-overview-swap"]';

  private readonly tronDailyResourcesBandwidth =
    '[data-testid="tron-daily-resources-bandwidth"]';

  private readonly tronDailyResourcesBandwidthDescription =
    '[data-testid="tron-daily-resources-bandwidth-description"]';

  private readonly tronDailyResourcesDescription =
    '[data-testid="tron-daily-resources-description"]';

  private readonly tronDailyResourcesEnergy =
    '[data-testid="tron-daily-resources-energy"]';

  private readonly tronDailyResourcesEnergyDescription =
    '[data-testid="tron-daily-resources-energy-description"]';

  private readonly tronDailyResourcesSection =
    '[data-testid="tron-daily-resources"]';

  private readonly tronDailyResourcesTitle =
    '[data-testid="tron-daily-resources-title"]';

  private readonly tronStakedBalanceRowEnergy =
    '[data-testid="tron-staked-balance-row-energy"]';

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
      await this.checkNativeReceiveInOverflowMenu();
    } else if (options.receive === false) {
      await this.driver.assertElementNotPresent(
        this.nativeOverflowReceiveInMenu,
      );
      await this.driver.assertElementNotPresent(this.nativeOverflowSoleAction);
    }
  }

  async checkAllStandardSections(): Promise<void> {
    for (const title of SECTION_TITLES) {
      await this.checkSection(title);
    }
  }

  async checkAssetTitleContains(fragment: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.assetName,
      text: fragment,
    });
  }

  async checkBalanceText(expectedBalance: string): Promise<void> {
    await this.driver.waitForSelector({ text: expectedBalance });
  }

  async checkCurrentPriceHeader(): Promise<void> {
    await this.driver.waitForSelector(this.priceHeader);
  }

  async checkDailyResourcesSection(): Promise<void> {
    await this.driver.waitForSelector(this.tronDailyResourcesSection);
    await this.driver.waitForSelector(this.tronDailyResourcesTitle);
    await this.driver.waitForSelector(this.tronDailyResourcesDescription);
    await this.driver.waitForSelector(this.tronDailyResourcesEnergy);
    await this.driver.waitForSelector(this.tronDailyResourcesEnergyDescription);
    await this.driver.waitForSelector(this.tronDailyResourcesBandwidth);
    await this.driver.waitForSelector(
      this.tronDailyResourcesBandwidthDescription,
    );
  }

  /**
   * Asserts Receive is available via the batch-sell-enabled More overflow menu.
   * Requires `batchSell: { enabled: true }` in test fixtures.
   */
  async checkNativeReceiveInOverflowMenu(): Promise<void> {
    await this.driver.waitForSelector(this.nativeOverflowMoreButton);
    await this.driver.clickElement(this.nativeOverflowMoreButton);
    await this.driver.waitForSelector(this.nativeOverflowReceiveInMenu);
    await this.driver.waitForSelector(this.nativeOverflowBatchSellInMenu);
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

  /**
   * Asserts a staked TRX breakdown row under "Your balance" on native TRX
   * asset details (e.g. "Staked for Energy" with 20 TRX).
   * @param expectedBalance
   */
  async checkStakedForEnergyBalanceRow(expectedBalance: string): Promise<void> {
    await this.driver.waitForSelector(this.tronStakedBalanceRowEnergy);
    await this.driver.waitForSelector({ text: 'Staked for Energy' });
    await this.driver.waitForSelector({ text: expectedBalance });
  }

  async checkTokenActionButtons(): Promise<void> {
    await this.driver.waitForSelector(this.tokenBuyButton);
    await this.driver.waitForSelector(this.tokenSendButton);
    await this.driver.waitForSelector(this.tokenSwapButton);
    await this.driver.assertElementNotPresent(
      this.nativeOverflowReceiveInMenu,
    );
    await this.driver.assertElementNotPresent(this.nativeOverflowSoleAction);
  }
}

export default TronAssetDetailsPage;
