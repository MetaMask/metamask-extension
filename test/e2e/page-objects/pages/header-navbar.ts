import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;

  private accountOptionMenu: string;

  private lockMetaMaskButton: string;

  private closeButton: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionMenu = '[data-testid="account-options-menu-button"]';
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
    this.closeButton = '.mm-box button[aria-label="Close"]';
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async closeAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.closeButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.driver.clickElement(this.accountOptionMenu);
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async closeModal(): Promise<void> {
    await this.driver.clickElement(this.closeButton);
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
