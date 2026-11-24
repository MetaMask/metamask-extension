import { Driver } from '../../../webdriver/driver';

/**
 * Main navigation chrome: the bottom nav bar (narrow layout) or the side nav
 * (wide layout). Both tag their items and container with the same test ids.
 *
 * Screen: chrome component (not a full page), present on applicable routes
 * (home, perps-home, activity, money).
 * Owns: the nav chrome itself and item clicks that assert navigation.
 * Boundaries: the nav chrome only. Destination screens belong to `HomePage`,
 * swap/bridge page objects, etc. after navigation.
 * Related: `HomePage`, swap/bridge prepare flows reached from home.
 *
 * @see ui/components/app/bottom-nav-bar/bottom-nav-bar.tsx
 * @see ui/components/app/side-nav/side-nav.tsx
 */
class MainNav {
  private readonly driver: Driver;

  private readonly homeTab = '[data-testid="main-nav-home"]';

  private readonly moneyTab = '[data-testid="main-nav-money"]';

  private readonly page = {
    testId: 'parent-selector-main-nav',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async assertOnRoute(route: string): Promise<void> {
    console.log(`Assert current route is "${route}"`);
    await this.driver.waitForUrl({
      url: `${this.driver.extensionUrl}/home.html#${route}`,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for main nav to load');
    await this.driver.waitForSelector(this.page);
  }

  async clickHome(): Promise<void> {
    console.log('Click main nav home item');
    await this.driver.clickElement(this.homeTab);
    await this.assertOnRoute('/');
  }

  /**
   * Click the Money item. Only rendered once the Money Account availability
   * query resolves, so wait for it rather than failing on first paint.
   */
  async clickMoney(): Promise<void> {
    console.log('Click main nav money item');
    await this.driver.clickElement(this.moneyTab);
    await this.assertOnRoute('/money-home');
  }
}

export default MainNav;
