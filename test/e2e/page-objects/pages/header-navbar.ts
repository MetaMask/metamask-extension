import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { largeDelayMs } from '../../helpers';

class HeaderNavbar {
  protected driver: Driver;

  private readonly accountDetailsTab = { text: 'Details', tag: 'button' };

  private readonly accountListPage = '.account-list-page';

  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

  private readonly accountSnapButton = { text: 'Snaps', tag: 'div' };

  private readonly allPermissionsButton =
    '[data-testid="global-menu-connected-sites"]';

  private readonly connectedSitePopoverNetworkButton =
    '[data-testid="connected-site-popover-network-button"]';

  private readonly connectionMenu = '[data-testid="connection-menu"]';

  private readonly copyAddressButton = '[aria-label="Copy address"]';

  private readonly drawerBackButton = '[data-testid="drawer-close-button"]';

  private readonly firstTimeTurnOnNotificationsButton =
    '[data-testid="turn-on-notifications-button"]';

  private readonly globalMenuButton =
    '[data-testid="account-options-menu-button"]';

  private readonly globalNetworksMenu = '[data-testid="global-menu-networks"]';

  private readonly lockMetaMaskButton = '[data-testid="global-menu-lock"]';

  private readonly networkAddressesLink =
    '[data-testid="networks-subtitle-test-id"]';

  private readonly networkOption = (networkId: string) =>
    `[data-testid="${networkId}"]`;

  private readonly networkPicker = '.mm-picker-network';

  private readonly notificationCounterMenuIcon = {
    testId: 'notifications-tag-counter__unread-dot',
  };

  private readonly notificationCountOption =
    '[data-testid="global-menu-notification-count"]';

  private readonly notificationsButton =
    '[data-testid="notifications-menu-item"]';

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

  async openGlobalNetworksMenu(): Promise<void> {
    console.log('Open global menu');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.globalNetworksMenu);
  }

  async openGlobalMenu({
    withNotificationCounter = false,
  } = {}): Promise<void> {
    console.log('Open account options menu');
    if (withNotificationCounter) {
      // To avoid ElementIntercept error because of the notification overlap
      await this.driver.clickElementUsingMouseMove(this.globalMenuButton);
    } else {
      // Sometimes the notification counter briefly appears and disappears overlapping the menu icon
      await this.driver.assertElementNotPresent(
        this.notificationCounterMenuIcon,
        {
          waitAtLeastGuard: largeDelayMs,
        },
      );
      await this.driver.clickElement(this.globalMenuButton);
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

  async enableNotifications(): Promise<void> {
    console.log('Enabling notifications for the first time');
    await this.openGlobalMenu();
    await this.driver.clickElement(this.notificationsButton);
    await this.driver.clickElement(this.firstTimeTurnOnNotificationsButton);
  }

  async goToNotifications(): Promise<void> {
    console.log('Click notifications button');
    await this.driver.clickElement(this.notificationsButton);
  }

  async clickNotificationsOptions(): Promise<void> {
    console.log('Click notifications options');
    await this.openGlobalMenu({ withNotificationCounter: true });
    await this.driver.clickElement(this.notificationsButton);
  }

  async checkNotificationCountInMenuOption(count: number): Promise<void> {
    await this.openGlobalMenu({ withNotificationCounter: true });
    await this.driver.findElement({
      css: this.notificationCountOption,
      text: count.toString(),
    });
  }

  async clickNotificationCount(count: number): Promise<void> {
    await this.openGlobalMenu({ withNotificationCounter: true });
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
