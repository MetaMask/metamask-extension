import { Driver } from '../../webdriver/driver';

class HeaderNavbar {
  private driver: Driver;

  private accountMenuButton: string;

  private accountOptionMenu: string;

  private lockMetaMaskButton: string;

  public switchNetworkDropDown: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountMenuButton = '[data-testid="account-menu-icon"]';
    this.accountOptionMenu = '[data-testid="account-options-menu-button"]';
    this.lockMetaMaskButton = '[data-testid="global-menu-lock"]';
    this.switchNetworkDropDown = '[data-testid="network-display"]';
  }

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement(this.accountMenuButton);
  }

  async lockMetaMask(): Promise<void> {
    await this.driver.clickElement(this.accountOptionMenu);
    await this.driver.clickElement(this.lockMetaMaskButton);
  }

  async clickSwitchNetworkDropDown(): Promise<void> {
    console.log(`Click switch network menu`);
    await this.driver.clickElement(this.switchNetworkDropDown);
  }

  async check_networkNameSwitchDropDown(networkName: string): Promise<boolean> {
    console.log(`Validate the Switch network to ${networkName}`);
    const switchNetworkName = await this.driver.findElements({
      tag: 'span',
      text: networkName,
    });
    return switchNetworkName.length === 1;
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
