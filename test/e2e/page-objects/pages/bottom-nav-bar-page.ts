import { Driver } from '../../webdriver/driver';
import { SWAP_PATH } from '../../../../ui/helpers/constants/routes';

/**
 * Page object for the BottomNavBar component.
 *
 * Only present when the user is in the bottom nav AB test treatment and on
 * an applicable route (home, perps-home, swaps, activity).
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
