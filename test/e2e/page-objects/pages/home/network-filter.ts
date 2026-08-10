import { Driver } from '../../../webdriver/driver';

/**
 * The network filter button in the asset list control bar. It displays the
 * currently active network filter and opens the select network modal. The
 * control bar is shared by the asset list tabs, so this is not owned by any
 * single tab.
 */
class NetworkFilter {
  private readonly driver: Driver;

  private readonly networksToggle = '[data-testid="sort-by-networks"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkIsLoaded(): Promise<void> {
    console.log('Waiting for the network filter');
    await this.driver.waitForSelector(this.networksToggle);
  }

  /**
   * Checks the label displayed on the network filter.
   *
   * @param expectedText - The label the filter is expected to display.
   */
  async checkLabelIs(expectedText: string): Promise<void> {
    console.log(`Verify the network filter label is: ${expectedText}`);
    await this.driver.waitForSelector({
      css: this.networksToggle,
      text: expectedText,
    });
  }

  async getLabel(): Promise<string> {
    console.log('Retrieving the network filter label');
    const toggle = await this.driver.findElement(this.networksToggle);
    return await toggle.getText();
  }

  /**
   * Opens the select network modal. Await `SelectNetworkModal.checkPageIsLoaded`
   * to wait for that modal.
   */
  async open(): Promise<void> {
    console.log('Opening the network filter');
    await this.waitForToggleStable();
    await this.driver.clickElement(this.networksToggle);
  }

  /**
   * Waits until the network filter toggle is present, visible, and no longer
   * remounting/moving before interaction. Guards against post-network-switch
   * re-renders of the asset list control bar.
   */
  private async waitForToggleStable(): Promise<void> {
    console.log('Waiting for network filter toggle to be stable');
    await this.driver.waitUntil(
      async () => {
        return await this.driver.isElementPresentAndVisible(
          this.networksToggle,
          1000,
        );
      },
      { timeout: 15000, interval: 200, stableFor: 1000 },
    );
    await this.driver.waitForElementToStopMoving(this.networksToggle);
  }

  /**
   * Waits until the network filter displays the given label.
   *
   * @param label - The label to wait for.
   */
  async waitUntilLabelIs(label: string): Promise<void> {
    console.log(`Waiting until the filter label is ${label}`);
    await this.driver.waitUntil(
      async () => {
        const currentLabel = await this.getLabel();
        return currentLabel === label;
      },
      { timeout: 5000, interval: 100 },
    );
  }
}

export default NetworkFilter;
