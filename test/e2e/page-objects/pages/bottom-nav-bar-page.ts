import { Driver } from '../../webdriver/driver';
import { SWAP_PATH } from '../../../../ui/helpers/constants/routes';

/**
 * Bottom navigation bar chrome for the bottom-nav AB test treatment.
 *
 * Screen: chrome component (not a full page), only present in the bottom nav
 * AB test treatment on applicable routes (home, perps-home, swaps, activity).
 * Owns: the bottom nav bar itself and tab clicks that assert navigation to
 * home or swaps.
 * Boundaries: the nav chrome only. Destination screens belong to `HomePage`,
 * swap/bridge page objects, etc. after navigation.
 * Related: `HomePage`, swap/bridge prepare flows reached via the swaps tab.
 *
 * @see ui/components/app/bottom-nav-bar/bottom-nav-bar.tsx
 */
class BottomNavBar {
  private readonly driver: Driver;

  private readonly homeTab = '[data-testid="bottom-nav-home"]';

  private readonly navBar = '[data-testid="bottom-nav-bar"]';

  private readonly swapsTab = '[data-testid="bottom-nav-swaps"]';

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
    console.log('Wait for bottom nav bar to load');
    await this.driver.waitForSelector(this.navBar);
  }

  async clickHome(): Promise<void> {
    console.log('Click bottom nav home tab');
    await this.driver.clickElement(this.homeTab);
    await this.assertOnRoute('/');
  }

  async clickSwaps(): Promise<void> {
    console.log('Click bottom nav swaps tab');
    await this.driver.clickElement(this.swapsTab);
    await this.assertOnRoute(SWAP_PATH);
  }
}

export default BottomNavBar;
