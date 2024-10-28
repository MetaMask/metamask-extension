import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

  private readonly threeDotMenuButton =
    '[data-testid="account-options-menu-button"]';

  private readonly accountSnapButton = { text: 'Snaps', tag: 'div' };

  private readonly lockMetaMaskButton = '[data-testid="global-menu-lock"]';

  private readonly mmiPortfolioButton =
    '[data-testid="global-menu-mmi-portfolio"]';

  private readonly settingsButton = '[data-testid="global-menu-settings"]';

  private readonly switchNetworkDropDown = '[data-testid="network-display"]';

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
  }

  async openThreeDotMenu(): Promise<void> {
    console.log('Open account options menu');
    await this.driver.clickElement(this.threeDotMenuButton);
    // fix race condition with mmi build
    if (process.env.MMI) {
      await this.driver.waitForSelector(this.mmiPortfolioButton);
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
