/**
 * BUGBOT PROBE ONLY — intentional POM anti-patterns for MMQA-2248 CI validation.
 * Remove after confirming Bugbot catches these on the PR.
 */
import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';

// 3.3 — locator defined in a flow file
const accountMenuButton = '[data-testid="account-menu-icon"]';

/**
 * 3.3 — raw locator used with driver in a flow
 * 3.4 — flow that only instantiates a single page object
 * 3.7 — hardcoded delay without justifying comment
 * @param driver
 */
export async function openAccountMenuFromProbe(driver: Driver): Promise<void> {
  await driver.clickElement(accountMenuButton);
  await driver.delay(2000);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
}
