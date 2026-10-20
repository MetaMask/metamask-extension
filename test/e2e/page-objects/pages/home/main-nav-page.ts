import { Driver } from '../../../webdriver/driver';

export const MAIN_NAV_HOME_ITEM =
  '[data-testid="bottom-nav-home"], [data-testid="side-nav-home"]';

/**
 * Main navigation chrome: the bottom nav bar (bottom-nav AB test treatment),
 * or the side nav (fullscreen design, viewports >= 768px).
 *
 * Screen: chrome component (not a full page). The bottom nav bar is only
 * present in the AB test treatment on main nav routes (home, perps-home,
 * activity, money). The side nav is present on the same routes regardless of
 * the AB test, when the viewport is wide enough.
 * Boundaries: the nav chrome only. Destination screens belong to `HomePage`,
 * swap/bridge page objects, etc. after navigation.
 * Related: `HomePage`, swap/bridge prepare flows reached from home.
 *
 * @see ui/components/app/bottom-nav-bar/bottom-nav-bar.tsx
 * @see ui/components/app/side-nav/side-nav.tsx
 */
class MainNav {
  private readonly driver: Driver;

  private readonly homeItem = MAIN_NAV_HOME_ITEM;

  private readonly moneyItem =
    '[data-testid="bottom-nav-money"], [data-testid="side-nav-money"]';

  private readonly nav =
    '[data-testid="parent-selector-bottom-nav-bar"], [data-testid="side-nav"]';

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
    await this.driver.waitForSelector(this.nav);
  }

  async clickHome(): Promise<void> {
    console.log('Click main nav home item');
    await this.driver.clickElement(this.homeItem);
    await this.assertOnRoute('/');
  }

  /**
   * Click the Money item. Only rendered once the Money Account availability
   * query resolves, so wait for it rather than failing on first paint.
   */
  async clickMoney(): Promise<void> {
    console.log('Click main nav money item');
    await this.driver.clickElement(this.moneyItem);
    await this.assertOnRoute('/money-home');
  }
}

export default MainNav;
