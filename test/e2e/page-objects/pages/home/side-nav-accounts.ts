import { Driver } from '../../../webdriver/driver';

/**
 * Accounts section of the side navigation (wide screen layout only): a header with
 * search/manage/add actions above the account list.
 *
 * Screen: chrome component (not a full page), rendered in the side nav on
 * routes that show it. It does not exist in the narrow layout.
 * Owns: the section itself, its header actions (search, manage accounts, add
 * wallet) and its account list (selecting an account, checking which accounts
 * are listed).
 * Boundaries: the section chrome only. The screens its actions open belong to
 * their own page objects (`AccountListPage`, `ChooseWalletTypePage`). Opening
 * the account menu in whichever layout is rendered belongs to the
 * `openAccountMenu` flow (`flows/account-menu.flow.ts`).
 * Related: `HeaderNavbar`, `MainNav`, `AccountListPage`, `ChooseWalletTypePage`.
 *
 * @see ui/components/app/side-nav/side-nav-accounts.tsx
 * @see ui/components/app/side-nav/side-nav-account-cell.tsx
 */
// How long a single click attempt waits for a revealed button, in milliseconds.
const CLICK_ATTEMPT_TIMEOUT = 2000;

class SideNavAccounts {
  private readonly accountCellName =
    '[data-testid="side-nav-account-cell-name"]';

  private readonly accountCellSelectButton = (accountName: string) =>
    `[data-testid="side-nav-accounts"] [data-testid^="side-nav-account-cell-select-"][aria-label="${accountName}"]`;

  private readonly addWalletButton =
    '[data-testid="side-nav-accounts-add-button"]';

  private readonly driver: Driver;

  private readonly manageAccountsButton = '[data-testid="account-menu-icon"]';

  private readonly noResultsMessage =
    '[data-testid="side-nav-accounts-no-results"]';

  private readonly searchButton =
    '[data-testid="side-nav-accounts-search-button"]';

  private readonly searchInput =
    '[data-testid="side-nav-accounts-search-input"]';

  private readonly section = '[data-testid="side-nav-accounts"]';

  private readonly sectionHeader =
    '[data-testid="side-nav-accounts"] > div:first-child';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Verifies that an account is listed in the side nav
  async checkAccountIsListed(accountName: string): Promise<void> {
    console.log(`Check account "${accountName}" is listed in side nav`);
    await this.driver.waitForSelector({
      css: this.accountCellName,
      text: accountName,
    });
  }

  // Verifies that an account is not listed in the side nav
  async checkAccountIsNotListed(accountName: string): Promise<void> {
    console.log(`Check account "${accountName}" is not listed in side nav`);
    await this.driver.assertElementNotPresent({
      css: this.accountCellName,
      text: accountName,
    });
  }

  // Verifies that the side nav reports that no account matches the search
  async checkNoAccountsFound(): Promise<void> {
    console.log('Check side nav shows no accounts found');
    await this.driver.waitForSelector(this.noResultsMessage);
  }

  // Clicks the add wallet button
  async clickAddWallet(): Promise<void> {
    console.log('Click add wallet in side nav');
    await this.revealAndClick(this.addWalletButton);
  }

  // Clicks the manage accounts button
  async clickManageAccounts(): Promise<void> {
    console.log('Click manage accounts in side nav');
    await this.revealAndClick(this.manageAccountsButton);
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
   * Hovers the section until the given header action is revealed.
   * Each hover attempt moves the pointer to the section and then its header:
   * Firefox drops its hover state when the page re-renders, and WebDriver skips
   * a move to the position it believes the pointer is already at, so a single
   * repeated hover would never re-trigger it.
   *
   * @param actionButton - Selector of the header action to reveal.
   */
  private async revealActions(actionButton: string): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        await this.driver.hoverElement(
          await this.driver.findElement(this.section),
        );
        await this.driver.hoverElement(
          await this.driver.findElement(this.sectionHeader),
        );
        return await this.driver.isElementPresentAndVisible(
          `${this.section}:hover ${actionButton}`,
          200,
        );
      },
      { timeout: this.driver.timeout, interval: 200 },
    );
  }

  /**
   * Reveals a header action, then clicks it.
   *
   * The reveal only lasts while the pointer stays over the section, and the
   * page can re-render in between and drop it. Revealing and clicking are
   * therefore one attempt, with a short click timeout so a button that has
   * hidden again fails fast, and the next attempt hovers the section again.
   *
   * @param actionButton - Selector of the header action to click.
   */
  private async revealAndClick(actionButton: string): Promise<void> {
    let lastFailure = 'the button was never revealed';
    try {
      await this.driver.waitUntil(
        async () => {
          try {
            await this.revealActions(actionButton);
            await this.driver.clickElement(actionButton, {
              retries: 1,
              timeout: CLICK_ATTEMPT_TIMEOUT,
            });
            return true;
          } catch (error) {
            lastFailure = String(error);
            console.log(`Retrying side nav click after: ${lastFailure}`);
            return false;
          }
        },
        { timeout: this.driver.timeout * 2, interval: 200 },
      );
    } catch (error) {
      throw new Error(
        `Could not click ${actionButton} in the side nav. Last failure: ${lastFailure}`,
        { cause: error },
      );
    }
  }

  // Filters the side nav account list by the given text
  async searchAccounts(searchText: string): Promise<void> {
    console.log(`Search side nav accounts for "${searchText}"`);
    // The search button toggles the search box, so only press it when closed.
    if (
      !(await this.driver.isElementPresentAndVisible(this.searchInput, 200))
    ) {
      await this.revealAndClick(this.searchButton);
    }
    await this.driver.fill(this.searchInput, searchText);
  }

  // Selects an account by clicking its row in the side nav list
  async selectAccount(accountName: string): Promise<void> {
    console.log(`Select account "${accountName}" in side nav`);
    await this.driver.clickElement(this.accountCellSelectButton(accountName));
  }
}

export default SideNavAccounts;
