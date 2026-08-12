/**
 * BUGBOT PROBE ONLY — intentional POM anti-patterns for MMQA-2248 CI validation.
 * Remove after confirming Bugbot catches these on the PR.
 */
import { Driver } from '../../../webdriver/driver';
import HeaderNavbar from '../header-navbar';
import HomePage from '../home/homepage';

class BugbotProbePage {
  private readonly driver: Driver;

  private readonly nextButton = '[data-testid="page-container-footer-next"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * 3.8 — page object imports and invokes other page objects
   * 3.9 — try/catch in a page object
   */
  async goHomeAndOpenAccountMenu(): Promise<void> {
    try {
      const homePage = new HomePage(this.driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(this.driver);
      await headerNavbar.openAccountMenu();
      await this.driver.clickElement(this.nextButton);
    } catch (error) {
      console.log('Probe swallowed error', error);
    }
  }
}

export default BugbotProbePage;
