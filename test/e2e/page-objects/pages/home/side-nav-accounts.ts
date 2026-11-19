import { Driver } from '../../../webdriver/driver';

/**
 * Accounts section of the side navigation (wide screen layout only): a header with
 * search/manage/add actions above the account list.
 *
 * Screen: chrome component (not a full page), rendered in the side nav on
 * routes that show it. It does not exist in the narrow layout.
 * Owns: the section itself and its header actions.
 * Boundaries: the section chrome only. The account list screen reached from the
 * manage action belongs to `AccountListPage`. Layout-agnostic entry points
 * (e.g. opening the account menu in either layout) belong to `HeaderNavbar`.
 * Related: `HeaderNavbar`, `MainNav`, `AccountListPage`.
 *
 * @see ui/components/app/side-nav/side-nav-accounts.tsx
 */
class SideNavAccounts {
  private readonly accountMenuButton = '[data-testid="account-menu-icon"]';

  private readonly driver: Driver;

  private readonly section = '[data-testid="side-nav-accounts"]';

  private readonly sectionHeader =
    '[data-testid="side-nav-accounts"] > div:first-child';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Clicks the manage accounts button, revealing it first.
   */
  async clickManageAccounts(): Promise<void> {
    console.log('Click manage accounts in side nav');
    await this.revealActions();
    await this.driver.clickElement(this.accountMenuButton);
  }

  /**
   * Whether the accounts section is currently rendered and visible.
   *
   * @param timeout - How long to wait for it to appear, in milliseconds.
   * @returns True when the section is present and visible.
   */
  async isPresentAndVisible(timeout?: number): Promise<boolean> {
    return await this.driver.isElementPresentAndVisible(this.section, timeout);
  }

  /**
   * Hovers the section until its actions are revealed.
   */
  private async revealActions(): Promise<void> {
    // The side nav hides its account actions until it is is hovered, so
    // hover it before looking for the button. Each attempt moves the pointer
    // to the section and then its header: Firefox drops its hover state when the
    // page re-renders, and WebDriver skips a move to the position it believes
    // the pointer is already at, so a single repeated hover would never
    // re-trigger it.
    await this.driver.waitUntil(
      async () => {
        await this.driver.hoverElement(
          await this.driver.findElement(this.section),
        );
        await this.driver.hoverElement(
          await this.driver.findElement(this.sectionHeader),
        );
        return await this.driver.isElementPresentAndVisible(
          `${this.section}:hover ${this.accountMenuButton}`,
          200,
        );
      },
      { timeout: this.driver.timeout, interval: 200 },
    );
  }
}

export default SideNavAccounts;
