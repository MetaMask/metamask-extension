import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

  private accountOptionsMenuButton: string;
  private readonly accountOptionMenu =
    '[data-testid="account-options-menu-button"]';

  private readonly accountSnapButton = { text: 'Snaps', tag: 'div' };

  private notificationsMenuItem: string;

  private readonly lockMetaMaskButton = '[data-testid="global-menu-lock"]';

  private readonly mmiPortfolioButton =
    '[data-testid="global-menu-mmi-portfolio"]';

  private readonly settingsButton = '[data-testid="global-menu-settings"]';

  constructor(driver: Driver) {
    this.driver = driver;
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionsMenuButton =
      '[data-testid="account-options-menu-button"]';
    this.notificationsMenuItem = '[data-testid="notifications-menu-item"]'
    this.mmiPortfolioButton = '[data-testid="global-menu-mmi-portfolio"]';
    this.settingsButton = '[data-testid="global-menu-settings"]';
    this.accountSnapButton = { text: 'Snaps', tag: 'div' };
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountMenuButton,
        this.accountOptionMenu,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for header navbar to be loaded', e);
      throw e;
    }
    console.log('Header navbar is loaded');
  }

  async lockMetaMask(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
    // fix race condition with mmi build
    if (process.env.MMI) {
      await this.driver.waitForSelector(this.mmiPortfolioButton);
    }
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async openSnapListPage(): Promise<void> {
    console.log('Open account snap page');
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.clickElement(this.accountSnapButton);
  }

  async openSettingsPage(): Promise<void> {
    console.log('Open settings page');
    await this.driver.clickElement(this.accountMenuButton);
    // fix race condition with mmi build
    if (process.env.MMI) {
      await this.driver.waitForSelector(this.mmiPortfolioButton);
    }
    await this.driver.clickElement(this.settingsButton);
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

  async goToNotifiationsList(): Promise<void> {
    await this.driver.clickElement(this.accountOptionsMenuButton);
    await this.driver.clickElement(this.notificationsMenuItem)
  }
}

export default HeaderNavbar;
