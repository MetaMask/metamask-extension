import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  protected driver: Driver;

  private readonly accountDetailsTab = { text: 'Details', tag: 'button' };

  private readonly accountListPage = '.account-list-page';

  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

  private readonly accountSnapButton = { text: 'Snaps', tag: 'div' };

  private readonly allPermissionsButton =
    '[data-testid="global-menu-connected-sites"]';

  private readonly copyAddressButton = '[aria-label="Copy address"]';

  private readonly drawerBackButton = '[data-testid="drawer-close-button"]';

  private readonly globalMenuButton =
    '[data-testid="account-options-menu-button"]';

  private readonly globalNetworksMenu = '[data-testid="global-menu-networks"]';

  private readonly dappConnectionControlBar =
    '[data-testid="dapp-connection-control-bar"]';

  private readonly dappNetworkButton =
    '[data-testid="dapp-connection-control-bar__network-button"]';

  private readonly lockMetaMaskButton = '[data-testid="global-menu-lock"]';

  private readonly networkAddressesLink =
    '[data-testid="networks-subtitle-test-id"]';

  private readonly networkOption = (networkId: string) =>
    `[data-testid="${networkId}"]`;

  private readonly selectedNetworkItem = (networkName: string) =>
    `.multichain-network-list-item--selected [data-testid="${networkName}"]`;

  private readonly networkPicker = '.mm-picker-network';

  private readonly notificationCountOption =
    '[data-testid="global-menu-notification-count"]';

  private readonly notificationsButton =
    '[data-testid="notifications-menu-item"]';

  private readonly notificationsPage = '[data-testid="notifications-page"]';

  private readonly openAccountDetailsButton =
    '[data-testid="account-list-menu-details"]';

  private readonly settingsButton = '[data-testid="global-menu-settings"]';

  private readonly contactsButton = '[data-testid="global-menu-contacts"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountMenuButton,
        this.globalMenuButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for header navbar to be loaded', e);
      throw e;
    }
    console.log('Header navbar is loaded');
  }

  async clickAddressCopyButton(): Promise<void> {
    await this.driver.clickElement(this.networkAddressesLink);
    await this.driver.clickElement(this.copyAddressButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.openGlobalMenu();
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.waitForSelector(this.accountListPage);
  }

  async openAccountDetailsModalDetailsTab(): Promise<void> {
    console.log('Open account details modal');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.openAccountDetailsButton);
    await this.driver.clickElementSafe(this.accountDetailsTab);
  }

  async openAccountDetailsModal(): Promise<void> {
    console.log('Open account details modal');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.openAccountDetailsButton);
  }

  async openGlobalNetworksMenu({
    isDrawerOpen = false,
  }: {
    isDrawerOpen?: boolean;
  } = {}): Promise<void> {
    console.log('Open global menu networks Page');
    if (!isDrawerOpen) {
      await this.openGlobalMenu();
    }
    await this.driver.clickElement(this.globalNetworksMenu);
  }

  async openGlobalMenu(): Promise<void> {
    console.log('Open account options menu');
    // Use a normal click by default — it is reliable in headless and already
    // retries on ElementClickInterceptedError. A notification counter badge can
    // overlap the menu icon and intercept the click; if it persists through those
    // retries, fall back to a mouse-move click that targets an offset clear of the
    // badge. We intentionally do NOT wait for the badge to disappear
    // (assertElementNotPresent), which blocks for the full driver timeout when the
    // badge is legitimately present (e.g. unread notifications).
    try {
      await this.driver.clickElement(this.globalMenuButton);
    } catch {
      await this.driver.clickElementUsingMouseMove(this.globalMenuButton);
    }
    await this.driver.waitForElementToStopMoving(this.drawerBackButton);
  }

  async clickDrawerBackButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.drawerBackButton);
  }

  /**
   * Clicks the "All Permissions" (Connected Sites) button in the header menu.
   * This may land on the Permissions Page directly, or on the Gator Permissions Page (Flask builds).
   * Use openPermissionsPageFlow for the full flow that navigates to the Permissions Page.
   */
  async clickAllPermissionsButton(): Promise<void> {
    console.log('Click All Permissions button in header navbar');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.allPermissionsButton);
  }

  async openSnapListPage(): Promise<void> {
    console.log('Open account snap page');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.accountSnapButton);
  }

  async openSettingsPage(): Promise<void> {
    console.log('Open settings page');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.settingsButton);
  }

  async openContactsPage(): Promise<void> {
    console.log('Open contacts page');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.contactsButton);
  }

  async navigateToNotificationsPage(): Promise<void> {
    console.log('Navigate to notifications page');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.notificationsButton);
    await this.driver.waitForSelector(this.notificationsPage);
  }

  async goToNotifications(): Promise<void> {
    await this.navigateToNotificationsPage();
  }

  async clickNotificationsOptions(): Promise<void> {
    console.log('Click notifications options');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.notificationsButton);
  }

  async checkNotificationCountInMenuOption(count: number): Promise<void> {
    await this.openGlobalMenu();
    await this.driver.findElement({
      css: this.notificationCountOption,
      text: count.toString(),
    });
  }

  /**
   * Verifies the notification count in the open global menu, waits for the
   * drawer to settle after React re-renders, then opens the notifications list.
   * @param count
   */
  async checkNotificationCountAndOpenNotifications(
    count: number,
  ): Promise<void> {
    console.log(
      `Verify notification count is ${count} and open notifications list`,
    );
    await this.openGlobalMenu();
    await this.driver.findElement({
      css: this.notificationCountOption,
      text: count.toString(),
    });
    await this.driver.waitForElementToStopMoving(this.drawerBackButton);
    await this.driver.waitForElementToStopMoving(this.notificationsButton);
    await this.driver.clickElement(this.notificationsButton);
  }

  async clickNotificationCount(count: number): Promise<void> {
    await this.openGlobalMenu();
    await this.driver.clickElement({
      css: this.notificationCountOption,
      text: count.toString(),
    });
  }

  async checkIfNetworkPickerClickable(clickable: boolean): Promise<void> {
    console.log('Check whether the network picker is clickable or not');
    assert.equal(
      await (await this.driver.findElement(this.networkPicker)).isEnabled(),
      clickable,
    );
  }

  /**
   * Verifies that the displayed account address in header matches the expected address.
   *
   * @param expectedAddress - The expected address of the account.
   */
  async checkAccountAddress(expectedAddress: string): Promise<void> {
    console.log(
      `Verify the displayed account address in header is: ${expectedAddress}`,
    );
    await this.driver.waitForSelector({
      css: this.copyAddressButton,
      text: expectedAddress,
    });
  }

  /**
   * Verifies that the displayed account label in header matches the expected label.
   *
   * @param expectedLabel - The expected label of the account.
   */
  async checkAccountLabel(expectedLabel: string): Promise<void> {
    console.log(
      `Verify the displayed account label in header is: ${expectedLabel}`,
    );
    await this.driver.waitForSelector({
      css: this.accountMenuButton,
      text: expectedLabel,
    });
  }

  /**
   * Open the dapp network selector from the connection control bar
   */
  async openDappNetworkMenu(): Promise<void> {
    console.log('Opening dapp network menu from control bar');
    await this.driver.clickElement(this.dappNetworkButton);
  }

  /**
   * Opens the connection menu popover and verifies the network shown for the
   * connected dapp matches the expected name.
   *
   * @param expectedNetwork - The network name expected to appear in the popover.
   */
  async checkConnectedSitePopoverNetwork(
    expectedNetwork: string,
  ): Promise<void> {
    console.log(
      `Verify the connected site popover network is: ${expectedNetwork}`,
    );
    await this.openDappNetworkMenu();
    await this.driver.waitForSelector(
      this.selectedNetworkItem(expectedNetwork),
    );
  }

  /**
   * Assert that the dapp connection control bar is rendered and that the
   * network picker button is NOT present for the currently active tab. Used
   * to validate the gating on `sessionProperties['eip1193-compatible']` in
   * the CAIP-25 caveat: pure Multichain API and non-EVM connections must not
   * show a network picker even when the bar itself is visible.
   */
  async checkDappNetworkButtonNotVisible(): Promise<void> {
    console.log(
      'Verify the dapp connection control bar network picker is NOT visible',
    );
    await this.driver.waitForSelector(this.dappConnectionControlBar);
    await this.driver.assertElementNotPresent(this.dappNetworkButton, {
      waitAtLeastGuard: 500,
    });
  }

  /**
   * Assert that the dapp connection control bar network picker button is
   * rendered for the currently active tab. Used to validate that EIP-1193
   * compatible connections (legacy `window.ethereum` and
   * `@metamask/connect-evm`) expose the network picker.
   */
  async checkDappNetworkButtonVisible(): Promise<void> {
    console.log(
      'Verify the dapp connection control bar network picker is visible',
    );
    await this.driver.waitForSelector(this.dappNetworkButton);
  }

  /**
   * Click the network addresses link
   */
  async clickNetworkAddresses(): Promise<void> {
    console.log('Click the network addresses link');
    await this.driver.clickElement(this.networkAddressesLink);
  }

  /**
   * Select a network from the network options
   *
   * @param networkId - The id of the network to select.
   */
  async selectNetwork(networkId: string): Promise<void> {
    console.log(`Selecting network ${networkId}`);
    await this.driver.clickElement(this.networkOption(networkId));
  }
}

export default HeaderNavbar;
