import { Driver } from '../../webdriver/driver';

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

  async clickSwaps(): Promise<void> {
    console.log('Click bottom nav swaps tab');
    await this.driver.clickElement(this.swapsTab);
  }

  async waitForBottomNavBar(): Promise<void> {
    console.log('Wait for bottom nav bar to be visible');
    await this.driver.waitForSelector(this.navBar);
  }

  async clickHome(): Promise<void> {
    console.log('Click bottom nav home tab');
    await this.driver.clickElement(this.homeTab);
  }
}

export default BottomNavBar;
