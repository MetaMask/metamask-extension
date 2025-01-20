import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';

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

  private readonly mmiPortfolioButton =
    '[data-testid="global-menu-mmi-portfolio"]';

  private readonly openAccountDetailsButton =
    '[data-testid="account-list-menu-details"]';

  private readonly settingsButton = '[data-testid="global-menu-settings"]';

  private readonly switchNetworkDropDown = '[data-testid="network-display"]';

  private readonly networkPicker = '.mm-picker-network';

  constructor(driver: Driver) {
    this.driver = driver;
  }

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

  async lockMetaMask(): Promise<void> {
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.waitForSelector('.multichain-account-menu-popover__list');
  }

  async openAccountDetailsModal(): Promise<void> {
    console.log('Open account details modal');
    await this.openThreeDotMenu();
    await this.driver.clickElement(this.openAccountDetailsButton);
  }

  async openThreeDotMenu(): Promise<void> {
    console.log('Open account options menu');
    await this.driver.clickElement(this.threeDotMenuButton);
    // fix race condition with mmi build
    if (process.env.MMI) {
      await this.driver.waitForSelector(this.mmiPortfolioButton);
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

  async clickSwitchNetworkDropDown(): Promise<void> {
    console.log(`Click switch network menu`);
    await this.driver.clickElement(this.switchNetworkDropDown);
  }

  async check_currentSelectedNetwork(networkName: string): Promise<void> {
    console.log(`Validate the Switch network to ${networkName}`);
    await this.driver.waitForSelector(
      `button[data-testid="network-display"][aria-label="Network Menu ${networkName}"]`,
    );
  }

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
