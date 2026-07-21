import { Driver } from '../../webdriver/driver';

/**
 * Page object for the BottomNavBar component.
 *
 * Only present when the user is in the bottom nav AB test treatment and on
 * an applicable route (home, perps-home, swaps, activity).
 */
class BottomNavBar {
  private readonly activityTab = '[data-testid="bottom-nav-activity"]';

  private readonly driver: Driver;

  private readonly homeTab = '[data-testid="bottom-nav-home"]';

  private readonly navBar = '[data-testid="bottom-nav-bar"]';

  private readonly perpsTab = '[data-testid="bottom-nav-perps"]';

  private readonly swapsTab = '[data-testid="bottom-nav-swaps"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async assertBottomNavIsNotPresent(): Promise<void> {
    console.log('Assert bottom nav bar is not present');
    await this.driver.assertElementNotPresent(this.navBar);
  }

  async assertOnHomeRoute(): Promise<void> {
    console.log('Assert current route is home');
    await this.driver.waitUntil(
      async () => {
        const isHome = await this.driver.executeScript(`
        const path = window.location.hash.slice(1).split('?')[0];
        return path === '/' || path === '';
      `);
        return Boolean(isHome);
      },
      { timeout: this.driver.timeout, interval: 100 },
    );
  }

  async assertOnRoute(route: string): Promise<void> {
    console.log(`Assert current route contains "${route}"`);
    await this.driver.waitForUrlContaining({ url: route });
  }

  async clickActivity(): Promise<void> {
    console.log('Click bottom nav activity tab');
    await this.driver.clickElement(this.activityTab);
  }

  async clickHome(): Promise<void> {
    console.log('Click bottom nav home tab');
    await this.driver.clickElement(this.homeTab);
  }

  async clickPerps(): Promise<void> {
    console.log('Click bottom nav perps tab');
    await this.driver.clickElement(this.perpsTab);
  }

  async clickSwaps(): Promise<void> {
    console.log('Click bottom nav swaps tab');
    await this.driver.clickElement(this.swapsTab);
  }

  async waitForBottomNavBar(): Promise<void> {
    console.log('Wait for bottom nav bar to be visible');
    await this.driver.waitForSelector(this.navBar);
  }
}

export default BottomNavBar;
