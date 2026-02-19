import { Driver } from '../../../webdriver/driver';

class PerpsTabPage {
  private readonly driver: Driver;

  private readonly marketDetailPage =
    '[data-testid="perps-market-detail-page"]';

  private readonly perpsTabButton =
    '[data-testid="account-overview__perps-tab"]';

  private readonly perpsTabOrdersSection =
    '[data-testid="perps-orders-section"]';

  private readonly perpsTabPositionsSection =
    '[data-testid="perps-positions-section"]';

  private readonly perpsTabView = '[data-testid="perps-tab-view"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkMarketDetailPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.marketDetailPage);
  }

  async checkPerpsTabIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsTabButton);
  }

  async checkPerpsTabViewIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.perpsTabView,
      this.perpsTabPositionsSection,
      this.perpsTabOrdersSection,
    ]);
  }

  async clickPositionCard(symbol: string): Promise<void> {
    await this.driver.clickElement(`[data-testid="position-card-${symbol}"]`);
  }

  async openPerpsTab(): Promise<void> {
    await this.driver.clickElement(this.perpsTabButton);
  }
}

export default PerpsTabPage;
