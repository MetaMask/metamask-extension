import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';

class HeaderNavbar {
  protected driver: Driver;

  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

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

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openGlobalNetworksMenu(): Promise<void> {
    console.log('Open global menu');
    await this.driver.clickElement(this.threeDotMenuButton);
    await this.driver.clickElement(this.globalNetworksMenu);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
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
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.waitForSelector('.multichain-account-menu-popover__list');
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

  async openThreeDotMenu(): Promise<void> {
    console.log('Open account options menu');
    await this.driver.waitForSelector(this.threeDotMenuButton, {
      state: 'enabled',
    });
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      await this.driver.clickElementUsingMouseMove(this.threeDotMenuButton);
    } else {
      this.driver.clickElement(this.threeDotMenuButton);
    }
  }

  async openPermissionsPage(): Promise<void> {
    console.log('Open permissions page in header navbar');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.allPermissionsButton);
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
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.notificationsButton);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_notificationCountInMenuOption(count: number): Promise<void> {
    await this.openThreeDotMenu();
    await this.driver.findElement({
      css: this.notificationCountOption,
      text: count.toString(),
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_ifNetworkPickerClickable(clickable: boolean): Promise<void> {
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_accountAddress(expectedAddress: string): Promise<void> {
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_accountLabel(expectedLabel: string): Promise<void> {
    console.log(
      `Verify the displayed account label in header is: ${expectedLabel}`,
    );
    await this.driver.waitForSelector({
      css: this.accountMenuButton,
      text: expectedLabel,
    });
  }
}

export default HeaderNavbar;
