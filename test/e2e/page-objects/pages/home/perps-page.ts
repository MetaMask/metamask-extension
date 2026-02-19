import { Driver } from '../../../webdriver/driver';

class PerpsPage {
  private readonly driver: Driver;

  private readonly perpsTab = {
    testId: 'account-overview__perps-tab',
  };

  private readonly perpsTabView = {
    testId: 'perps-tab-view',
  };

  private readonly perpsTabViewLoading = {
    testId: 'perps-tab-view-loading',
  };

  private readonly perpsControlBar = {
    testId: 'perps-tab-control-bar',
  };

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  private readonly perpsOrdersSection = {
    testId: 'perps-orders-section',
  };

  private readonly perpsExploreCryptoSection = {
    testId: 'perps-explore-crypto-section',
  };

  private readonly perpsExploreHip3Section = {
    testId: 'perps-explore-hip3-section',
  };

  private readonly seeAllPerpsCta = {
    testId: 'see-all-perps-cta',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async goToPerpsTab(): Promise<void> {
    console.log('Go to perps tab on homepage');
    await this.driver.clickElement(this.perpsTab);
  }

  async waitForPerpsTabToLoad(): Promise<void> {
    console.log('Wait for perps tab view to load');
    await this.driver.waitForSelector(this.perpsTabView);
  }

  async checkPerpsTabIsDisplayed(): Promise<void> {
    console.log('Check perps tab is displayed in the tab bar');
    await this.driver.waitForSelector(this.perpsTab);
  }

  async checkPerpsTabIsNotDisplayed(): Promise<void> {
    console.log('Check perps tab is not displayed in the tab bar');
    await this.driver.assertElementNotPresent(this.perpsTab);
  }

  async checkControlBarIsDisplayed(): Promise<void> {
    console.log('Check perps control bar is displayed');
    await this.driver.waitForSelector(this.perpsControlBar);
  }

  async checkPositionsSectionIsDisplayed(): Promise<void> {
    console.log('Check perps positions section is displayed');
    await this.driver.waitForSelector(this.perpsPositionsSection);
  }

  async checkOrdersSectionIsDisplayed(): Promise<void> {
    console.log('Check perps orders section is displayed');
    await this.driver.waitForSelector(this.perpsOrdersSection);
  }

  async checkExploreCryptoSectionIsDisplayed(): Promise<void> {
    console.log('Check perps explore crypto section is displayed');
    await this.driver.waitForSelector(this.perpsExploreCryptoSection);
  }

  async checkExploreHip3SectionIsDisplayed(): Promise<void> {
    console.log('Check perps explore HIP-3 section is displayed');
    await this.driver.waitForSelector(this.perpsExploreHip3Section);
  }

  async checkSeeAllPerpsCtaIsDisplayed(): Promise<void> {
    console.log('Check see all perps CTA is displayed');
    await this.driver.waitForSelector(this.seeAllPerpsCta);
  }

  async checkMarketIsDisplayed(symbol: string): Promise<void> {
    const testId = `explore-crypto-${symbol}`;
    console.log(`Check market ${symbol} is displayed`);
    await this.driver.waitForSelector({ testId });
  }

  async checkHip3MarketIsDisplayed(symbol: string): Promise<void> {
    const testId = `explore-hip3-${symbol.replace(/:/gu, '-')}`;
    console.log(`Check HIP-3 market ${symbol} is displayed`);
    await this.driver.waitForSelector({ testId });
  }

  async clickMarket(symbol: string): Promise<void> {
    const testId = `explore-crypto-${symbol}`;
    console.log(`Click market ${symbol}`);
    await this.driver.clickElement({ testId });
  }

  async checkTextIsDisplayed(text: string): Promise<void> {
    console.log(`Check text "${text}" is displayed`);
    await this.driver.waitForSelector({ text, tag: 'p' });
  }
}

export default PerpsPage;
