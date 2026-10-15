import { Driver } from '../../../webdriver/driver';

/**
 * Inline network selector popover on the dapp connection control bar.
 *
 * Screen: popover anchored to the network control in the dapp connection bar
 * (replaces the older full-screen network picker for switching a connected
 * dapp's network). Opened from the dapp connection control bar network button.
 * Owns: popover/list presence, network option visibility by display name, and
 * selecting a network (popover auto-closes on selection).
 * Boundaries: stops at the popover. Opening it belongs to the dapp connection
 * control bar / confirmation chrome. Broader network management belongs to
 * `pages/networks/*`.
 * Related: `pages/networks/*`, `DappConnectionControlBar` UI.
 *
 * @see ui/components/multichain/dapp-connection-control-bar/dapp-bar-network-selector-popover.tsx
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
