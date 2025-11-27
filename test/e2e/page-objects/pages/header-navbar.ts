import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  protected driver: Driver;

  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

  private readonly accountListPage = '.account-list-page';

  private readonly allPermissionsButton =
    '[data-testid="global-menu-connected-sites"]';

  private readonly copyAddressButton = '[data-testid="app-header-copy-button"]';

  private readonly threeDotMenuButton =
    '[data-testid="account-options-menu-button"]';

  private readonly accountSnapButton = { text: 'Snaps', tag: 'div' };

  private readonly lockMetaMaskButton = '[data-testid="global-menu-lock"]';

  private readonly openAccountDetailsButton =
    '[data-testid="account-list-menu-details"]';

  private readonly accountDetailsTab = { text: 'Details', tag: 'button' };

  private readonly settingsButton = '[data-testid="global-menu-settings"]';

  private readonly networkPicker = '.mm-picker-network';

  private readonly notificationsButton =
    '[data-testid="notifications-menu-item"]';

  private readonly notificationCountOption =
    '[data-testid="global-menu-notification-count"]';

  private readonly firstTimeTurnOnNotificationsButton =
    '[data-testid="turn-on-notifications-button"]';

  private readonly globalNetworksMenu = '[data-testid="global-menu-networks"]';

  private readonly connectionMenu = '[data-testid="connection-menu"]';

  private readonly connectedSitePopoverNetworkButton =
    '[data-testid="connected-site-popover-network-button"]';

  private readonly networkOption = (networkId: string) =>
    `[data-testid="${networkId}"]`;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountMenuButton,
        this.threeDotMenuButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for header navbar to be loaded', e);
      throw e;
    }
    console.log('Header navbar is loaded');
  }

  async clickAddressCopyButton(): Promise<void> {
    await this.driver.clickElement(this.copyAddressButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.lockMetaMaskButton);
    await this.driver.waitForSelector('[data-testid="unlock-password"]');
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.waitForSelector('.multichain-account-menu-popover__list');
  }

  async openAccountsPage(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.waitForSelector(this.accountListPage);
  }

  async openAccountDetailsModalDetailsTab(): Promise<void> {
    console.log('Open account details modal');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.openAccountDetailsButton);
    await this.driver.clickElementSafe(this.accountDetailsTab);
  }

  async openAccountDetailsModal(): Promise<void> {
    console.log('Open account details modal');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.openAccountDetailsButton);
  }

  async openGlobalNetworksMenu(): Promise<void> {
    console.log('Open global menu');
    await this.driver.clickElement(this.threeDotMenuButton);
    await this.driver.clickElement(this.globalNetworksMenu);
  }

  async openThreeDotMenu(): Promise<void> {
    console.log('Open account options menu');
    await this.driver.waitForSelector(this.threeDotMenuButton, {
      state: 'enabled',
    });
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      await this.driver.clickElementUsingMouseMove(this.threeDotMenuButton);
    } else {
      await this.driver.clickElement(this.threeDotMenuButton);
    }
  }

  async mouseClickOnThreeDotMenu(): Promise<void> {
    console.log('Clicking three dot menu using mouse move');
    await this.driver.clickElementUsingMouseMove(this.threeDotMenuButton);
  }

  /**
   * Opens the permissions page.
   * Handles both flows:
   * - Regular flow: Click "All Permissions" → Goes directly to Permissions Page
   * - Gator flow (Flask): Click "All Permissions" → Gator Permissions Page → Click "Sites" → Permissions Page
   *
   * @param options - Optional configuration
   * @param options.skipSitesNavigation - If true, stops at Gator Permissions Page without clicking "Sites" (only relevant for Gator flow)
   */
  async openPermissionsPage(options?: {
    skipSitesNavigation?: boolean;
  }): Promise<void> {
    console.log('Open permissions page in header navbar');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.allPermissionsButton);

    // Check if we landed on Gator Permissions Page (intermediate page for Flask builds)
    // If so, we need to click "Sites" to get to the actual Permissions Page
    const isGatorPermissionsPage = await this.driver
      .findElement('[data-testid="gator-permissions-page"]')
      .then(() => true)
      .catch(() => false);

    if (isGatorPermissionsPage && !options?.skipSitesNavigation) {
      console.log(
        'Detected Gator Permissions Page, clicking "Sites" to navigate to Permissions Page',
      );
      await this.driver.clickElement({ text: 'Sites', tag: 'p' });
    }
  }

  async openSnapListPage(): Promise<void> {
    console.log('Open account snap page');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.accountSnapButton);
  }

  async openSettingsPage(): Promise<void> {
    console.log('Open settings page');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.settingsButton);
  }

  async enableNotifications(): Promise<void> {
    console.log('Enabling notifications for the first time');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.notificationsButton);
    await this.driver.clickElement(this.firstTimeTurnOnNotificationsButton);
  }

  async goToNotifications(): Promise<void> {
    console.log('Click notifications button');
    await this.driver.clickElement(this.notificationsButton);
  }

  async clickNotificationsOptions(): Promise<void> {
    console.log('Click notifications options');
    await this.mouseClickOnThreeDotMenu();
    await this.driver.clickElement(this.notificationsButton);
  }

  async checkNotificationCountInMenuOption(count: number): Promise<void> {
    await this.mouseClickOnThreeDotMenu();
    await this.driver.findElement({
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
   * Open the connection menu
   */
  async openConnectionMenu(): Promise<void> {
    console.log('Opening connection menu');
    await this.driver.clickElement(this.connectionMenu);
  }

  /**
   * Click the connected site popover network button
   */
  async clickConnectedSitePopoverNetworkButton(): Promise<void> {
    console.log('Clicking connected site popover network button');
    await this.driver.clickElement(this.connectedSitePopoverNetworkButton);
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
