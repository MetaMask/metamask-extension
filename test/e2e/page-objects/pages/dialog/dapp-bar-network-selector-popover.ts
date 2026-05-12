import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the inline network selector popover that is anchored to
 * the network button in the Dapp Connection Control Bar (replaces the old
 * full-screen network picker when switching networks for a connected dapp).
 */
class DappBarNetworkSelectorPopover {
  private driver: Driver;

  private readonly networkOptionByName = (networkName: string) =>
    `${this.popover} [data-testid="${networkName}"]`;

  private readonly popover =
    '[data-testid="dapp-bar-network-selector-popover"]';

  private readonly popoverList =
    '[data-testid="dapp-bar-network-selector-popover__list"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.popover,
        this.popoverList,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for dapp bar network selector popover to be loaded',
        e,
      );
      throw e;
    }
    console.log('Dapp bar network selector popover is loaded');
  }

  /**
   * Check whether a network option is displayed inside the popover.
   *
   * @param networkName - Display name of the network (e.g. 'Ethereum',
   * 'Goerli'). Must match the `data-testid` rendered by `NetworkListItem`,
   * which uses the network's display name.
   * @param shouldBeDisplayed - Whether the network should be displayed.
   * Defaults to true.
   */
  async checkNetworkOptionIsDisplayed(
    networkName: string,
    shouldBeDisplayed: boolean = true,
  ): Promise<void> {
    console.log(
      `Check if ${networkName} is ${
        shouldBeDisplayed ? 'displayed' : 'not displayed'
      } in dapp bar network selector popover`,
    );
    const selector = this.networkOptionByName(networkName);
    if (shouldBeDisplayed) {
      await this.driver.waitForSelector(selector);
    } else {
      await this.driver.assertElementNotPresent(selector, {
        waitAtLeastGuard: 1000,
      });
    }
  }

  /**
   * Select a network from the popover by display name. Dismisses the popover
   * as a side effect of the click (the popover auto-closes on selection).
   *
   * @param networkName - Display name of the network (e.g. 'Ethereum').
   */
  async selectNetworkByName(networkName: string): Promise<void> {
    console.log(
      `Selecting network ${networkName} from dapp bar network selector popover`,
    );
    await this.driver.clickElement(this.networkOptionByName(networkName));
  }
}

export default DappBarNetworkSelectorPopover;
